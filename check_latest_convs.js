const axios = require('axios');
require('dotenv').config();

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://app.chatwoot.com";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY || "2S9t4gGhGQf3MqsaXrCWNTS4";
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "169248";

const headers = {
    'api_access_token': CHATWOOT_KEY,
    'Content-Type': 'application/json'
};

async function getLatestConvs() {
    try {
        console.log(`[CHATWOOT] Buscando as conversas mais recentes...`);
        const res = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, { headers });
        const convs = res.data?.meta ? res.data.payload : res.data;
        
        console.log(`[CHATWOOT] Encontradas ${convs?.length || 0} conversas.`);
        if (!convs || convs.length === 0) return;

        for (let conv of convs.slice(0, 5)) {
            const contactName = conv.meta?.sender?.name || "Sem Nome";
            const contactPhone = conv.meta?.sender?.phone_number || "Sem Tel";
            console.log(`\n💬 Conversa ID: ${conv.id} | Status: ${conv.status} | Contato: ${contactName} (${contactPhone})`);
            
            // Buscar mensagens
            const msgsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conv.id}/messages`, { headers });
            const msgs = msgsRes.data?.payload || [];
            
            // Imprimir as 5 últimas mensagens
            const lastMsgs = msgs.slice(-5);
            for (let msg of lastMsgs) {
                const sender = msg.sender ? msg.sender.name : (msg.message_type === 'incoming' ? 'Cliente' : 'Bot');
                console.log(`      [${msg.message_type}] ${sender}: "${msg.content}"`);
            }
        }
    } catch (e) {
        console.error("❌ Erro ao buscar conversas:", e.response ? e.response.data : e.message);
    }
}

getLatestConvs();
