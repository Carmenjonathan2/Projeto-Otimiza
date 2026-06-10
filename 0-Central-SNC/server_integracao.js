const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Importar SNC (Sistema Nervoso Central)
const snc = require('./src/snc/snc_core');

// Importar módulos de integração
const zapi = require('./src/integracoes/integracao_zapi');
const chatwoot = require('./src/integracoes/integracao_chatwoot');
const shopify = require('./src/integracoes/integracao_shopify');
const gestaoclick = require('./src/integracoes/integracao_gestaoclick');
const pagamento = require('./src/integracoes/integracao_pagamento');
const logistica = require('./src/integracoes/integracao_logistica');
const vendas = require('./src/comercial/estrategias_vendas');

const app = express();
app.use(bodyParser.json());

// Banco de dados de estado em arquivo JSON local (Simulando persistência de estado das conversas)
const STATE_FILE = path.resolve(__dirname, 'conversas_state.json');
function loadStates() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}
function saveStates(states) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(states, null, 4), 'utf8');
}

// Carregar o Brand Book e Regras de Negócio para instruir o Gemini
const brandbookPath = path.resolve(__dirname, './diretrizes-e-branding/brandbook_operacoes_otimiza.md');
let brandbookContent = "";
if (fs.existsSync(brandbookPath)) {
    brandbookContent = fs.readFileSync(brandbookPath, 'utf8');
    console.log("✅ Brand Book carregado com sucesso como instruções do sistema da IA.");
} else {
    console.warn("⚠️ Alerta: Arquivo de Brand Book não encontrado em './diretrizes-e-branding/brandbook_operacoes_otimiza.md'.");
}

// Inicializar API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// =========================================================================
// 1. WEBHOOK: RECEBIMENTO DE MENSAGENS DO WHATSAPP (VIA Z-API)
// =========================================================================
app.post('/webhook/zapi', async (req, res) => {
    const payload = req.body;
    
    // Validar se é uma mensagem de entrada de texto
    if (!payload || !payload.phone || payload.fromMe === true) {
        return res.status(200).send('Ignored: message from me or invalid payload');
    }

    console.log("[Z-API] Raw Payload:", JSON.stringify(payload, null, 2));

    const phone = payload.phone;
    const clientMessage = (payload.text && payload.text.message) || 
                          (payload.message && payload.message.text) || 
                          payload.value || 
                          "";
    const clientName = payload.senderName || "Cliente";

    if (!clientMessage || clientMessage.trim() === "") {
        console.log(`[BOT] Ignorando mensagem sem conteúdo textual de ${phone}.`);
        return res.status(200).send('OK: Ignored empty message');
    }

    console.log(`[Z-API] Mensagem recebida de ${clientName} (${phone}): "${clientMessage}"`);

    // Carregar estado da conversa
    const states = loadStates();
    if (!states[phone]) {
        states[phone] = {
            owner: "AI", // "AI" ou "human"
            history: [],
            cpf: null,
            crmv: null,
            tipo_cliente: null // "B2C" ou "B2B"
        };
    }

    const chatState = states[phone];

    // Sincronizar a mensagem recebida com o Chatwoot imediatamente
    await chatwoot.sincronizarMensagemCliente(phone, clientMessage, clientName);

    // Se o atendimento estiver com o humano, o bot simplesmente ignora a mensagem
    if (chatState.owner === "human") {
        console.log(`[BOT] Ignorando mensagem de ${phone}. Atendimento sob controle Humano.`);
        return res.status(200).send('OK: Handled by human');
    }

    // --- DETECÇÃO DE GATILHOS DE SEGURANÇA (SAFETY NET) ---
    const mensagemLower = clientMessage.toLowerCase();
    const urgenciasClinicas = ["convulsão", "convulsao", "sangrando", "sangramento", "envenenado", "morrendo", "vomitando sangue"];
    const atritosFrustracao = ["atrasado", "atrasou", "errado", "errada", "cancelar", "cancelamento", "reclamar", "procon"];

    let acionarTransbordo = false;
    let motivoTransbordo = "";

    // 1. Verificar urgência médica do pet
    for (let u of urgenciasClinicas) {
        if (mensagemLower.includes(u)) {
            acionarTransbordo = true;
            motivoTransbordo = "Emergência clínica animal";
            break;
        }
    }

    // 2. Verificar atrito ou insatisfação
    for (let a of atritosFrustracao) {
        if (mensagemLower.includes(a)) {
            acionarTransbordo = true;
            motivoTransbordo = "Atrito ou reclamação de cliente";
            break;
        }
    }

    // 3. Verificar se é pedido de agendamento de veterinário (Vet em Casa)
    if (mensagemLower.includes("agendar consulta") || mensagemLower.includes("agendar veterinario") || mensagemLower.includes("coleta de sangue")) {
        acionarTransbordo = true;
        motivoTransbordo = "Agendamento de serviço clínico domiciliar";
    }

    if (acionarTransbordo) {
        console.log(`🚨 [SNC] Transbordo acionado para ${phone} por: ${motivoTransbordo}`);
        chatState.owner = "human";
        saveStates(states);

        // Enviar mensagem de despedida carinhosa da IA
        const despedida = `${clientName}, compreendo perfeitamente a sua solicitação e quero garantir que você tenha o melhor suporte possível. Estou transferindo a nossa conversa agora mesmo para o Dr. Kyenner Oliver (nosso supervisor), que vai te ajudar pessoalmente com isso. Só um minutinho, por favor! 🩺`;
        await zapi.enviarMensagemTexto(phone, despedida);
        await chatwoot.sincronizarMensagemBot(phone, despedida);

        // Notificar o painel do Chatwoot para pausar a IA e alertar o humano
        await chatwoot.solicitarSuporteHumano(phone, clientName, motivoTransbordo);
        return res.status(200).send('OK: Escalated to human');
    }

    // --- CONSULTA INTEGRAÇÃO / SUPORTE OPERACIONAL À IA ---
    // A IA pode precisar consultar estoque ou dados no GestãoClick. O script fornece isso injetando contexto temporário.
    let contextoInjetado = "";

    // Se o cliente mencionar algum produto de alta relevância, consultamos o estoque automaticamente
    if (mensagemLower.includes("librela") || mensagemLower.includes("cytopoint") || mensagemLower.includes("simparic") || mensagemLower.includes("metilforan")) {
        const produto = mensagemLower.includes("librela") ? "Librela 15mg" : 
                        mensagemLower.includes("cytopoint") ? "Cytopoint" : 
                        mensagemLower.includes("simparic") ? "Simparic 10mg" : "Metilforan";
        
        const infoEstoque = await shopify.consultarEstoque(produto);
        contextoInjetado += `\n[Contexto de Sistema - Estoque Atualizado]: O produto '${produto}' possui estoque atual de ${infoEstoque.quantidade} unidades com valor de R$ ${infoEstoque.preco}.`;
    }

    // Verificar se o cliente é veterinário no GestãoClick se já tivermos o CPF/CNPJ
    if (chatState.cpf && !chatState.tipo_cliente) {
        const infoCadastro = await gestaoclick.buscarCadastroPorCPF(chatState.cpf);
        chatState.tipo_cliente = infoCadastro.tipo_cliente; // "B2B" ou "B2C"
        saveStates(states);
        contextoInjetado += `\n[Contexto de Sistema - CRM]: Cliente já identificado no GestãoClick como segmento '${chatState.tipo_cliente}'.`;
    }

    // Aplicar estratégias de inteligência comercial (Upsell, Cross-sell, Frete, Cartão, Pix, etc.)
    const oportunidadeVenda = vendas.verificarOportunidadeVenda(clientMessage);
    if (oportunidadeVenda) {
        contextoInjetado += `\n[Estratégia Comercial Ativa]: ${oportunidadeVenda}`;
    }

    // Salvar histórico da conversa
    chatState.history.push({ role: 'user', content: clientMessage });
    if (chatState.history.length > 20) chatState.history.shift(); // Limitar histórico para 20 mensagens

    // --- CHAMADA DA IA (GEMINI) ---
    try {
        const systemInstructionConcise = brandbookContent + "\n" + contextoInjetado + "\n" + 
`[Diretriz de Concisão e Formatação - CRÍTICO]:
1. Seja extremamente conciso, direto e simpático. Responda em no máximo 1 ou 2 parágrafos curtos.
2. Evite listar todos os produtos ou fazer respostas longas e cansativas. Se o cliente pedir opções, cite apenas as 2 ou 3 principais de forma super resumida e pergunte o que ele precisa especificamente.
3. ATENÇÃO COM NEGRITO NO WHATSAPP: Use SEMPRE apenas um asterisco (*texto*) para negrito no WhatsApp. Nunca use dois asteriscos (**texto**).`;

        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: systemInstructionConcise
        });

        // Formatar o histórico para o formato do Gemini
        const chatGemini = model.startChat({
            history: chatState.history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }))
        });

        const result = await chatGemini.sendMessage(clientMessage);
        let responseText = result.response.text();

        // Limpar formatação de negrito do markdown (de **texto** para *texto*) para compatibilidade com WhatsApp
        responseText = responseText.replace(/\*\*(.*?)\*\*/g, '*$1*');

        // Passar pelo Filtro de Tom de Voz (SNC)
        const tomValido = snc.validarTomDeVoz(chatState.tipo_cliente === 'B2B' ? 'Kyenner' : 'Aika', responseText);
        if (!tomValido) {
            // Se falhar no tom de voz, força uma reescrita rápida ou uma resposta neutra acolhedora
            responseText = chatState.tipo_cliente === 'B2B' ?
                "Olá! Desculpe a resposta anterior. Seguem as informações técnicas corretas do seu pedido. Como posso agilizar hoje?" :
                "Oi! Peço desculpas pela mensagem anterior. O que eu mais quero é te ajudar a cuidar do seu animalzinho! Como posso ajudar você e ele agora? 💜";
        }

        // Salvar a resposta no histórico da IA
        chatState.history.push({ role: 'model', content: responseText });
        saveStates(states);

        // Enviar a resposta via Z-API
        await zapi.enviarMensagemTexto(phone, responseText);

        // Sincronizar com a tela do Chatwoot (para o atendente ver o robô conversando)
        await chatwoot.sincronizarMensagemBot(phone, responseText);

    } catch (e) {
        console.error("❌ Erro ao chamar a API do Gemini:", e);
        const fallbackMsg = "Oi! Tive uma oscilação rápida aqui na minha rede. Você poderia repetir o que precisa, por favor? 💜";
        await zapi.enviarMensagemTexto(phone, fallbackMsg);
        await chatwoot.sincronizarMensagemBot(phone, fallbackMsg);
    }

    res.status(200).send('OK');
});

// =========================================================================
// 2. WEBHOOK: ATUALIZAÇÕES DO PAINEL DO CHATWOOT (TRANBORDAMENTO HUMANO)
// =========================================================================
app.post('/webhook/chatwoot', async (req, res) => {
    const event = req.body;
    
    // Nós escutamos os eventos de alteração de conversa e mensagens enviadas pelos agentes humanos
    if (!event || !event.event) {
        return res.status(200).send('Ignored: invalid payload');
    }

    console.log(`[CHATWOOT] Evento recebido: ${event.event}`);

    // Pegar o telefone do cliente do Chatwoot
    const contact = event.sender || event.contact;
    if (!contact || !contact.phone_number) {
        return res.status(200).send('Ignored: contact phone not found');
    }

    // Formatar telefone para o padrão local (limpando o prefixo + se houver)
    const phone = contact.phone_number.replace('+', '');

    const states = loadStates();
    if (!states[phone]) {
        states[phone] = { owner: "AI", history: [], cpf: null, crmv: null, tipo_cliente: null };
    }

    // 1. Se um agente humano responde a conversa no painel do Chatwoot, silenciamos o Bot na hora!
    if (event.event === "message_created" && event.message_type === "outgoing" && event.private === false) {
        if (states[phone].owner !== "human") {
            console.log(`ℹ️ [CHATWOOT] Atendente enviou mensagem manual. Pausando bot para o cliente ${phone}.`);
            states[phone].owner = "human";
            saveStates(states);
        }
    }

    // 2. Se a conversa for marcada como resolvida/concluída, devolvemos a conversa para a IA
    if (event.event === "conversation_updated" && event.status === "resolved") {
        console.log(`♻️ [CHATWOOT] Conversa marcada como resolvida. Devolvendo controle para a IA para o cliente ${phone}.`);
        states[phone].owner = "AI";
        // Limpar histórico antigo para dar contexto novo na próxima conversa
        states[phone].history = [];
        saveStates(states);
    }

    // 3. Se a conversa for explicitamente re-atribuída para o bot
    if (event.event === "conversation_updated" && event.assignee && event.assignee.email === "bot@otimizafarmavet.com.br") {
        console.log(`🤖 [CHATWOOT] Conversa re-atribuída para o bot. Ativando IA para o cliente ${phone}.`);
        states[phone].owner = "AI";
        saveStates(states);
    }

    res.status(200).send('OK');
});

// Porta do Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Integrado Otimiza (Z-API + Chatwoot + Gemini) rodando na porta ${PORT}`);
});
