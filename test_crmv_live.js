const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN;
const BASE_URL = "https://api.gestaoclick.com";

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

async function test() {
    console.log("Tokens carregados:", { ACCESS_TOKEN: !!ACCESS_TOKEN, SECRET_TOKEN: !!SECRET_TOKEN });
    try {
        console.log("Buscando todos os clientes (Página 1)...");
        const res = await axios.get(`${BASE_URL}/clientes?limit=100`, { headers });
        console.log("Total de clientes na página 1:", res.data?.data?.length || 0);
        
        // Vamos listar todos os clientes para ver se achamos a Amanda ou o CRMV 36277
        const clientes = res.data?.data || [];
        for (let c of clientes) {
            console.log(`ID: ${c.id} | Nome: ${c.nome} | RG: ${c.rg} | Inscr Mun: ${c.inscricao_municipal} | Resp: ${c.responsavel} | Tags: ${c.tags}`);
        }
    } catch (e) {
        console.error("Erro na busca:", e.message, e.response?.data);
    }
}

test();
