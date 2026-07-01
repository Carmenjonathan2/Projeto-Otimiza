const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN;
const BASE_URL = "https://api.gestaoclick.com";

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

async function test() {
    const tests = [
        { name: "Default (no sorting)", url: `${BASE_URL}/clientes?limit=3` },
        { name: "order=desc", url: `${BASE_URL}/clientes?limit=3&order=desc` },
        { name: "sort=id,desc", url: `${BASE_URL}/clientes?limit=3&sort=id,desc` },
        { name: "sort=cadastrado_em,desc", url: `${BASE_URL}/clientes?limit=3&sort=cadastrado_em,desc` },
        { name: "sort_field=id&sort_order=desc", url: `${BASE_URL}/clientes?limit=3&sort_field=id&sort_order=desc` },
        { name: "sort_by=cadastrado_em&sort_order=desc", url: `${BASE_URL}/clientes?limit=3&sort_by=cadastrado_em&sort_order=desc` },
        { name: "ordenacao=cadastrado_em&direcao=desc", url: `${BASE_URL}/clientes?limit=3&ordenacao=cadastrado_em&direcao=desc` },
        { name: "ordenacao=id&direcao=desc", url: `${BASE_URL}/clientes?limit=3&ordenacao=id&direcao=desc` },
        { name: "orderBy=cadastrado_em&order=desc", url: `${BASE_URL}/clientes?limit=3&orderBy=cadastrado_em&order=desc` }
    ];

    for (const t of tests) {
        console.log(`--- Test: ${t.name} ---`);
        try {
            const res = await axios.get(t.url, { headers });
            const list = res.data && res.data.data ? res.data.data : [];
            list.forEach(c => {
                console.log(`  ID: ${c.id} | Nome: ${c.nome.substring(0, 20)} | Cadastrado Em: ${c.cadastrado_em}`);
            });
        } catch (e) {
            console.log(`  FAILED: ${e.message}`);
        }
    }
}

test();
