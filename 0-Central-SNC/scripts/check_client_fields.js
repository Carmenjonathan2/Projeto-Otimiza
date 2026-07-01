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
        const response = await axios.get(`${BASE_URL}/clientes?limit=2`, { headers });
        const list = response.data && response.data.data ? response.data.data : [];
        if (list.length > 0) {
            console.log('Client Keys:', Object.keys(list[0]));
            console.log('Sample client:', JSON.stringify(list[0], null, 2));
        } else {
            console.log('No clients found.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

check();
