const axios = require('axios');
require('dotenv').config();

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://app.chatwoot.com";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY || "2S9t4gGhGQf3MqsaXrCWNTS4";
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "169248";

const headers = {
    'api_access_token': CHATWOOT_KEY,
    'Content-Type': 'application/json'
};

async function test() {
    try {
        const res = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, { headers });
        console.log("Status:", res.status);
        console.log("Res data keys:", Object.keys(res.data));
        console.log("Res data stringified:", JSON.stringify(res.data).substring(0, 1000));
    } catch (e) {
        console.error("Erro:", e.message, e.response?.data);
    }
}

test();
