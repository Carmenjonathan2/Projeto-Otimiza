const axios = require('axios');
require('dotenv').config();

// Obter o domínio passado como argumento
let domain = process.argv[2];
if (!domain) {
    console.error("❌ Erro: Forneça o domínio como argumento. Ex: node update_webhooks.js c897699ee9e2bd.lhr.life");
    process.exit(1);
}

// Limpar o domínio caso passem com http/https
domain = domain.replace('https://', '').replace('http://', '').split('/')[0];

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID || "3F4668A50B5DE1CED1735E0595465753";
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || "A4FC5CBDC5B89F781F53B4E7";
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || "F976ed3bd158e4b7393663c1cd2291903S";

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://app.chatwoot.com";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY || "2S9t4gGhGQf3MqsaXrCWNTS4";
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "169248";

const ZAPI_URL = `https://${domain}/webhook/zapi`;
const CHATWOOT_WEBHOOK_URL = `https://${domain}/webhook/chatwoot`;

async function updateZapi() {
    console.log(`[Z-API] Tentando atualizar webhook recebido para: ${ZAPI_URL}`);
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/update-webhook-received`;
    const headers = { 'Content-Type': 'application/json' };
    if (ZAPI_CLIENT_TOKEN) {
        headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
    }
    try {
        const response = await axios.put(url, { value: ZAPI_URL }, { headers });
        console.log(`✅ [Z-API] Webhook atualizado com sucesso!`, response.data);
    } catch (e) {
        console.error(`❌ [Z-API] Erro ao atualizar webhook:`, e.response ? e.response.data : e.message);
    }
}

async function updateChatwoot() {
    const headers = {
        'api_access_token': CHATWOOT_KEY,
        'Content-Type': 'application/json'
    };
    try {
        console.log(`[CHATWOOT] Buscando webhooks existentes...`);
        const response = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks`, { headers });
        const webhooks = response.data?.payload?.webhooks || [];
        console.log(`[CHATWOOT] Encontrados ${webhooks.length} webhooks.`);
        
        let hasActiveWebhook = false;
        
        for (let wh of webhooks) {
            if (wh.url === CHATWOOT_WEBHOOK_URL) {
                if (!hasActiveWebhook) {
                    console.log(`✨ [CHATWOOT] Mantendo webhook ativo ID ${wh.id}`);
                    hasActiveWebhook = true;
                } else {
                    console.log(`🗑️ [CHATWOOT] Deletando webhook duplicado ID ${wh.id}`);
                    await axios.delete(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks/${wh.id}`, { headers });
                }
            } else if (wh.url.includes('.lhr.life') || wh.url.includes('.loca.lt')) {
                if (!hasActiveWebhook) {
                    try {
                        console.log(`🔄 [CHATWOOT] Atualizando webhook ID ${wh.id} para nova URL: ${CHATWOOT_WEBHOOK_URL}`);
                        await axios.patch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks/${wh.id}`, {
                            url: CHATWOOT_WEBHOOK_URL
                        }, { headers });
                        console.log(`✅ [CHATWOOT] Webhook ID ${wh.id} atualizado com sucesso!`);
                        hasActiveWebhook = true;
                    } catch (patchErr) {
                        console.log(`⚠️ Erro ao atualizar webhook ${wh.id}: ${patchErr.message}. Vamos deletar.`);
                        console.log(`🗑️ [CHATWOOT] Deletando webhook obsoleto ID ${wh.id}`);
                        await axios.delete(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks/${wh.id}`, { headers });
                    }
                } else {
                    console.log(`🗑️ [CHATWOOT] Deletando webhook obsoleto ID ${wh.id}`);
                    await axios.delete(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks/${wh.id}`, { headers });
                }
            }
        }
        
        if (!hasActiveWebhook) {
            console.log(`🆕 [CHATWOOT] Criando novo webhook para URL: ${CHATWOOT_WEBHOOK_URL}`);
            const createRes = await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/webhooks`, {
                url: CHATWOOT_WEBHOOK_URL,
                subscriptions: ["message_created", "message_updated", "conversation_created", "conversation_updated"]
            }, { headers });
            console.log(`✅ [CHATWOOT] Novo webhook criado com sucesso! ID: ${createRes.data.id}`);
        } else {
            console.log(`✅ [CHATWOOT] Webhook ativo já configurado.`);
        }
    } catch (e) {
        console.error(`❌ [CHATWOOT] Erro ao sincronizar webhooks:`, e.response ? e.response.data : e.message);
    }
}

async function run() {
    await updateZapi();
    await updateChatwoot();
}

run();
