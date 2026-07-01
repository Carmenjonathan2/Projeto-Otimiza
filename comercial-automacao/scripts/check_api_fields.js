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

async function check() {
    try {
        const response = await axios.get(`${BASE_URL}/vendas?limit=5`, { headers });
        const vendas = response.data && response.data.data ? response.data.data : [];
        if (vendas.length > 0) {
            console.log('--- Sale structure ---');
            const sampleSale = vendas[0];
            console.log('Sale Keys:', Object.keys(sampleSale));
            console.log('Sale date:', sampleSale.data);
            console.log('Sale client:', sampleSale.cliente ? sampleSale.cliente.nome : 'N/A');
            console.log('Sale products array length:', sampleSale.produtos ? sampleSale.produtos.length : 0);
            if (sampleSale.produtos && sampleSale.produtos.length > 0) {
                console.log('--- Product item structure ---');
                console.log('Product item Keys:', Object.keys(sampleSale.produtos[0]));
                console.log('Product sub-object Keys:', Object.keys(sampleSale.produtos[0].produto || {}));
                console.log('Full product item:', JSON.stringify(sampleSale.produtos[0], null, 2));
            }
        } else {
            console.log('No sales found.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

check();
