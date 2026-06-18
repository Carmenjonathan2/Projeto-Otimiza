/**
 * Motor de Recompra — KPI norte da Otimiza.
 *
 * Funcionamento:
 *   1. Lê pedidos do Shopify Admin API dos últimos 400 dias.
 *   2. Para cada item, cruza com `duracao_produtos.json` (Bravecto 90d, etc).
 *   3. Se data_pedido + duracao - antecedencia <= hoje E não foi notificado,
 *      envia WhatsApp via gateway (respeitando canary).
 *   4. Marca em `notificacoes_recompra.json` pra não duplicar.
 *
 * Rodar via cron diário 09:00 BRT (workflow `recompra.yml`).
 * Comando manual: `npm run motor-recompra`
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const whatsappGateway = require('../src/integracoes/whatsapp_gateway');
let custoMonitor = null;
try { custoMonitor = require('../src/observabilidade/custo_monitor'); } catch (_) {}

console.log(`[INICIO] motor_recompra.js ${new Date().toISOString()}`);

const SHOP_URL = process.env.SHOPIFY_SHOP_URL || "49mbh1-kp.myshopify.com";
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DURACAO_FILE = path.resolve(__dirname, '../diretrizes-e-branding/duracao_produtos.json');
const NOTIF_FILE = path.resolve(__dirname, '../notificacoes_recompra.json');
const MAX_ENVIOS_DIA = parseInt(process.env.RECOMPRA_MAX_ENVIOS_DIA || '30', 10);

if (!ACCESS_TOKEN) {
    console.error("❌ SHOPIFY_ACCESS_TOKEN não configurado — abortando.");
    process.exit(1);
}

function carregarDuracoes() {
    const dados = JSON.parse(fs.readFileSync(DURACAO_FILE, 'utf8'));
    return dados.produtos || [];
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
    const tit = (titulo || '').toLowerCase();
    for (const r of regras) {
        for (const m of r.match) {
            if (tit.includes(m)) return r;
        }
    }
    return null;
}

async function buscarPedidos() {
    const desde = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://${SHOP_URL}/admin/api/2024-01/orders.json?status=any&financial_status=paid&created_at_min=${desde}&limit=250`;
    try {
        const r = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN },
            timeout: 15000
        });
        return r.data.orders || [];
    } catch (e) {
        console.error(`❌ Erro ao buscar pedidos Shopify: ${e.response?.data?.errors || e.message}`);
        return [];
    }
}

async function rodar() {
    const regras = carregarDuracoes();
    const notificados = carregarNotificados();
    const pedidos = await buscarPedidos();

    if (pedidos.length === 0) {
        console.log("ℹ️ Nenhum pedido pago encontrado nos últimos 400 dias.");
        process.exit(0);
    }

    const hoje = new Date();
    const candidatos = [];

    for (const ped of pedidos) {
        const tel = limparTelefone(ped.customer?.phone || ped.shipping_address?.phone);
        if (!tel) continue;
        const nome = (ped.customer?.first_name || '').trim() || 'tudo bem';
        const pet = (ped.note || '').match(/pet[:\s]+([^\n]+)/i)?.[1]?.trim() || 'seu pet';

        for (const item of (ped.line_items || [])) {
            const regra = casarProduto(item.title, regras);
            if (!regra) continue;

            const dataPedido = new Date(ped.created_at);
            const dataGatilho = new Date(dataPedido.getTime() + (regra.duracao_dias - regra.antecedencia_dias) * 24 * 60 * 60 * 1000);

            if (dataGatilho > hoje) continue;

            // Trava: não notificar o mesmo (phone × line_item) duas vezes
            const chave = `${tel}_${ped.id}_${item.id}`;
            if (notificados[chave]) continue;

            // Trava extra: só 1 lembrete por phone nos últimos 14 dias (qualquer produto)
            const ultimaParaTel = Object.entries(notificados)
                .filter(([k]) => k.startsWith(`${tel}_`))
                .map(([, v]) => new Date(v.em).getTime())
                .sort((a, b) => b - a)[0];
            if (ultimaParaTel && (Date.now() - ultimaParaTel) < 14 * 24 * 60 * 60 * 1000) continue;

            candidatos.push({
                chave, tel, nome, pet,
                produto: item.title,
                regra,
                pedidoId: ped.id,
                dataPedido: dataPedido.toISOString()
            });
        }
    }

    console.log(`📋 ${candidatos.length} candidatos a recompra hoje.`);
    if (candidatos.length === 0) {
        console.log(`[OK] motor_recompra.js — nada a enviar.`);
        process.exit(0);
    }

    let enviados = 0;
    let falhas = 0;

    for (const c of candidatos) {
        if (enviados >= MAX_ENVIOS_DIA) {
            console.log(`🛑 Limite diário de ${MAX_ENVIOS_DIA} atingido.`);
            break;
        }
        const msg = c.regra.mensagem_template
            .replace(/\{nome\}/g, c.nome)
            .replace(/\{pet\}/g, c.pet);
        try {
            console.log(`🎯 Recompra: +${c.tel} (${c.nome}) — ${c.produto}`);
            await whatsappGateway.enviarMensagemTexto(c.tel, msg, false);
            notificados[c.chave] = {
                em: new Date().toISOString(),
                produto: c.produto,
                pedidoId: c.pedidoId
            };
            salvarNotificados(notificados);
            enviados++;
            await new Promise(r => setTimeout(r, 8000 + Math.random() * 4000));
        } catch (e) {
            console.error(`   ❌ Falhou: ${e.message}`);
            falhas++;
        }
    }

    console.log(`[OK] motor_recompra.js ${new Date().toISOString()} — enviados: ${enviados}, falhas: ${falhas}`);

    if (enviados > 0 && process.env.TELEGRAM_BOT_TOKEN) {
        const chatId = process.env.TELEGRAM_CHAT_ID
            || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
        if (chatId) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    text: `🎯 <b>Motor de Recompra</b>\n\nEnviados: ${enviados}\nFalhas: ${falhas}`
                });
            } catch (_) {}
        }
    }
}

rodar().catch(err => {
    console.error(`[ERRO] ${err.message}`);
    process.exit(1);
});
