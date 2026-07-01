/**
 * Motor de Recompra — KPI norte da Otimiza (Integrado ao GestãoClick)
 *
 * Funcionamento:
 *   1. Lê vendas do GestãoClick API dos últimos 400 dias.
 *   2. Para cada item de venda, cruza com `duracao_produtos.json` (Bravecto 90d, etc).
 *   3. Se data_venda + duracao - antecedencia <= hoje E não foi notificado, qualifica.
 *   4. Consulta detalhes do cliente para segmentar B2B (Veterinário) vs B2C (Tutor)
 *      e obter telefone de contato.
 *   5. Dispara WhatsApp via gateway da Z-API respeitando canary e limites.
 *   6. Salva logs em `notificacoes_recompra.json` para evitar duplicidade.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const whatsappGateway = require('../src/integracoes/whatsapp_gateway');

console.log(`[INICIO] motor_recompra_gestaoclick.js ${new Date().toISOString()}`);

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN;
const BASE_URL = "https://api.gestaoclick.com";
const DURACAO_FILE = path.resolve(__dirname, '../diretrizes-e-branding/duracao_produtos.json');
const NOTIF_FILE = path.resolve(__dirname, '../notificacoes_recompra.json');
const MAX_ENVIOS_DIA = parseInt(process.env.RECOMPRA_MAX_ENVIOS_DIA || '20', 10); // Segurança ativa de volume

if (!ACCESS_TOKEN || !SECRET_TOKEN) {
    console.error("❌ Credenciais do GestãoClick não configuradas — abortando.");
    process.exit(1);
}

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

// Cache de clientes em memória para evitar requests redundantes na mesma execução
const cacheClientes = new Map();

function carregarDuracoes() {
    try {
        const dados = JSON.parse(fs.readFileSync(DURACAO_FILE, 'utf8'));
        return dados.produtos || [];
    } catch (e) {
        console.error("❌ Erro ao carregar duracao_produtos.json:", e.message);
        return [];
    }
}

function carregarNotificados() {
    if (!fs.existsSync(NOTIF_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(NOTIF_FILE, 'utf8')); } catch (_) { return {}; }
}

function salvarNotificados(d) {
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(d, null, 2), 'utf8');
}

function limparTelefone(tel) {
    if (!tel) return null;
    let limpo = String(tel).replace(/\D/g, '');
    if (!limpo) return null;
    if (limpo.startsWith('55')) return limpo;
    if (limpo.length === 10 || limpo.length === 11) return `55${limpo}`;
    return limpo;
}

function casarProduto(titulo, regras) {
    const tit = (titulo || '').toLowerCase().trim();
    for (const r of regras) {
        for (const m of r.match) {
            if (tit.includes(m.toLowerCase().trim())) return r;
        }
    }
    return null;
}

async function buscarClientePorId(clienteId) {
    if (cacheClientes.has(clienteId)) {
        return cacheClientes.get(clienteId);
    }

    try {
        const response = await axios.get(`${BASE_URL}/clientes/${clienteId}`, { headers });
        const c = response.data && response.data.data ? response.data.data : null;
        if (c) {
            cacheClientes.set(clienteId, c);
        }
        return c;
    } catch (e) {
        console.error(`❌ Erro ao buscar detalhes do cliente ${clienteId}: ${e.message}`);
        return null;
    }
}

function extrairCrmv(c) {
    let crmv = c.crmv || null;
    if (!crmv && c.rg && c.rg.toLowerCase().includes('crmv')) {
        const match = c.rg.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    if (!crmv && c.inscricao_municipal && c.inscricao_municipal.toLowerCase().includes('crmv')) {
        const match = c.inscricao_municipal.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    if (!crmv && c.responsavel && c.responsavel.toLowerCase().includes('crmv')) {
        const match = c.responsavel.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    return crmv;
}

function classificarB2B(cliente) {
    const crmv = extrairCrmv(cliente);
    if (crmv) return true;

    if (cliente.tipo_pessoa === 'PJ') return true;

    const nome = (cliente.nome || '').toLowerCase();
    const razao = (cliente.razao_social || '').toLowerCase();
    const keywords = ['clinica', 'clínica', 'vet', 'veterinaria', 'veterinária', 'hospital', 'ltda', 'me', 'eireli'];

    for (const kw of keywords) {
        if (nome.includes(kw) || razao.includes(kw)) {
            return true;
        }
    }

    return false;
}

function extrairNomePet(venda, cliente) {
    const texts = [
        venda.observacoes || '',
        venda.observacoes_interna || '',
        cliente.observacoes || ''
    ];
    
    const regexes = [
        /pet[:\s]+([^\n\r|,\(\)]+)/i,
        /nome do pet[:\s]+([^\n\r|,\(\)]+)/i,
        /nome[:\s]+([^\n\r|,\(\)]+)/i
    ];
    
    for (const text of texts) {
        for (const regex of regexes) {
            const match = text.match(regex);
            if (match && match[1]) {
                const name = match[1].trim();
                if (name && !name.toLowerCase().includes('raça') && !name.toLowerCase().includes('idade')) {
                    return name;
                }
            }
        }
    }
    return 'seu pet';
}

async function rodar() {
    const regras = carregarDuracoes();
    const notificados = carregarNotificados();
    const hoje = new Date();
    
    console.log(`📡 Buscando histórico de vendas recentes do GestãoClick...`);
    
    let page = 1;
    let keepFetching = true;
    const candidatos = [];
    const limiteData = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 dias atrás

    while (keepFetching && page <= 15) { // Limite máximo de 15 páginas para segurança de rate-limit
        try {
            console.log(`   Página ${page}...`);
            const response = await axios.get(`${BASE_URL}/vendas?limit=100&page=${page}`, { headers });
            const vendas = response.data && response.data.data ? response.data.data : [];

            if (vendas.length === 0) {
                keepFetching = false;
                break;
            }

            for (const venda of vendas) {
                const dataVenda = new Date(venda.data);
                
                // Se a venda for mais antiga que 400 dias, paramos a paginação
                if (dataVenda < limiteData) {
                    console.log(`   Venda ID ${venda.id} de data ${venda.data} excede 400 dias. Finalizando paginação.`);
                    keepFetching = false;
                    break;
                }

                // Filtrar vendas canceladas ou excluídas
                const sit = (venda.nome_situacao || '').toLowerCase();
                if (sit.includes('cancelad') || sit.includes('excluid')) {
                    continue;
                }

                // Verificar se a venda contém produtos que constam nas regras de LTV
                for (const itemObj of (venda.produtos || [])) {
                    const item = itemObj.produto;
                    if (!item || !item.nome_produto) continue;

                    const regra = casarProduto(item.nome_produto, regras);
                    if (!regra) continue;

                    const dataGatilho = new Date(dataVenda.getTime() + (regra.duracao_dias - regra.antecedencia_dias) * 24 * 60 * 60 * 1000);

                    // Se a data de gatilho ainda está no futuro, ignora
                    if (dataGatilho > hoje) continue;

                    // Candidato elegível! Agora buscamos o cliente no GestãoClick para obter telefone e classificar B2B/B2C
                    const cliente = await buscarClientePorId(venda.cliente_id);
                    if (!cliente) continue;

                    const tel = limparTelefone(cliente.celular || cliente.telefone);
                    if (!tel) continue;

                    const isB2B = classificarB2B(cliente);
                    const nomeCliente = (cliente.nome || '').trim().split(' ')[0] || 'tudo bem';
                    const pet = isB2B ? null : extrairNomePet(venda, cliente);

                    // Trava básica: não notificar a mesma (venda x item)
                    const chave = `${tel}_${venda.id}_${item.produto_id}`;
                    if (notificados[chave]) continue;

                    candidatos.push({
                        chave,
                        tel,
                        nome: nomeCliente,
                        isB2B,
                        pet,
                        produto: item.nome_produto,
                        regra,
                        vendaId: venda.id,
                        dataVenda: venda.data
                    });
                }
            }

            if (!keepFetching) break;
            page++;
            await new Promise(r => setTimeout(r, 200)); // Pequena pausa anti-throttle
        } catch (e) {
            console.error(`❌ Erro ao buscar vendas na página ${page}:`, e.message);
            keepFetching = false;
        }
    }

    console.log(`📋 Candidatos qualificados encontrados: ${candidatos.length}`);
    if (candidatos.length === 0) {
        console.log(`[OK] Nada a enviar hoje.`);
        process.exit(0);
    }

    let enviados = 0;
    let falhas = 0;

    for (const c of candidatos) {
        if (enviados >= MAX_ENVIOS_DIA) {
            console.log(`🛑 Limite diário de ${MAX_ENVIOS_DIA} disparos atingido.`);
            break;
        }

        // Trava de Frequência: 1 lembrete por número a cada 14 dias (qualquer produto)
        const ultimaParaTel = Object.entries(notificados)
            .filter(([k]) => k.startsWith(`${c.tel}_`))
            .map(([, v]) => new Date(v.em).getTime())
            .sort((a, b) => b - a)[0];
            
        if (ultimaParaTel && (Date.now() - ultimaParaTel) < 14 * 24 * 60 * 60 * 1000) {
            console.log(`   Filtro Frequência: Skip +${c.tel} (já notificado nos últimos 14 dias)`);
            continue;
        }

        // Formatação do Template com base na segmentação
        let msg = "";
        if (c.isB2B) {
            msg = c.regra.mensagem_template_b2b || c.regra.mensagem_template;
            msg = msg.replace(/\{nome\}/g, c.nome);
        } else {
            msg = c.regra.mensagem_template;
            msg = msg.replace(/\{nome\}/g, c.nome).replace(/\{pet\}/g, c.pet || 'seu pet');
        }

        try {
            console.log(`🎯 [DISPARO] +${c.tel} (${c.nome} - ${c.isB2B ? 'B2B' : 'B2C'}) — ${c.produto}`);
            
            // DRY_RUN flag para testes seguros
            if (process.env.DRY_RUN === 'true') {
                console.log(`   [DRY RUN] Mensagem que seria enviada: "${msg}"`);
            } else {
                await whatsappGateway.enviarMensagemTexto(c.tel, msg, false);
            }

            notificados[c.chave] = {
                em: new Date().toISOString(),
                produto: c.produto,
                vendaId: c.vendaId,
                segmento: c.isB2B ? 'B2B' : 'B2C'
            };
            
            salvarNotificados(notificados);
            enviados++;
            
            if (process.env.DRY_RUN !== 'true') {
                // Intervalo de segurança contra SPAM do WhatsApp
                await new Promise(r => setTimeout(r, 6000 + Math.random() * 4000));
            }
        } catch (e) {
            console.error(`   ❌ Falhou ao enviar para ${c.tel}: ${e.message}`);
            falhas++;
        }
    }

    console.log(`[OK] Fim da execução. Enviados com sucesso: ${enviados}, falhas: ${falhas}`);

    // Relatório via Telegram (se configurado)
    if (enviados > 0 && process.env.TELEGRAM_BOT_TOKEN && process.env.DRY_RUN !== 'true') {
        const chatId = process.env.TELEGRAM_CHAT_ID || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
        if (chatId) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    text: `🎯 <b>Motor de Recompra GestãoClick</b>\n\n<b>Disparados:</b> ${enviados}\n<b>Falhas:</b> ${falhas}`
                });
            } catch (_) {}
        }
    }
}

rodar().catch(err => {
    console.error(`[ERRO CRITICO] ${err.message}`);
    process.exit(1);
});
