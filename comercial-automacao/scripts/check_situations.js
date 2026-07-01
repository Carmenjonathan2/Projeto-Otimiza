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

async function checkSituations() {
    try {
        const response = await axios.get(`${BASE_URL}/vendas?limit=100`, { headers });
        const vendas = response.data && response.data.data ? response.data.data : [];
        const situations = {};
        vendas.forEach(v => {
            situations[v.nome_situacao] = (situations[v.nome_situacao] || 0) + 1;
        });
        console.log('Unique situations found in last 100 sales:', situations);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSituations();
