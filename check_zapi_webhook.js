const axios = require('axios');
require('dotenv').config();

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/settings`;
const headers = {};
if (ZAPI_CLIENT_TOKEN) {
    headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
}

async function test() {
    try {
        const response = await axios.get(url, { headers });
        console.log("Configurações Z-API:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("Erro:", e.response ? e.response.data : e.message);
    }
}

test();
