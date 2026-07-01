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
        const convs = res.data?.data?.payload || [];
        console.log("Conversas no Chatwoot:", convs.length);
        for (let conv of convs) {
            const contactName = conv.meta?.sender?.name || "Sem Nome";
            const contactPhone = conv.meta?.sender?.phone_number || "Sem Tel";
            console.log(`ID: ${conv.id} | Status: ${conv.status} | Nome: ${contactName} | Tel: ${contactPhone}`);
        }
    } catch (e) {
        console.error("Erro:", e.message);
    }
}

test();
