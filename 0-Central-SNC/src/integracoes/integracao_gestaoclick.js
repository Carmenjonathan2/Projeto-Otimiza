const axios = require('axios');
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
        const ehB2B = c.tags && c.tags.toLowerCase().includes("veterinario");
        const crmv = extrairCrmv(c);

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
                    const ehB2B = c.tags && c.tags.toLowerCase().includes("veterinario");
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
                    const ehB2B = c.tags && c.tags.toLowerCase().includes("veterinario");
                    const crmv = extrairCrmv(c);
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
            endereco: dados.endereco,
            cep: dados.cep,
            cidade: "Belo Horizonte",
            estado: "MG",
            observacoes: `Pet: ${dados.nomePet} | Raça: ${dados.racaPet} | Idade: ${dados.idadePet}`
        };

        const response = await axios.post(`${BASE_URL}/clientes`, payload, { headers });
        return {
            id: response.data.id,
            status: "success"
        };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao cadastrar cliente:`, e.message);
        throw e;
    }
}

module.exports = {
    buscarCadastroPorCPF,
    buscarCadastroPorCRMV,
    buscarCadastroPorTelefone,
    cadastrarCliente
};
