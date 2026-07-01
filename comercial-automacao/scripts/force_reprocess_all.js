const axios = require('axios');
require('dotenv').config({ path: 'c:/Users/jonat/OneDrive/Desktop/Otimiza/.env' });

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
    return phone.replace(/^\+/, '');
}

async function forceReprocessAll() {
    try {
        console.log(`📡 [CHATWOOT] Buscando conversas abertas para FORÇAR reprocessamento...`);
        const res = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, { headers });
        const convs = res.data?.data?.payload || res.data?.payload || (Array.isArray(res.data) ? res.data : []);

        console.log(`📊 Encontradas ${convs.length} conversas abertas.`);

        let countReprocessed = 0;

        for (let conv of convs) {
            if (conv.status !== 'open') continue;

            const contactName = conv.meta?.sender?.name || "Sem Nome";
            const contactPhone = formatPhone(conv.meta?.sender?.phone_number);
            
            if (!contactPhone) continue;

            // Ignorar números internos ou de teste específicos se necessário, mas vamos processar todos os pendentes de hoje
            // Buscar mensagens da conversa
            const msgsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conv.id}/messages`, { headers });
            const msgs = msgsRes.data?.payload || [];

            // Filtrar apenas mensagens públicas (ignorar notas privadas)
            const publicMsgs = msgs.filter(m => !m.private && m.content);
            
            if (publicMsgs.length === 0) continue;

            // Encontrar a última mensagem do CLIENTE (message_type === 0) na história
            const clientMsgs = publicMsgs.filter(m => m.message_type === 0);
            if (clientMsgs.length === 0) continue;

            const lastClientMsg = clientMsgs[clientMsgs.length - 1];

            // Só reprocessa se a última mensagem do cliente foi enviada nas últimas 24 horas (multiplicado por 1000 pois está em segundos)
            const msgDate = new Date(lastClientMsg.created_at * 1000);
            const timeDiffHours = (Date.now() - msgDate.getTime()) / (1000 * 60 * 60);
            if (timeDiffHours > 24) {
                console.log(`ℹ️ Pulando +${contactPhone} pois a última mensagem do cliente foi há mais de 24 horas (${timeDiffHours.toFixed(1)}h ago).`);
                continue;
            }

            console.log(`\n⚠️ REPROCESSANDO FORÇADO:`);
            console.log(`👤 Contato: ${contactName} (+${contactPhone})`);
            console.log(`💬 Última mensagem do cliente: "${lastClientMsg.content}"`);

            const simulatedPayload = {
                phone: contactPhone,
                senderName: contactName,
                text: {
                    message: lastClientMsg.content
                },
                messageId: `force-retroactive-${conv.id}-${Date.now()}`
            };

            console.log(`🚀 Enviando webhook de reprocessamento forçado para a produção...`);
            try {
                const webhookRes = await axios.post(WEBHOOK_URL, simulatedPayload);
                console.log(`✅ Webhook enviado! Status: ${webhookRes.status} | Resposta:`, webhookRes.data);
                countReprocessed++;
            } catch (webhookErr) {
                console.error(`❌ Erro ao enviar webhook para +${contactPhone}:`, webhookErr.message);
            }

            // Aguarda 2.5 segundos para dar tempo do Gemini processar com histórico completo
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        console.log(`\n🎉 FIM DO REPROCESSAMENTO FORÇADO. Total: ${countReprocessed}`);
    } catch (e) {
        console.error("❌ Erro no reprocessamento forçado:", e.response ? e.response.data : e.message);
    }
}

forceReprocessAll();
