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

// ─── Cache em memória de buscas (CPF/CRMV/Telefone) ──────────────────────
// Chave composta: `${tipo}:${valor}`. TTL configurável via env (default 1h).
// Conversas longas faziam 1 lookup por mensagem; agora todos hits no mesmo
// cliente em até 1h reutilizam a resposta. Economia: ~95% de chamadas ao ERP.
const cacheCadastros = new Map();
const GC_CACHE_TTL_MS = parseInt(process.env.GC_CACHE_TTL_SECONDS || '3600') * 1000;
const GC_CACHE_ENABLED = (process.env.GC_CACHE_ENABLED || 'true') === 'true';

function getCacheKey(tipo, valor) {
    return `${tipo}:${String(valor).replace(/\D/g, '')}`;
}

function getCached(tipo, valor) {
    if (!GC_CACHE_ENABLED) return null;
    const k = getCacheKey(tipo, valor);
    const entry = cacheCadastros.get(k);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
        cacheCadastros.delete(k);
        return null;
    }
    console.log(`[GC-CACHE] HIT ${k}`);
    return entry.value;
}

function setCached(tipo, valor, value) {
    if (!GC_CACHE_ENABLED) return;
    const k = getCacheKey(tipo, valor);
    cacheCadastros.set(k, {
        value,
        expiresAt: Date.now() + GC_CACHE_TTL_MS
    });
}

function invalidarCacheCadastro(opts = {}) {
    if (opts.cpf) cacheCadastros.delete(getCacheKey('cpf', opts.cpf));
    if (opts.crmv) cacheCadastros.delete(getCacheKey('crmv', opts.crmv));
    if (opts.telefone) cacheCadastros.delete(getCacheKey('tel', opts.telefone));
}

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

    // Cache hit?
    const cached = getCached('cpf', docLimpo);
    if (cached) return cached;

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
            const vazio = { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
            setCached('cpf', docLimpo, vazio);
            return vazio;
        }

        const c = clientes[0];
        const crmv = extrairCrmv(c);
        const ehB2B = (c.tags && c.tags.toLowerCase().includes("veterinario")) || !!crmv;

        const resultado = {
            id: c.id,
            nome: c.nome,
            tipo_cliente: ehB2B ? "B2B" : "B2C",
            crmv: crmv
        };
        setCached('cpf', docLimpo, resultado);
        return resultado;
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

    // Cache hit?
    const cached = getCached('crmv', crmvNumero);
    if (cached) return cached;

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
                    const resultado = {
                        id: c.id,
                        nome: c.nome,
                        tipo_cliente: ehB2B ? "B2B" : "B2C",
                        crmv: crmv
                    };
                    setCached('crmv', crmvNumero, resultado);
                    return resultado;
                }
            }
        }
        console.log(`ℹ️ [GESTAOCLICK] CRMV ${crmvNumero} não foi localizado no ERP.`);
        const vazio = { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
        setCached('crmv', crmvNumero, vazio);
        return vazio;
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

    // Cache hit?
    const cached = getCached('tel', telLimpo);
    if (cached) return cached;

    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN" || SECRET_TOKEN === "MOCK_GC_SECRET_TOKEN") {
        const vazio = { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
        setCached('tel', telLimpo, vazio);
        return vazio;
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
                    const resultado = {
                        id: c.id,
                        nome: c.nome,
                        tipo_cliente: ehB2B ? "B2B" : "B2C",
                        crmv: crmv
                    };
                    setCached('tel', telLimpo, resultado);
                    return resultado;
                }
            }
        }
        const vazio = { id: null, nome: null, tipo_cliente: "B2C", crmv: null };
        setCached('tel', telLimpo, vazio);
        return vazio;
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

        // Invalida cache pra que próxima busca pelo mesmo CPF/CRMV/telefone
        // retorne o cliente recém-cadastrado e não a resposta "não encontrado"
        // ainda salva no cache.
        invalidarCacheCadastro({
            cpf: dados.cpf,
            crmv: dados.rg && dados.rg.match(/\d+/) ? dados.rg.match(/\d+/)[0] : null,
            telefone: dados.telefone
        });

        return {
            id: response.data.id || (response.data.data && response.data.data.id),
            status: "success"
        };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao cadastrar cliente:`, e.message);
        throw e;
    }
}

// Cache de estoque em memória (TTL curto — dados em tempo real)
const cacheEstoque = new Map();
const ESTOQUE_CACHE_TTL_MS = parseInt(process.env.ESTOQUE_CACHE_TTL_SECONDS || '300') * 1000; // 5 min default

// Produtos disponíveis via PEDIDO ESPECIAL ao fornecedor (sem estoque físico fixo)
const PRODUTOS_PEDIDO_ESPECIAL = {
    "librela":        { preco: 380.00, prazo: "1 a 2 dias úteis" },
    "librela 15mg":   { preco: 380.00, prazo: "1 a 2 dias úteis" },
    "cytopoint":      { preco: 450.00, prazo: "1 a 2 dias úteis" },
    "cytopoint 15mg": { preco: 450.00, prazo: "1 a 2 dias úteis" },
    "cytopoint 30mg": { preco: 580.00, prazo: "1 a 2 dias úteis" },
};

// Dados mock para desenvolvimento/testes (sem credenciais reais)
const MOCK_ESTOQUE = {
    "librela 15mg": { quantidade: 8, preco: 380.00 },
    "cytopoint":    { quantidade: 5, preco: 450.00 },
    "simparic 10mg":{ quantidade: 14, preco: 104.50 },
    "metilforan":   { quantidade: 12, preco: 180.00 }
};

/**
 * Normaliza um produto retornado pela API do GestãoClick.
 * A API retorna campos em minúsculas (nome, valor, estoque);
 * o JSON exportado usa maiúsculas (Nome, Valor, Estoque).
 */
function normalizarProdutoGC(p) {
    const nome     = p.nome     || p.Nome     || '';
    const valorRaw = p.valor    || p.Valor    || '0';
    const estRaw   = p.estoque  || p.Estoque  || '0';
    const preco    = parseFloat(String(valorRaw).replace(/\./g, '').replace(',', '.')) || 0;
    const quantidade = parseFloat(String(estRaw).replace(/\./g, '').replace(',', '.'));
    return { nome, preco, quantidade: isNaN(quantidade) ? 0 : quantidade };
}

function melhorMatch(lista, nomeProduto, tipoCliente) {
    const term = nomeProduto.toLowerCase().trim();
    const sufixosB2B = [' preço para veterinário', ' preço veterinário', ' para veterinário', ' veterinário', ' veterinario', ' vet', ' b2b', ' atacado'];
    const sufixosB2C = [' preço para tutor', ' preço tutor', ' para tutor', ' tutor'];
    const sufixos = tipoCliente === 'B2B' ? sufixosB2B : sufixosB2C;

    for (const sufixo of sufixos) {
        const m = lista.find(p => p.nome.toLowerCase().includes(term + sufixo));
        if (m) { console.log(`🏷️ [PRODUTOS] Variante ${tipoCliente} encontrada: "${m.nome}"`); return m; }
    }
    return lista.find(p => p.nome.toLowerCase().includes(term)) || null;
}

/**
 * Consulta estoque em tempo real via API GestãoClick.
 * Fallback: JSON exportado localmente → mock (só em dev).
 * Cache TTL: ESTOQUE_CACHE_TTL_SECONDS (default 5 min).
 */
async function consultarEstoque(nomeProduto, tipoCliente = 'B2C') {
    console.log(`[PRODUTOS] Consultando "${nomeProduto}" para ${tipoCliente}...`);
    const nomeLower = nomeProduto.toLowerCase();

    // ─── Passo 1: PEDIDO ESPECIAL (sempre disponível via fornecedor) ──────
    const chaveEspecial = Object.keys(PRODUTOS_PEDIDO_ESPECIAL).find(
        k => nomeLower.includes(k) || k.includes(nomeLower)
    );
    if (chaveEspecial) {
        const info = PRODUTOS_PEDIDO_ESPECIAL[chaveEspecial];
        console.log(`📦 [PRODUTOS] Pedido especial: "${nomeProduto}" | R$ ${info.preco} | Prazo: ${info.prazo}`);
        return { quantidade: 999, preco: info.preco, tipo: 'pedido_especial', prazo: info.prazo };
    }

    // ─── Passo 2: Cache em memória ────────────────────────────────────────
    const cacheKey = `${nomeLower}:${tipoCliente}`;
    const cached = cacheEstoque.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        console.log(`[ESTOQUE-CACHE] HIT "${nomeProduto}"`);
        return cached.value;
    }

    // ─── Passo 3: API GestãoClick em tempo real ───────────────────────────
    if (ACCESS_TOKEN !== "MOCK_GC_ACCESS_TOKEN") {
        try {
            const response = await axios.get(`${BASE_URL}/produtos`, {
                headers,
                params: { search: nomeProduto, limit: 20 },
                timeout: 6000
            });
            const lista = (response.data.data || response.data || []).map(normalizarProdutoGC);

            if (lista.length > 0) {
                const match = melhorMatch(lista, nomeProduto, tipoCliente);
                if (match) {
                    console.log(`✅ [PRODUTOS] API GestãoClick: "${match.nome}" | R$ ${match.preco} | ${match.quantidade} un`);
                    const resultado = { quantidade: match.quantidade, preco: match.preco };
                    cacheEstoque.set(cacheKey, { value: resultado, expiresAt: Date.now() + ESTOQUE_CACHE_TTL_MS });
                    return resultado;
                }
                console.log(`[PRODUTOS] API retornou ${lista.length} produto(s) mas nenhum bateu com "${nomeProduto}".`);
                const semEstoque = { quantidade: 0, preco: 0.00 };
                cacheEstoque.set(cacheKey, { value: semEstoque, expiresAt: Date.now() + ESTOQUE_CACHE_TTL_MS });
                return semEstoque;
            }
        } catch (e) {
            console.warn(`⚠️ [PRODUTOS] API GestãoClick falhou (${e.message}) — tentando fallback JSON.`);
        }
    }

    // ─── Passo 4: Fallback — JSON exportado localmente ────────────────────
    try {
        const filePath = path.resolve(__dirname, '../../../1-Farmacia-Ecommerce/Sistema de Fidelização Otimiza/estoque_limpo_gestaoclick.json');
        if (fs.existsSync(filePath)) {
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const lista = raw.map(normalizarProdutoGC);
            const match = melhorMatch(lista, nomeProduto, tipoCliente);
            if (match) {
                console.log(`📂 [PRODUTOS] Fallback JSON: "${match.nome}" | R$ ${match.preco} | ${match.quantidade} un`);
                return { quantidade: match.quantidade, preco: match.preco };
            }
        }
    } catch (e) {
        console.warn(`⚠️ [PRODUTOS] Fallback JSON falhou: ${e.message}`);
    }

    // ─── Passo 5: Mock (desenvolvimento/testes) ───────────────────────────
    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN") {
        return MOCK_ESTOQUE[nomeLower] || { quantidade: 0, preco: 0.00 };
    }

    console.error(`❌ [PRODUTOS] Produto "${nomeProduto}" não encontrado em nenhuma fonte.`);
    return { quantidade: 0, preco: 0.00, naoEncontrado: true };
}

module.exports = {
    buscarCadastroPorCPF,
    buscarCadastroPorCRMV,
    buscarCadastroPorTelefone,
    cadastrarCliente,
    consultarEstoque,
    invalidarCacheCadastro
};
