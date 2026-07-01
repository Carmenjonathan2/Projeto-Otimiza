const axios = require('axios');
require('dotenv').config();

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://hub.chatwoot.app.br";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY || "QwEbgCKBBKgvX5jgzdurAbzR";
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "39";
const WEBHOOK_URL = "https://projeto-otimiza-production.up.railway.app/webhook/zapi";

const headers = {
    'api_access_token': CHATWOOT_KEY,
    'Content-Type': 'application/json'
};

function formatPhone(phone) {
    if (!phone) return null;
    // Remove o '+' inicial se houver
    return phone.replace(/^\+/, '');
}

async function reprocessarNaoLidas() {
    try {
        console.log(`📡 [CHATWOOT] Buscando conversas abertas...`);
        const res = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, { headers });
        const convs = res.data?.data?.payload || res.data?.payload || (Array.isArray(res.data) ? res.data : []);

        console.log(`📊 Encontradas ${convs.length} conversas no total.`);

        let countReprocessed = 0;

        for (let conv of convs) {
            // Só processa se a conversa estiver aberta
            if (conv.status !== 'open') continue;

            const contactName = conv.meta?.sender?.name || "Sem Nome";
            const contactPhone = formatPhone(conv.meta?.sender?.phone_number);
            
            if (!contactPhone) continue;

            // Buscar mensagens da conversa
            const msgsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conv.id}/messages`, { headers });
            const msgs = msgsRes.data?.payload || [];

            // Filtrar apenas mensagens públicas (ignorar notas privadas)
            const publicMsgs = msgs.filter(m => !m.private);
            
            if (publicMsgs.length === 0) continue;

            // Pegar a última mensagem pública
            const lastPublicMsg = publicMsgs[publicMsgs.length - 1];

            // Se o tipo for 0, significa que a última mensagem é do cliente (não respondida)
            if (lastPublicMsg.message_type === 0) {
                const messageText = lastPublicMsg.content;
                console.log(`\n⚠️ CONVERSA NÃO RESPONDIDA DETECTADA:`);
                console.log(`👤 Contato: ${contactName} (+${contactPhone})`);
                console.log(`💬 Mensagem: "${messageText}"`);

                // Montar payload simulado do Z-API
                const simulatedPayload = {
                    phone: contactPhone,
                    senderName: contactName,
                    text: {
                        message: messageText
                    },
                    // Geramos um ID único aleatório baseado em timestamp para evitar dedup no servidor
                    messageId: `retroactive-${conv.id}-${Date.now()}`
                };

                console.log(`🚀 Enviando webhook de reprocessamento para a produção...`);
                try {
                    const webhookRes = await axios.post(WEBHOOK_URL, simulatedPayload);
                    console.log(`✅ Webhook enviado com sucesso! Status: ${webhookRes.status} | Resposta:`, webhookRes.data);
                    countReprocessed++;
                } catch (webhookErr) {
                    console.error(`❌ Erro ao enviar webhook para +${contactPhone}:`, webhookErr.message);
                }

                // Aguarda 1.5 segundos entre requisições para evitar rate limit e dar tempo do Gemini processar
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        console.log(`\n🎉 FIM DO REPROCESSAMENTO. Total de conversas reprocessadas: ${countReprocessed}`);
    } catch (e) {
        console.error("❌ Erro ao reprocessar conversas não lidas:", e.response ? e.response.data : e.message);
    }
}

reprocessarNaoLidas();
