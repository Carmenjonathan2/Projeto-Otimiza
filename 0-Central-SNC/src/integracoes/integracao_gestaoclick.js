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
 * Busca o cadastro do cliente pelo CPF/CNPJ.
 * Identifica se possui tag de Veterinário (B2B).
 */
async function buscarCadastroPorCPF(cpf) {
    console.log(`[GESTAOCLICK] Buscando cadastro para CPF: ${cpf}...`);

    // Limpar caracteres não numéricos
    const docLimpo = cpf.replace(/\D/g, '');

    if (ACCESS_TOKEN === "MOCK_GC_ACCESS_TOKEN" || SECRET_TOKEN === "MOCK_GC_SECRET_TOKEN") {
        // Mock de retorno realista
        if (docLimpo === "06944265630" || docLimpo.includes("8119")) {
            return {
                id: 99812,
                nome: "Stefanne Gonçalves",
                tipo_cliente: "B2C",
                crmv: null
            };
        }
        
        // Simular um veterinário cadastrado
        if (docLimpo.includes("9999")) {
            return {
                id: 11202,
                nome: "Dr. Marcos Medvet",
                tipo_cliente: "B2B",
                crmv: "MG-12345"
            };
        }

        return { id: null, nome: null, tipo_cliente: "B2C" }; // Default
    }

    try {
        const response = await axios.get(`${BASE_URL}/clientes?cnpj_cpf=${docLimpo}`, { headers });
        const clientes = response.data.clientes;

        if (!clientes || clientes.length === 0) {
            return { id: null, nome: null, tipo_cliente: "B2C" };
        }

        const c = clientes[0];
        // Verifica se a categoria ou alguma tag indica B2B/Veterinário
        const ehB2B = c.tags && c.tags.toLowerCase().includes("veterinario");

        return {
            id: c.id,
            nome: c.nome,
            tipo_cliente: ehB2B ? "B2B" : "B2C",
            crmv: c.crmv || null
        };
    } catch (e) {
        console.error(`❌ [GESTAOCLICK] Erro ao buscar cadastro por CPF:`, e.message);
        return { id: null, nome: null, tipo_cliente: "B2C" };
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
            // Campos personalizados para o pet
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
    cadastrarCliente
};
