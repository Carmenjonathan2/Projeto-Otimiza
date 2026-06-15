const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN || "MOCK_GC_ACCESS_TOKEN";
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN || "MOCK_GC_SECRET_TOKEN";
const BASE_URL = "https://api.gestaoclick.com";

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

/**
 * Tenta extrair o CRMV de vários campos possíveis do cliente no GestãoClick.
 */
function extrairCrmv(c) {
    let crmv = c.crmv || null;
    
    // Tenta extrair do campo RG (comum para PF)
    if (!crmv && c.rg && c.rg.toLowerCase().includes('crmv')) {
        const match = c.rg.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    
    // Tenta extrair da Inscrição Municipal (comum para PJ)
    if (!crmv && c.inscricao_municipal && c.inscricao_municipal.toLowerCase().includes('crmv')) {
        const match = c.inscricao_municipal.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    
    // Tenta extrair do Responsável (outro campo de PJ)
    if (!crmv && c.responsavel && c.responsavel.toLowerCase().includes('crmv')) {
        const match = c.responsavel.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    
    return crmv;
}

/**
 * Busca o cadastro do cliente pelo CPF/CNPJ.
 */
async function buscarCadastroPorCPF(cpf) {
    console.log(`[GESTAOCLICK] Buscando cadastro para CPF/CNPJ: ${cpf}...`);

    // Limpar caracteres não numéricos
    const docLimpo = cpf.replace(/\D/g, '');

    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN" || SECRET_TOKEN === "MOCK_GC_SECRET_TOKEN") {
        if (docLimpo === "06944265630" || docLimpo.includes("8119")) {
            return {
                id: 99812,
                nome: "Stefanne Gonçalves",
                tipo_cliente: "B2C",
                crmv: null
            };
        }
        if (docLimpo.includes("9999")) {
            return {
                id: 11202,
                nome: "Dr. Marcos Medvet",
                tipo_cliente: "B2B",
                crmv: "12345"
            };
        }
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    }

    try {
        // Correção de parâmetro para 'cpf_cnpj' e uso do array correto 'data'
        const response = await axios.get(`${BASE_URL}/clientes?cpf_cnpj=${docLimpo}`, { headers });
        const clientes = response.data.data || [];

        if (clientes.length === 0) {
            return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
        }

        const c = clientes[0];
        const crmv = extrairCrmv(c);
        const ehB2B = (c.tags && c.tags.toLowerCase().includes("veterinario")) || !!crmv;

        return {
            id: c.id,
            nome: c.nome,
            tipo_cliente: ehB2B ? "B2B" : "B2C",
            crmv: crmv
        };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao buscar cadastro por CPF:`, e.message);
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    }
}

/**
 * Busca o cadastro do cliente pelo CRMV (pesquisando no campo RG/Inscrição Municipal/Responsável).
 */
async function buscarCadastroPorCRMV(crmvNumero) {
    console.log(`[GESTAOCLICK] Buscando cadastro para CRMV: ${crmvNumero}...`);
    
    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN" || SECRET_TOKEN === "MOCK_GC_SECRET_TOKEN") {
        if (crmvNumero.includes("23344") || crmvNumero.includes("12345")) {
            return {
                id: 11202,
                nome: "Dr. Marcos Medvet",
                tipo_cliente: "B2B",
                crmv: crmvNumero
            };
        }
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    }

    try {
        // Paginamos as primeiras páginas do CRM para encontrar em memória
        for (let page = 1; page <= 5; page++) {
            const response = await axios.get(`${BASE_URL}/clientes?page=${page}`, { headers });
            const clientes = response.data.data || [];
            if (clientes.length === 0) break;

            for (let c of clientes) {
                const crmv = extrairCrmv(c);
                if (crmv && crmv.toString() === crmvNumero.toString()) {
                    const ehB2B = (c.tags && c.tags.toLowerCase().includes("veterinario")) || !!crmv;
                    console.log(`✅ [GESTAOCLICK] Cadastro localizado via CRMV! Nome: ${c.nome}`);
                    return {
                        id: c.id,
                        nome: c.nome,
                        tipo_cliente: ehB2B ? "B2B" : "B2C",
                        crmv: crmv
                    };
                }
            }
        }
        console.log(`ℹ️ [GESTAOCLICK] CRMV ${crmvNumero} não foi localizado no ERP.`);
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao buscar cadastro por CRMV:`, e.message);
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    }
}

/**
 * Busca o cadastro do cliente pelo telefone de contato.
 */
async function buscarCadastroPorTelefone(telefone) {
    console.log(`[GESTAOCLICK] Buscando cadastro para telefone: ${telefone}...`);
    const telLimpo = telefone.replace(/\D/g, '');
    
    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN" || SECRET_TOKEN === "MOCK_GC_SECRET_TOKEN") {
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    }

    try {
        for (let page = 1; page <= 5; page++) {
            const response = await axios.get(`${BASE_URL}/clientes?page=${page}`, { headers });
            const clientes = response.data.data || [];
            if (clientes.length === 0) break;

            for (let c of clientes) {
                const cCelular = c.celular ? c.celular.replace(/\D/g, '') : "";
                const cTelefone = c.telefone ? c.telefone.replace(/\D/g, '') : "";
                
                if ((cCelular && (cCelular.includes(telLimpo) || telLimpo.includes(cCelular))) ||
                    (cTelefone && (cTelefone.includes(telLimpo) || telLimpo.includes(cTelefone)))) {
                    const crmv = extrairCrmv(c);
                    const ehB2B = (c.tags && c.tags.toLowerCase().includes("veterinario")) || !!crmv;
                    console.log(`✅ [GESTAOCLICK] Cadastro localizado via telefone! Nome: ${c.nome}`);
                    return {
                        id: c.id,
                        nome: c.nome,
                        tipo_cliente: ehB2B ? "B2B" : "B2C",
                        crmv: crmv
                    };
                }
            }
        }
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao buscar cadastro por telefone:`, e.message);
        return { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
    }
}

/**
 * Cadastra um novo cliente (Tutor) no ERP GestãoClick.
 */
async function cadastrarCliente(dados) {
    console.log(`[GESTAOCLICK] Cadastrando novo cliente: ${dados.nome}...`);

    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN" || SECRET_TOKEN === "MOCK_GC_SECRET_TOKEN") {
        return {
            id: 123456,
            status: "success"
        };
    }

    try {
        const payload = {
            nome: dados.nome,
            cnpj_cpf: dados.cpf ? dados.cpf.replace(/\D/g, '') : "",
            email: dados.email || "",
            telefone: dados.telefone ? dados.telefone.replace(/\D/g, '') : "",
            endereco: dados.endereco || "",
            cep: dados.cep || "",
            cidade: dados.cidade || "Belo Horizonte",
            estado: dados.estado || "MG",
            rg: dados.rg || "",
            tags: dados.tags || "",
            observacoes: dados.observacoes || `Pet: ${dados.nomePet || ''} | Raça: ${dados.racaPet || ''} | Idade: ${dados.idadePet || ''}`
        };

        const response = await axios.post(`${BASE_URL}/clientes`, payload, { headers });
        return {
            id: response.data.id || (response.data.data && response.data.data.id),
            status: "success"
        };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao cadastrar cliente:`, e.message);
        throw e;
    }
}

// Dados Mockados de Fallback (para produtos com estoque físico próprio)
const MOCK_DATA = {
    "librela 15mg": { quantidade: 8, preco: 380.00 },
    "cytopoint": { quantidade: 5, preco: 450.00 },
    "simparic 10mg": { quantidade: 14, preco: 104.50 },
    "metilforan": { quantidade: 12, preco: 180.00 }
};

// Produtos disponíveis via PEDIDO ESPECIAL ao fornecedor
const PRODUTOS_PEDIDO_ESPECIAL = {
    "librela":      { preco: 380.00, prazo: "1 a 2 dias úteis" },
    "librela 15mg": { preco: 380.00, prazo: "1 a 2 dias úteis" },
    "cytopoint":    { preco: 450.00, prazo: "1 a 2 dias úteis" },
    "cytopoint 15mg": { preco: 450.00, prazo: "1 a 2 dias úteis" },
    "cytopoint 30mg": { preco: 580.00, prazo: "1 a 2 dias úteis" },
};

function buscarNoProdutosGC(data, nomeProduto, tipoCliente = 'B2C') {
    const term = nomeProduto.toLowerCase().trim();

    if (tipoCliente === 'B2B') {
        const sufixosB2B = [
            ' preço para veterinário',
            ' preço veterinário',
            ' para veterinário',
            ' veterinário',
            ' veterinario',
            ' vet',
            ' b2b',
            ' atacado'
        ];
        for (const sufixo of sufixosB2B) {
            const matchB2B = data.find(p =>
                p.Nome && p.Nome.toLowerCase().includes(term + sufixo)
            );
            if (matchB2B) {
                console.log(`🏷️ [PRODUTOS] Variante B2B encontrada: "${matchB2B.Nome}"`);
                return matchB2B;
            }
        }
    } else {
        const sufixosB2C = [
            ' preço para tutor',
            ' preço tutor',
            ' para tutor',
            ' tutor'
        ];
        for (const sufixo of sufixosB2C) {
            const matchB2C = data.find(p =>
                p.Nome && p.Nome.toLowerCase().includes(term + sufixo)
            );
            if (matchB2C) {
                console.log(`🏷️ [PRODUTOS] Variante B2C (tutor) encontrada: "${matchB2C.Nome}"`);
                return matchB2C;
            }
        }
    }

    return data.find(p => p.Nome && p.Nome.toLowerCase().includes(term)) || null;
}

async function consultarEstoque(nomeProduto, tipoCliente = 'B2C') {
    console.log(`[PRODUTOS] Consultando "${nomeProduto}" para ${tipoCliente}...`);

    const nomeLower = nomeProduto.toLowerCase();

    // ─── Passo 1: Verificar se é PEDIDO ESPECIAL ──────────────────────────
    const chaveEspecial = Object.keys(PRODUTOS_PEDIDO_ESPECIAL).find(
        k => nomeLower.includes(k) || k.includes(nomeLower)
    );

    if (chaveEspecial) {
        const infoEspecial = PRODUTOS_PEDIDO_ESPECIAL[chaveEspecial];

        try {
            const filePath = path.resolve(__dirname, '../../../1-Farmacia-Ecommerce/Sistema de Fidelização Otimiza/estoque_limpo_gestaoclick.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const match = buscarNoProdutosGC(data, nomeProduto, tipoCliente);
                if (match) {
                    const precoGC = parseFloat(match.Valor.replace(/\./g, '').replace(',', '.'));
                    if (!isNaN(precoGC) && precoGC > 0) {
                        console.log(`📦 [PRODUTOS] '${nomeProduto}' é PEDIDO ESPECIAL. Preço GestãoClick (${tipoCliente}): R$ ${precoGC} | Prazo: ${infoEspecial.prazo}`);
                        return { quantidade: 999, preco: precoGC, tipo: 'pedido_especial', prazo: infoEspecial.prazo };
                    }
                }
            }
        } catch (e) { /* silencioso */ }

        console.log(`📦 [PRODUTOS] '${nomeProduto}' é PEDIDO ESPECIAL (preço fixo). Prazo: ${infoEspecial.prazo} | Preço: R$ ${infoEspecial.preco}`);
        return { quantidade: 999, preco: infoEspecial.preco, tipo: 'pedido_especial', prazo: infoEspecial.prazo };
    }

    // ─── Passo 2: Produto com estoque físico → GestãoClick ────────────────
    let readSuccess = false;
    try {
        const filePath = path.resolve(__dirname, '../../../1-Farmacia-Ecommerce/Sistema de Fidelização Otimiza/estoque_limpo_gestaoclick.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            readSuccess = true;
            const match = buscarNoProdutosGC(data, nomeProduto, tipoCliente);

            if (match) {
                const preco    = parseFloat(match.Valor.replace(/\./g, '').replace(',', '.'));
                const quantidade = parseFloat(match.Estoque.replace(/\./g, '').replace(',', '.'));
                console.log(`🎯 [PRODUTOS] GestãoClick: "${match.Nome}" | R$ ${preco} | ${quantidade} un`);
                return {
                    quantidade: isNaN(quantidade) ? 0 : quantidade,
                    preco:      isNaN(preco)       ? 0.00 : preco
                };
            }
        } else {
            console.warn(`⚠️ [PRODUTOS] Arquivo GestãoClick não encontrado em ${filePath}`);
        }
    } catch (e) {
        console.warn(`⚠️ [PRODUTOS] Erro ao ler GestãoClick (${e.message}).`);
    }

    if (process.env.NODE_ENV !== 'test' && !readSuccess) {
        console.error("❌ [PRODUTOS] Falha crítica de leitura do banco de produtos em produção!");
        return { quantidade: 0, preco: 0.00, erro: true };
    }

    // ─── Passo 3: Fallback MOCK (desenvolvimento/testes) ──────────────────
    const key = nomeProduto.toLowerCase();
    return MOCK_DATA[key] || { quantidade: 0, preco: 0.00 };
}

module.exports = {
    buscarCadastroPorCPF,
    buscarCadastroPorCRMV,
    buscarCadastroPorTelefone,
    cadastrarCliente,
    consultarEstoque
};
