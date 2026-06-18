const axios = require('axios');
require('dotenv').config();

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://hub.chatwoot.app.br";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const INBOX_ID = process.env.CHATWOOT_INBOX_ID;

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.MODO_TESTE === 'true';

if (!isTestEnv) {
    if (!CHATWOOT_KEY || !ACCOUNT_ID || !INBOX_ID) {
        console.error("❌ [CHATWOOT] Variáveis de ambiente do Chatwoot ausentes no .env!");
        throw new Error("Chatwoot configuration variables (CHATWOOT_API_KEY, CHATWOOT_ACCOUNT_ID, CHATWOOT_INBOX_ID) are missing!");
    }
}

const headers = {
    'api_access_token': CHATWOOT_KEY || "MOCK_KEY",
    'Content-Type': 'application/json'
};

/**
 * Alerta o painel do Chatwoot de que o cliente precisa de intervenção humana imediata.
 * Altera o responsável da conversa para "pendente" ou envia um alerta em mensagem interna.
 */
async function solicitarSuporteHumano(phone, clientName, motivo) {
    console.log(`[CHATWOOT] Solicitando suporte humano para ${clientName} (${phone}) por motivo: ${motivo}`);

    if (CHATWOOT_KEY === "MOCK_KEY") {
        console.log(`[CHATWOOT-MOCK] Alerta: Cliente solicitou suporte humano.`);
        return true;
    }

    try {
        // 1. Localizar ou criar o contato no Chatwoot
        const contactId = await obterOuCriarContato(phone, clientName);
        
        // 2. Localizar ou criar a conversa ativa
        const conversationId = await obterOuCriarConversa(contactId);

        // 3. Atualizar a conversa para pendente (remover atribuição do bot)
        await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/assignments`, {
            assignee_id: null // Remove o bot para cair na fila "Não Atribuído" dos humanos
        }, { headers });

        // 4. Enviar mensagem interna (Nota) avisando sobre o motivo do transbordo
        await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
            content: `🚨 ALERTA: IA pausada. Atendimento transferido para o humano.\nMotivo: ${motivo}`,
            message_type: "outgoing",
            private: true // Mensagem privada (apenas para atendentes verem no painel)
        }, { headers });

        return true;
    } catch (e) {
        console.error(`❌ [CHATWOOT] Erro ao solicitar suporte humano:`, e.message);
        return false;
    }
}

/**
 * Sincroniza a resposta que a IA enviou ao cliente para que apareça no Chatwoot.
 */
async function sincronizarMensagemBot(phone, text) {
    if (CHATWOOT_KEY === "MOCK_KEY") return;
    try {
        const contactId = await obterOuCriarContato(phone);
        const conversationId = await obterOuCriarConversa(contactId);
        
        await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
            content: text,
            message_type: "outgoing", // Mensagem saindo da loja
            private: false
        }, { headers });
    } catch (e) {
        console.error(`❌ [CHATWOOT] Erro ao sincronizar mensagem do bot:`, e.message);
    }
}

/**
 * Sincroniza a mensagem que o cliente enviou quando o atendimento está pausado ou para fins de log.
 */
async function sincronizarMensagemCliente(phone, text, name = "Cliente") {
    if (CHATWOOT_KEY === "MOCK_KEY") return;
    try {
        const contactId = await obterOuCriarContato(phone, name);
        const conversationId = await obterOuCriarConversa(contactId);

        await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
            content: text,
            message_type: "incoming", // Mensagem vindo do cliente
            private: false
        }, { headers });
    } catch (e) {
        console.error(`❌ [CHATWOOT] Erro ao sincronizar mensagem do cliente:`, e.message);
    }
}

// --- FUNÇÕES AUXILIARES DE BUSCA E CRIAÇÃO NO CHATWOOT ---

async function obterOuCriarContato(phone, name = "Cliente") {
    // Buscar contato pelo telefone
    const searchRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/search?q=${phone}`, { headers });
    if (searchRes.data && searchRes.data.payload && searchRes.data.payload.length > 0) {
        return searchRes.data.payload[0].id;
    }

    // Criar se não existir
    const createRes = await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts`, {
        name: name,
        phone_number: `+${phone}`,
        inbox_id: INBOX_ID
    }, { headers });

    return createRes.data.payload.contact.id;
}

async function obterOuCriarConversa(contactId) {
    // Buscar conversas ativas do contato
    const convsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`, { headers });
    if (convsRes.data && convsRes.data.payload && convsRes.data.payload.length > 0) {
        // Retorna a primeira conversa aberta ou não resolvida
        const active = convsRes.data.payload.find(c => c.status !== "resolved");
        if (active) return active.id;
    }

    // Criar nova conversa
    const createRes = await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations`, {
        source_id: contactId,
        inbox_id: INBOX_ID,
        contact_id: contactId,
        status: "open"
    }, { headers });

    return createRes.data.id;
}

/**
 * Envia uma mensagem privada (nota interna) para uma conversa no Chatwoot.
 */
async function enviarNotaPrivada(phone, text) {
    if (CHATWOOT_KEY === "MOCK_KEY") {
        console.log(`[CHATWOOT-MOCK] Nota privada: "${text}"`);
        return true;
    }
    try {
        const contactId = await obterOuCriarContato(phone);
        const conversationId = await obterOuCriarConversa(contactId);
        
        await axios.post(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
            content: text,
            message_type: "outgoing",
            private: true
        }, { headers });
        return true;
    } catch (e) {
        console.error(`❌ [CHATWOOT] Erro ao enviar nota privada:`, e.message);
        return false;
    }
}

module.exports = {
    solicitarSuporteHumano,
    sincronizarMensagemBot,
    sincronizarMensagemCliente,
    enviarNotaPrivada
};
