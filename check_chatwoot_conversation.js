const axios = require('axios');
require('dotenv').config();

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://app.chatwoot.com";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY || "2S9t4gGhGQf3MqsaXrCWNTS4";
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "169248";

const headers = {
    'api_access_token': CHATWOOT_KEY,
    'Content-Type': 'application/json'
};

async function searchAndPrint() {
    try {
        console.log(`[CHATWOOT] Buscando contatos com termo 'Oliveira'...`);
        const searchRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/search?q=Oliveira`, { headers });
        const contacts = searchRes.data?.payload || [];
        console.log(`[CHATWOOT] Encontrados ${contacts.length} contatos.`);
        
        for (let contact of contacts) {
            console.log(`\n👤 Contato: ID ${contact.id} | Nome: ${contact.name} | Tel: ${contact.phone_number}`);
            
            // Buscar conversas deste contato
            const convsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/${contact.id}/conversations`, { headers });
            const convs = convsRes.data?.payload || [];
            console.log(`  Encontradas ${convs.length} conversas.`);
            
            for (let conv of convs) {
                console.log(`  💬 Conversa ID: ${conv.id} | Status: ${conv.status}`);
                
                // Buscar mensagens desta conversa
                const msgsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conv.id}/messages`, { headers });
                const msgs = msgsRes.data?.payload || [];
                console.log(`    Mensagens (${msgs.length}):`);
                
                // Imprimir todas as mensagens
                const lastMsgs = msgs;
                for (let msg of lastMsgs) {
                    const sender = msg.sender ? msg.sender.name : (msg.message_type === 'incoming' ? 'Cliente' : 'Bot');
                    console.log(`      [${msg.message_type}] ${sender}: "${msg.content}"`);
                }
            }
        }
    } catch (e) {
        console.error("❌ Erro ao buscar dados no Chatwoot:", e.response ? e.response.data : e.message);
    }
}

searchAndPrint();
