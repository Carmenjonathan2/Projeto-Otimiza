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
    try {
        const docLimpo = "06944265630";
        console.log("Buscando CPF:", docLimpo);
        const response = await axios.get(`${BASE_URL}/clientes?cpf_cnpj=${docLimpo}`, { headers });
        const c = response.data.data?.[0];
        if (c) {
            console.log("Cadastro localizado:", JSON.stringify(c, null, 2));
        } else {
            console.log("Nenhum cadastro localizado.");
        }
    } catch (e) {
        console.error("Erro:", e.message);
    }
}

test();
