const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
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

// Função auxiliar para enviar mensagens ao cliente ou interceptá-las em Modo Silencioso
async function enviarMensagemBot(phone, text) {
    const isSilent = process.env.MODO_SILENCIOSO !== 'false';
    if (isSilent) {
        console.log(`[MODO SILENCIOSO] IA Sugestão para ${phone}: "${text}"`);
        await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - Copiloto]*:\n${text}`);
        return;
    }
    await zapi.enviarMensagemTexto(phone, text);
    await chatwoot.sincronizarMensagemBot(phone, text);
}

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
// 1. AUXILIAR: TRANSCRICÃO DE ÁUDIO (GEMINI NATIVO)
// =========================================================================
async function transcreverAudioZapi(payload, phone, clientName) {
    const audioUrl = (payload.audio && payload.audio.url) || 
                      payload.value || 
                      payload.audioUrl || 
                      (payload.audio && payload.audio.audioUrl) || 
                      "";
    if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.startsWith('http')) {
        console.log("[BOT] Nenhum URL de áudio válido encontrado no payload.");
        return null;
    }

    console.log(`[BOT] Baixando áudio de ${audioUrl}...`);
    try {
        const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(response.data);
        const audioBase64 = audioBuffer.toString('base64');
        const mimeType = (payload.audio && payload.audio.mimeType) || 'audio/ogg';

        console.log(`[BOT] Enviando áudio (${audioBuffer.length} bytes, ${mimeType}) ao Gemini para transcrição...`);
        const modelTranscribe = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const prompt = "Transcreva exatamente o áudio enviado pelo cliente em português do Brasil. Não acrescente comentários, tags ou introduções. Se o áudio estiver em silêncio ou totalmente incompreensível, responda apenas com '[Áudio incompreensível]'.";
        
        const result = await modelTranscribe.generateContent([
            {
                inlineData: {
                    data: audioBase64,
                    mimeType: mimeType.split(';')[0].trim() // Limpar parâmetros adicionais do mimeType se houver
                }
            },
            { text: prompt }
        ]);

        const transcricao = result.response.text().trim();
        console.log(`[BOT] Áudio transcrito com sucesso: "${transcricao}"`);
        return transcricao;
    } catch (e) {
        console.error("❌ [BOT] Erro ao baixar ou transcrever áudio:", e.message);
        return null;
    }
}

// Cache para evitar processar mensagens duplicadas (Z-API retries)
const PROCESSED_IDS_LIMIT = 500;
const processedMessageIds = [];
function isDuplicateMessage(messageId) {
    if (!messageId) return false;
    if (processedMessageIds.includes(messageId)) {
        return true;
    }
    processedMessageIds.push(messageId);
    if (processedMessageIds.length > PROCESSED_IDS_LIMIT) {
        processedMessageIds.shift();
    }
    return false;
}
/**
 * Envia um alerta no grupo do Telegram configurado no .env.
 */
async function enviarAlertaTelegram(mensagem) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
    if (!token || !chatId) {
        console.log("⚠️ [TELEGRAM] Credenciais de Telegram não configuradas no .env.");
        return;
    }
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: mensagem,
            parse_mode: "HTML"
        });
        console.log("✅ [TELEGRAM] Alerta comercial enviado com sucesso!");
    } catch (e) {
        console.error("❌ [TELEGRAM] Erro ao enviar mensagem para o grupo:", e.response ? e.response.data : e.message);
    }
}

// =========================================================================
// 1.1. AUXILIAR: VALIDAÇÃO MULTIMODAL DE RECEITA VETERINÁRIA (GEMINI VISION)
// =========================================================================
async function validarReceitaPorIA(imageUrl, mimeType) {
    console.log(`[RECEITA-IA] Baixando imagem para validação: ${imageUrl}...`);
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        const imageBase64 = imageBuffer.toString('base64');
        const cleanMimeType = (mimeType || 'image/jpeg').split(';')[0].trim();

        console.log(`[RECEITA-IA] Enviando imagem (${imageBuffer.length} bytes, ${cleanMimeType}) ao Gemini Vision...`);
        const modelVision = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const promptReceita = `Você é um sistema de compliance farmacêutico veterinário brasileiro. Analise a imagem enviada como RECEITA VETERINÁRIA.\n\nVerifique OBRIGATORIAMENTE:\n1. Assinatura do médico veterinário (manuscrita ou eletrônica)\n2. Carimbo legível com número do CRMV\n3. Nome do paciente (pet) ou tutor\n4. Nome do medicamento prescrito\n\nResponda SOMENTE com JSON válido neste formato exato (sem markdown, sem texto extra):\n{"valida":true,"itens_ok":[],"itens_faltantes":[],"crmv_encontrado":null,"medico_encontrado":null,"pet_encontrado":null,"medicamento_encontrado":null,"motivo_invalidade":null}`;

        const result = await modelVision.generateContent([
            { inlineData: { data: imageBase64, mimeType: cleanMimeType } },
            { text: promptReceita }
        ]);

        let rawText = result.response.text().trim();
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const dados = JSON.parse(rawText);
        console.log(`[RECEITA-IA] Validação concluída:`, JSON.stringify(dados));
        return dados;
    } catch (e) {
        console.error("❌ [RECEITA-IA] Erro ao validar receita:", e.message);
        return {
            valida: false,
            itens_faltantes: ["erro de processamento"],
            motivo_invalidade: "Não consegui processar a imagem. Por favor, envie uma foto mais nítida da receita.",
            crmv_encontrado: null, medico_encontrado: null,
            pet_encontrado: null, medicamento_encontrado: null
        };
    }
}

// =========================================================================
// 2. WEBHOOK: RECEBIMENTO DE MENSAGENS DO WHATSAPP (VIA Z-API)
// =========================================================================
async function processarMensagem(payload) {
    // Validar se é uma mensagem de entrada
    if (!payload || !payload.phone || payload.fromMe === true) {
        return { status: 200, message: 'Ignored: message from me or invalid payload' };
    }

    console.log("[Z-API] Raw Payload:", JSON.stringify(payload, null, 2));

    const phone = payload.phone;
    const clientName = payload.senderName || "Cliente";

    // Deduplicação de mensagens
    const messageId = payload.messageId || payload.id || (payload.message && payload.message.messageId);
    if (messageId && isDuplicateMessage(messageId)) {
        console.log(`[Z-API] Ignorando mensagem duplicada/reenviada: ${messageId}`);
        return { status: 200, message: 'Ignored: duplicate message' };
    }

    // Detectar tipo de mensagem: áudio, imagem/documento ou texto
    const isAudio = payload.type === 'audio' || payload.type === 'ptt' || (payload.audio && (payload.audio.url || payload.audio.audioUrl));
    const isImagem = payload.type === 'image' || payload.type === 'document';
    let clientMessage = "";
    let transcriptionNote = "";

    if (isAudio) {
        console.log(`[BOT] Detectada mensagem de áudio de ${clientName} (${phone})`);
        const transcrito = await transcreverAudioZapi(payload, phone, clientName);
        if (transcrito) {
            clientMessage = transcrito;
            transcriptionNote = `📝 *[Transcrição de Áudio]*:\n"${transcrito}"`;
        } else {
            clientMessage = "[Áudio enviado pelo cliente - erro na transcrição]";
        }
    } else if (isImagem) {
        // Extrair URL da imagem ou documento enviado pelo cliente
        const imageUrl = (payload.image && (payload.image.url || payload.image.imageUrl)) ||
                         (payload.document && (payload.document.url || payload.document.documentUrl)) ||
                         payload.url || "";
        const mimeType = (payload.image && payload.image.mimeType) ||
                         (payload.document && payload.document.mimeType) || 'image/jpeg';

        console.log(`[BOT] Detectada imagem/documento de ${clientName} (${phone}). URL: ${imageUrl}`);

        // Verificar estado atual do cliente (peek sem bloquear o fluxo principal)
        const statesPeek = loadStates();
        const chatStatePeek = statesPeek[phone] || {};

        if (imageUrl && chatStatePeek.aguardando_receita) {
            console.log(`[RECEITA-IA] Cliente em estado aguardando_receita — validando imagem por IA...`);
            const resultado = await validarReceitaPorIA(imageUrl, mimeType);
            if (resultado.valida) {
                // Atualizar estado imediatamente para que o bloco principal já leia como validada
                if (statesPeek[phone]) {
                    statesPeek[phone].receita_validada = true;
                    statesPeek[phone].aguardando_receita = false;
                    saveStates(statesPeek);
                }
                clientMessage = `[RECEITA VETERINÁRIA VALIDADA PELA IA ✅ — Médico: ${resultado.medico_encontrado || 'identificado'}, Pet: ${resultado.pet_encontrado || 'identificado'}, Medicamento: ${resultado.medicamento_encontrado || 'identificado'}, CRMV: ${resultado.crmv_encontrado || 'identificado'}. Receita completa e aprovada! Prossiga com a confirmação da venda e solicite dados de entrega/pagamento.]`;
                // Nota de compliance no Chatwoot
                await chatwoot.enviarNotaPrivada(phone, `✅ RECEITA APROVADA PELA IA — Médico: ${resultado.medico_encontrado}, Pet: ${resultado.pet_encontrado}, Medicamento: ${resultado.medicamento_encontrado}, CRMV: ${resultado.crmv_encontrado}. Venda pode ser liberada.`);
            } else {
                clientMessage = `[RECEITA VETERINÁRIA INVÁLIDA ❌ — Itens ausentes/ilegíveis: ${(resultado.itens_faltantes || []).join(', ')}. Motivo: ${resultado.motivo_invalidade}. Oriente o cliente a tirar uma nova foto mais nítida e com todos os itens visíveis.]`;
                await chatwoot.enviarNotaPrivada(phone, `❌ RECEITA REPROVADA PELA IA — Motivo: ${resultado.motivo_invalidade}. Itens faltantes: ${(resultado.itens_faltantes || []).join(', ')}.`);
            }
        } else if (imageUrl) {
            clientMessage = `[Cliente enviou uma imagem ou documento — possivelmente foto de produto, pet ou referência visual]`;
        } else {
            clientMessage = "[Cliente enviou uma imagem sem URL válida]";
        }
    } else {
        clientMessage = (payload.text && payload.text.message) || 
                        (payload.message && payload.message.text) || 
                        payload.value || 
                        "";
    }

    if (!clientMessage || clientMessage.trim() === "") {
        console.log(`[BOT] Ignorando mensagem sem conteúdo textual de ${phone}.`);
        return { status: 200, message: 'OK: Ignored empty message' };
    }

    console.log(`[Z-API] Mensagem processada de ${clientName} (${phone}): "${clientMessage}"`);

    // Carregar estado da conversa
    const states = loadStates();
    if (!states[phone]) {
        states[phone] = {
            owner: "AI", // "AI" ou "human"
            history: [],
            cpf: null,
            crmv: null,
            tipo_cliente: null, // "B2C" ou "B2B"
            nome_cadastro: null,
            aguardando_crmv: false,
            aguardando_receita: false,          // true quando aguardando foto da receita
            receita_validada: false,             // true quando a receita foi aprovada pela IA
            medicamento_restrito: null,          // medicamento de controle solicitado
            produto_sem_estoque: null,           // produto com estoque zerado real
            produto_mencionado: null,            // produto detectado na conversa B2C (para confirmação de compra)
            aguardando_confirmar_lista_espera: false  // aguardando cliente confirmar lista de espera
        };
    }

    const chatState = states[phone];

    // Detecção dinâmica de tom B2B / palavras-chave de veterinário na mensagem
    const mensagemLower = clientMessage.toLowerCase();
    const b2bKeywords = ["veterinario", "veterinaria", "médico veterinário", "médica veterinária", "medvet", "crmv", "clinica vet", "consultorio vet", "doutor", "doutora"];
    const isB2BMention = b2bKeywords.some(keyword => mensagemLower.includes(keyword));
    if (isB2BMention && chatState.tipo_cliente !== "B2B") {
        console.log(`[SNC] Identificado tom B2B/Veterinário na mensagem de entrada de ${phone}.`);
        chatState.tipo_cliente = "B2B";
        saveStates(states);
    }

    // 1. Tentar identificar o cliente pelo número de telefone caso ainda não esteja identificado no ERP
    if (!chatState.nome_cadastro && !chatState.tipo_cliente) {
        const cadastroTel = await gestaoclick.buscarCadastroPorTelefone(phone);
        if (cadastroTel && cadastroTel.id) {
            chatState.nome_cadastro = cadastroTel.nome;
            chatState.tipo_cliente = cadastroTel.tipo_cliente;
            chatState.crmv = cadastroTel.crmv || chatState.crmv;
            saveStates(states);
            console.log(`[GESTAOCLICK] Cliente identificado pelo telefone! Nome: ${chatState.nome_cadastro} | Tipo: ${chatState.tipo_cliente}`);
        }
    }

    // 2. Tentar extrair CPF/CNPJ da mensagem
    const cpfCnpjMatch = clientMessage.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})|(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})|(\b\d{11}\b)|(\b\d{14}\b)/);
    if (cpfCnpjMatch) {
        const docExtraido = cpfCnpjMatch[0].replace(/\D/g, '');
        console.log(`[SNC] Documento CPF/CNPJ detectado na mensagem: ${docExtraido}`);
        chatState.cpf = docExtraido;
        
        const cadastroCpf = await gestaoclick.buscarCadastroPorCPF(docExtraido);
        if (cadastroCpf && cadastroCpf.id) {
            chatState.nome_cadastro = cadastroCpf.nome;
            chatState.tipo_cliente = cadastroCpf.tipo_cliente;
            chatState.crmv = cadastroCpf.crmv || chatState.crmv;
            console.log(`[GESTAOCLICK] Cadastro localizado via CPF! Nome: ${chatState.nome_cadastro} | Tipo: ${chatState.tipo_cliente}`);
        } else {
            console.log(`[GESTAOCLICK] CPF ${docExtraido} não localizado no GestãoClick.`);
        }
        saveStates(states);
    }

    // 3. Tentar extrair CRMV da mensagem
    const crmvMatch = clientMessage.match(/crmv\s*[-/]?\s*(?:[a-z]{2})?\s*[-/]?\s*(\d+)/i) || 
                      clientMessage.match(/(\d+)\s*[-/]?\s*crmv/i);
    let crmvExtraido = null;
    if (chatState.aguardando_crmv && clientMessage.trim().match(/^\d{4,6}$/)) {
        crmvExtraido = clientMessage.trim();
        console.log(`[SNC] Detectado CRMV numérico bruto na mensagem (aguardando_crmv ativa): ${crmvExtraido}`);
    } else if (crmvMatch) {
        crmvExtraido = crmvMatch[1];
    }

    let transferNovoVet = false;
    if (crmvExtraido) {
        console.log(`[SNC] CRMV detectado na mensagem: ${crmvExtraido}`);
        chatState.crmv = crmvExtraido;
        chatState.tipo_cliente = "B2B"; // Se forneceu CRMV, é B2B!
        
        const cadastroCrmv = await gestaoclick.buscarCadastroPorCRMV(crmvExtraido);
        if (cadastroCrmv && cadastroCrmv.id) {
            chatState.nome_cadastro = cadastroCrmv.nome;
            chatState.tipo_cliente = "B2B";
            console.log(`[GESTAOCLICK] Cadastro localizado via CRMV! Nome: ${chatState.nome_cadastro}`);
        } else {
            console.log(`[GESTAOCLICK] CRMV ${crmvExtraido} não localizado no GestãoClick. Preparando transbordo para validação.`);
            transferNovoVet = true;
        }
        chatState.aguardando_crmv = false; // Resetar
        saveStates(states);
    }

    // Sincronizar a mensagem recebida com o Chatwoot imediatamente
    await chatwoot.sincronizarMensagemCliente(phone, isAudio ? `[Áudio] ${clientMessage}` : clientMessage, clientName);

    // Se houver uma transcrição de áudio, enviar como Nota Privada no Chatwoot para os atendentes lerem
    if (transcriptionNote) {
        await chatwoot.enviarNotaPrivada(phone, transcriptionNote);
    }

    // Se for um novo veterinário não cadastrado: CADASTRAR AUTOMATICAMENTE + ALERTAR EQUIPE de forma assíncrona
    // O atendimento NÃO é interrompido — o vet continua comprando normalmente!
    if (transferNovoVet) {
        const dadosCadastroVet = {
            nome: clientName || `Veterinário CRMV ${chatState.crmv}`,
            telefone: phone,
            rg: `CRMV: ${chatState.crmv}`,
            tags: "veterinario,novo-cadastro-automatico,pendente-validacao",
            observacoes: `Cadastro automático via WhatsApp em ${new Date().toLocaleString('pt-BR')}. CRMV: ${chatState.crmv}. Telefone: +${phone}. PENDENTE DE VALIDAÇÃO HUMANA.`
        };

        // Fire-and-forget: cadastra no ERP sem travar o fluxo de atendimento
        gestaoclick.cadastrarCliente(dadosCadastroVet)
            .then(r => console.log(`✅ [GESTAOCLICK] Novo vet auto-cadastrado! ID: ${r.id}`))
            .catch(err => console.error("❌ [GESTAOCLICK] Erro ao cadastrar novo vet:", err.message));

        // Alerta assíncrono para o grupo do Telegram da equipe comercial
        const alertaTelegram = `🚨 <b>NOVO VET CADASTRADO AUTOMATICAMENTE</b>\n\n` +
            `👤 <b>Nome:</b> ${clientName}\n` +
            `🏥 <b>CRMV:</b> ${chatState.crmv}\n` +
            `📱 <b>WhatsApp:</b> +${phone}\n` +
            `🕐 <b>Horário:</b> ${new Date().toLocaleString('pt-BR')}\n\n` +
            `⚠️ <i>Verifique a veracidade do registro no CFMV antes de liberar crédito!</i>`;
        enviarAlertaTelegram(alertaTelegram); // Fire-and-forget

        // Nota privada no Chatwoot para auditoria interna
        chatwoot.enviarNotaPrivada(phone,
            `🚨 NOVO VET AUTO-CADASTRADO: CRMV ${chatState.crmv} | Nome: ${clientName} | WhatsApp: +${phone} | ${new Date().toLocaleString('pt-BR')}. ` +
            `Cadastro criado automaticamente pela IA. VALIDAÇÃO HUMANA NECESSÁRIA — confira no GestãoClick e verifique o CRMV no CFMV.`
        );

        // Atualizar estado local: continua como B2B sem transbordo!
        chatState.nome_cadastro = clientName || `Veterinário CRMV ${chatState.crmv}`;
        chatState.tipo_cliente = "B2B";
        saveStates(states);
        console.log(`✅ [SNC] Novo vet auto-cadastrado + equipe alertada no Telegram. Atendimento continua normalmente.`);
        // NÃO retorna aqui — o fluxo continua para o Gemini!
    }

    // Se o atendimento estiver com o humano, o bot simplesmente ignora a mensagem
    if (chatState.owner === "human") {
        console.log(`[BOT] Ignorando mensagem de ${phone}. Atendimento sob controle Humano.`);
        return { status: 200, message: 'OK: Handled by human' };
    }

    // --- DETECÇÃO DE GATILHOS DE SEGURANÇA (SAFETY NET) ---
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

    // 4. URGÊNCIA GERAL — qualquer cliente que precise do produto/serviço imediatamente
    // REGRA: antes de prometer qualquer entrega, é necessário entender o problema e verificar
    // disponibilidade com o fornecedor. Por segurança, transferir para humano.
    const urgenciasGerais = [
        "urgente", "urgência", "urgencia",
        "é pra agora", "pra agora", "para agora",
        "para já", "pra já", "preciso agora", "preciso pra hoje",
        "é agora", "imediatamente", "socorro",
        "passando mal", "tá passando mal", "tô precisando"
    ];
    if (urgenciasGerais.some(u => mensagemLower.includes(u))) {
        acionarTransbordo = true;
        motivoTransbordo = `⚡ URGÊNCIA — ${clientName} precisa de atendimento imediato`;
    }

    if (acionarTransbordo) {
        console.log(`🚨 [SNC] Transbordo acionado para ${phone} por: ${motivoTransbordo}`);
        chatState.owner = "human";
        saveStates(states);

        // Enviar mensagem de despedida carinhosa da IA
        const despedida = `${clientName}, compreendo perfeitamente a sua solicitação e quero garantir que você tenha o melhor suporte possível. Estou transferindo a nossa conversa agora mesmo para o Kyenner (nosso veterinário), que vai te ajudar pessoalmente com isso. Só um minutinho, por favor! 🩺`;
        await enviarMensagemBot(phone, despedida);

        // Notificar o painel do Chatwoot para pausar a IA e alertar o humano
        await chatwoot.solicitarSuporteHumano(phone, clientName, motivoTransbordo);
        return { status: 200, message: 'OK: Escalated to human' };
    }

    // --- CONSULTA INTEGRAÇÃO / SUPORTE OPERACIONAL À IA ---
    // A IA pode precisar consultar estoque ou dados no GestãoClick. O script fornece isso injetando contexto temporário.
    let contextoInjetado = "";

    // Consulta de disponibilidade de produto: expandido para incluir vacinas (B2B) e medicamentos de alto ticket
    const produtosRastreados = [
        { chave: "librela",    nome: "Librela 15mg" },
        { chave: "lybrela",    nome: "Librela 15mg" },
        { chave: "cytopoint",  nome: "Cytopoint" },
        { chave: "neptra",     nome: "Neptra" },
        { chave: "milteforan", nome: "Milteforan" },
        { chave: "metilforan", nome: "Metilforan" },
        { chave: "simparic",   nome: "Simparic 10mg" },
        { chave: "rabisin",    nome: "Rabisin" },
        { chave: "nobivac",    nome: "Nobivac V8" },
        { chave: "bravecto",   nome: "Bravecto" }
    ];
    const produtoDetectado = produtosRastreados.find(p => mensagemLower.includes(p.chave));

    if (produtoDetectado) {
        // Se for cliente B2C (Tutor)
        if (chatState.tipo_cliente !== "B2B") {
            const B2C_TOP4 = ["librela", "lybrela", "cytopoint", "milteforan", "metilforan", "neptra"];
            const isTop4 = B2C_TOP4.includes(produtoDetectado.chave);
            const isVacina = ["rabisin", "nobivac"].includes(produtoDetectado.chave);

            if (!isTop4 && !isVacina) {
                // É um produto B2C fora do Top 4 (ex: Simparic, Bravecto) -> Trava de 2 pontos
                const infoEstoque = await shopify.consultarEstoque(produtoDetectado.nome, 'B2C');
                if (infoEstoque.quantidade > 0) {
                    console.log(`[SNC] Outro produto B2C (${produtoDetectado.nome}) em estoque. Transferindo para Kyenner.`);
                    chatState.owner = "human";
                    saveStates(states);

                    const despedida = `Olá! Verifiquei no sistema e temos o *${produtoDetectado.nome}* disponível. Vou transferir o seu atendimento agora mesmo para o Kyenner (nosso veterinário), que vai te passar as informações de valores e finalizar tudo com você. Só um instantinho! 🐾`;
                    await enviarMensagemBot(phone, despedida);

                    await chatwoot.enviarNotaPrivada(phone, `🚨 [SNC - INTEGRAÇÃO B2C]: O cliente solicitou *${produtoDetectado.nome}*. Temos em estoque! Preço cadastrado no ERP: R$ ${infoEstoque.preco}. O robô transferiu o atendimento sem passar o preço, conforme regras de estoque para produtos fora do Top 4.`);
                    await chatwoot.solicitarSuporteHumano(phone, clientName, `Solicitação de ${produtoDetectado.nome} em estoque`);
                    return { status: 200, message: 'OK: Escalated to human for in-stock B2C product' };
                } else {
                    console.log(`[SNC] Outro produto B2C (${produtoDetectado.nome}) esgotado. Informando indisponibilidade.`);

                    const indisponivel = `Olá! Verifiquei aqui no sistema, mas infelizmente no momento não temos o *${produtoDetectado.nome}* disponível em nosso estoque. 🐾`;

                    chatState.history.push({ role: 'user', content: clientMessage });
                    chatState.history.push({ role: 'model', content: indisponivel });
                    saveStates(states);

                    await enviarMensagemBot(phone, indisponivel);
                    return { status: 200, message: 'OK: Product out of stock' };
                }
            }
        }

        const infoEstoque = await shopify.consultarEstoque(produtoDetectado.nome, chatState.tipo_cliente || 'B2C');

        // Rastrear produto mencionado para B2C (usado na detecção de confirmação de compra)
        if (chatState.tipo_cliente !== "B2B" && !chatState.produto_mencionado) {
            chatState.produto_mencionado = produtoDetectado.nome;
            saveStates(states);
        }

        if (infoEstoque.tipo === 'pedido_especial') {
            // PEDIDO ESPECIAL: produto disponível via fornecedor, prazo conhecido
            console.log(`📦 [ESTOQUE] '${produtoDetectado.nome}' é pedido especial. Prazo: ${infoEstoque.prazo}`);
            contextoInjetado += `\n[Produto Pedido Especial 📦]: O produto '${produtoDetectado.nome}' está disponível! ` +
                `Preço: R$ ${infoEstoque.preco}. PRAZO DE ENTREGA PREVISTO: 1 a 2 dias úteis. ` +
                `Informe ao cliente de forma direta que o produto está DISPONÍVEL e que a entrega é prevista para 1 ou 2 dias. ` +
                `Explique que, após verificar a disponibilidade em estoque, daremos a previsão exata de entrega para ele. ` +
                `NUNCA mencione distribuidor, fornecedor, terceiros ou que faremos pedido ao distribuidor/fornecedor no atendimento ao cliente.`;
        } else if (infoEstoque.quantidade <= 0) {
            // ESTOQUE ZERADO REAL (estoque zerado ou negativo): perguntar lista de espera, aguardar confirmação antes de transferir
            console.log(`🔴 [ESTOQUE] Produto '${produtoDetectado.nome}' com estoque ZERADO (ou negativo: ${infoEstoque.quantidade}).`);
            contextoInjetado += `\n[ESTOQUE ZERADO 🔴 - AÇÃO OBRIGATÓRIA]: O produto '${produtoDetectado.nome}' está MOMENTANEAMENTE FORA DE ESTOQUE. ` +
                `Informe com empatia que estamos em processo de reposição. ` +
                `Pergunte se o cliente gostaria de entrar na *lista de espera* para ser avisado assim que chegar. ` +
                `Seja acolhedor e transmita confiança. NÃO diga que vai transferir ainda — aguarde a resposta do cliente.`;
            chatState.produto_sem_estoque = produtoDetectado.nome;
            chatState.aguardando_confirmar_lista_espera = true;
            saveStates(states);
        } else {
            // ESTOQUE NORMAL: informar quantidade e preço
            contextoInjetado += `\n[Contexto - Estoque Atualizado]: O produto '${produtoDetectado.nome}' possui *${infoEstoque.quantidade} unidades* em estoque, a R$ ${infoEstoque.preco}.`;
        }
    }

    // --- COMPLIANCE B2C: EXIGÊNCIA DE RECEITA PARA MEDICAMENTOS CONTROLADOS ---
    const medicamentosRestritos = ["librela", "cytopoint", "metilforan"];
    const medicamentoRestrito = medicamentosRestritos.find(m => mensagemLower.includes(m));
    if (medicamentoRestrito && chatState.tipo_cliente !== "B2B" && !chatState.receita_validada) {
        // Cliente B2C pedindo medicamento de controle sem receita validada ainda
        chatState.aguardando_receita = true;
        chatState.medicamento_restrito = medicamentoRestrito;
        saveStates(states);
        console.log(`[COMPLIANCE] B2C solicitou '${medicamentoRestrito}' sem receita validada. Ativando aguardando_receita.`);
        contextoInjetado += `\n[Contexto de Sistema - COMPLIANCE OBRIGATÓRIO 🔒]: O cliente B2C solicitou '${medicamentoRestrito}', medicamento de alto controle. A RECEITA VETERINÁRIA AINDA NÃO FOI ENVIADA/VALIDADA. Você DEVE solicitar, de forma acolhedora (como Aika 🐾), que o cliente envie uma *foto ou PDF da receita veterinária* diretamente aqui no chat. Explique que a receita precisa conter: assinatura do veterinário, carimbo com CRMV legível e nome do pet. Não informe o preço final nem confirme a venda enquanto a receita não for enviada e aprovada pela IA.`;
    }

    // Injetar status da receita no contexto caso já tenha sido validada
    if (chatState.receita_validada && chatState.medicamento_restrito) {
        contextoInjetado += `\n[Contexto de Sistema - COMPLIANCE OK ✅]: Receita veterinária para '${chatState.medicamento_restrito}' foi validada e aprovada pela IA. Você pode prosseguir normalmente com a venda — solicite os dados de entrega e pagamento.`;
    }

    // --- DETECÇÃO DE INTENÇÃO: Lista de espera (P1) e confirmação de compra B2C (P2) ---
    let listaEsperaConfirmadaNestaMsg = false;
    let b2cCompraConfirmadaNestaMsg = false;

    // P1: Cliente confirmando que quer entrar na lista de espera (estoque zerado)
    if (chatState.aguardando_confirmar_lista_espera) {
        const confirmacoesListaEspera = ["sim", "quero", "gostaria", "ok", "claro", "pode ser", "me avisa", "lista", "aguardo", "coloca", "anota", "com certeza"];
        if (confirmacoesListaEspera.some(c => mensagemLower.includes(c))) {
            listaEsperaConfirmadaNestaMsg = true;
            chatState.aguardando_confirmar_lista_espera = false;
            saveStates(states);
            console.log(`⏳ [SNC] Lista de espera confirmada para ${phone}: ${chatState.produto_sem_estoque}`);
            contextoInjetado += `\n[LISTA DE ESPERA CONFIRMADA ✅]: O cliente confirmou que quer ser avisado quando '${chatState.produto_sem_estoque}' chegar. Responda com entusiasmo dizendo que anotou o interesse e que vai avisar na hora em que o produto chegar. Seja acolhedor e transmita confiança de que vai cuidar disso pessoalmente.`;
        }
    }

    // P2: Tutor B2C confirmando intenção de compra (Opção B)
    const palavrasCompraB2C = ["quero", "vou levar", "fecha", "fechar", "me manda o pix", "manda o pix", "qual o pix", "qual a chave", "link de pagamento", "quero comprar", "vou comprar", "to dentro", "tô dentro", "quero pedir", "pode mandar", "me manda"];
    if (chatState.tipo_cliente !== "B2B" && chatState.produto_mencionado && palavrasCompraB2C.some(p => mensagemLower.includes(p))) {
        b2cCompraConfirmadaNestaMsg = true;
        console.log(`💳 [SNC] Compra B2C confirmada para ${phone}: ${chatState.produto_mencionado}`);
        contextoInjetado += `\n[COMPRA CONFIRMADA B2C ✅]: O tutor confirmou que quer comprar '${chatState.produto_mencionado}'. Responda confirmando o pedido com entusiasmo e diga que vai conectá-lo com o Kyenner para finalizar todos os detalhes (endereço de entrega, pagamento e prazo). Seja acolhedor e transmita urgente positiva.`;
    }
    // Injetar contexto de CRM do cliente localizado no GestãoClick
    if (chatState.nome_cadastro) {
        contextoInjetado += `\n[Contexto de Sistema - CRM]: Cliente IDENTIFICADO no GestãoClick. Nome do Cadastro: '${chatState.nome_cadastro}', Segmento: '${chatState.tipo_cliente}'${chatState.crmv ? `, CRMV: '${chatState.crmv}'` : ''}.
ATENÇÃO: Responda de forma altamente personalizada usando o nome '${chatState.nome_cadastro}' do cadastro. Como ele(a) já é cadastrado(a) no ERP, NÃO peça mais o CRMV ou CPF e siga direto para o atendimento técnico (caso B2B) ou de tutor (caso B2C). Se for B2B, fale com ele(a) de forma direta e profissional, chamando pelo nome próprio e usando a persona do Kyenner/Kiki (nunca use títulos honoríficos como Dr. ou Dra.).`;
    } else {
        contextoInjetado += `\n[Contexto de Sistema - CRM]: Cliente não localizado no GestãoClick.`;
        if (chatState.crmv) {
            contextoInjetado += ` CRMV informado: '${chatState.crmv}', mas NÃO localizado no banco de dados.`;
        }
        if (chatState.cpf) {
            contextoInjetado += ` CPF informado: '${chatState.cpf}', mas NÃO localizado no banco de dados.`;
        }
    }

    // Aplicar estratégias de inteligência comercial segmentadas por tipo de cliente (B2B ou B2C)
    const oportunidadeVenda = vendas.verificarOportunidadeVenda(clientMessage, chatState.tipo_cliente);
    if (oportunidadeVenda) {
        contextoInjetado += `\n[Estratégia Comercial Ativa (${chatState.tipo_cliente || 'B2C'})]: ${oportunidadeVenda}`;
    }

    const systemInstructionConcise = `[Diretriz de Concisão, Persona e Formatação - CRÍTICO]:
1. **Identificação da Persona**:
   - **Caso B2B (Veterinários)**: Fale como o **Kyenner**. Use um tom técnico, científico, direto e cooperativo de parceria operacional. A comunicação com veterinários deve ser o mais curta, limpa e enxuta possível (sem enrolação, pois eles não leem textos longos).
     - **Saudação**: Comece de forma direta e sem formalidades honoríficas. **NUNCA use termos como Dr., Doutor, Dra., ou Doutora** (os clientes veterinários não gostam disso e preferem um contato direto). Trate-os pelo nome. Kyenner prefere ser chamado pelo seu nome próprio Kyenner, nunca como Dr. Kyenner ou Dr. Kiki (ele não gosta de formalidades). Ao se identificar no início das mensagens B2B, apresente-se como Kyenner (evite o apelido Kiki para manter o tom profissional da parceria).
     - **Cotação**: Se pedirem preços de vacinas ou medicamentos injetáveis, apresente-os de forma direta, curta e organizada. Em seguida, pergunte se o cliente prefere retirar pessoalmente no nosso escritório na Av. Abílio Machado, 514, Sala 08 ou se prefere que a gente envie por motoboy (se preferirem envio, aí sim peça o CEP para simular a rota e cotar o frete). Lembrar de oferecer Frete Grátis se for a primeira compra deles. Sempre faça a pergunta consultiva: "Quantas doses você costuma aplicar por mês?" para ajudar a sugerir o melhor lote/desconto.
     - **Cadastro**: Se o cliente for B2B e ainda NÃO estiver cadastrado no sistema (não identificado), peça de forma direta o número do seu **CRMV** para liberar a tabela de atacado de parceiros (avise que o cadastro profissional passará por validação rápida). Veterinários ativos no sistema são isentos de apresentar receita médica para estoque clínico. Se o cliente já informar o CRMV na mensagem inicial, você DEVE reconhecer e citar expressamente o número do CRMV informado na sua resposta (ex: "CRMV [número] anotado" ou "CRMV [número] cadastrado").
   - **Caso B2C (Tutores)**: Responda como o **Atendimento Otimiza (Aika)**. Adote um tom profissional, direto, prestativo e acolhedor, mas sem ser infantil, informal ou "florzinha". Evite absolutamente qualquer diminutivo (como "animalzinho", "parceirinho", "gatinho"), expressões sentimentais (como "com todo carinho", "muita energia positiva") e reduza emojis ao mínimo (no máximo 1 emoji simples como 💜 ou 🐾 por mensagem, apenas para polidez). Refira-se ao pet de forma direta como "pet", "animal", "paciente" ou pelo próprio nome dele.
     - **Restrição de Cargo**: Refira-se ao Kyenner apenas como *nosso veterinário*, NUNCA use o termo *diretor* ou *diretor veterinário* ao falar com tutores.
     - **Restrição**: Nunca use termos excessivamente formais ou distantes como "Prezado", "Senhor", "Senhora". Dê boas-vindas amigáveis, pergunte o nome do tutor e o nome do pet logo na primeira interação de forma direta e natural para personalizar o registro.
     - **Cadastro**: Só peça os dados de CPF e endereço do tutor para faturamento APÓS a cotação ser aceita e ele confirmar que deseja fechar a compra.

2. **Lei de Compliance de Receitas, Vacinas e Preços (PROIBIDO MISTURAR - LEI SUPREMA)**:
   - **Para Clientes B2C (Tutores)**:
     - **EXIGÊNCIA RÍGIDA DE RECEITA**: Para medicamentos controlados (como Metilforan, que exige receita oficial do MAPA) e de alta complexidade (Librela e Cytopoint), é **obrigatório** exigir do tutor a foto ou PDF da receita veterinária assinada no chat antes de finalizar a venda.
     - **PRODUTOS PEDIDO ESPECIAL (Librela/Cytopoint)**: NUNCA diga que o produto está sem estoque ou indisponível. Diga que está disponível e que a entrega é prevista para 1 ou 2 dias. Você deve incluir a informação de que a previsão exata de entrega será fornecida após a verificação de disponibilidade em nosso estoque/sistema. NUNCA mencione distribuidor, fornecedor, terceiros ou que faremos pedido a eles.
     - **PREÇOS DE ATACADO SÃO CONFIDENCIAIS**: Nunca informe preços de vacinas avulsas/custo de veterinário (como R$ 15,90 ou R$ 44,50). É estritamente proibido!
     - **PROIBIDO VENDER VACINA AVULSA**: Diga que, por segurança regulatória, nós não vendemos vacinas soltas para aplicação própria dos tutores.
     - **APENAS VET EM CASA (APLICADO)**: Ofereça apenas o serviço completo de aplicação em domicílio pelo nosso veterinário ("Vet em Casa"). Passe exclusivamente os preços da tabela aplicados: *Antirrábica R$ 60,00*, *V8/V9 R$ 70,00*, *V10 R$ 80,00*, *Gripe R$ 90,00*, *Giardia R$ 97,00* (todos com aplicação inclusa). Explique que há uma taxa de deslocamento calculada pelo CEP.
     - **NÃO MENCIONE PREÇO DOMICILIAR/APLICAÇÃO**: Nunca fale sobre os preços de aplicação em domicílio de R$ 60,00 ou R$ 70,00. O veterinário compra para o seu próprio estoque clínico e aplica ele mesmo.

3. *Diretriz de Concisão*: Seja direto e simpático. Responda em no máximo 1 ou 2 parágrafos curtos. Evite listar todos os produtos ou fazer respostas longas. Cite apenas as 2 ou 3 principais opções.

4. *Negrito no WhatsApp*: Use SEMPRE apenas um asterisco (*texto*) para negrito. Nunca use dois asteriscos (**texto**).

5. *MODO VENDEDOR ATIVO - OBRIGATÓRIO*: Após responder a pergunta principal do cliente, SEMPRE ofereça proactively pelo menos 1 opção de upsell ou complemento. Nunca encerre uma mensagem sem uma ação comercial clara: uma oferta adicional (volume maior, combo, serviço complementar) ou uma próxima etapa de compra. Seja consultivo e natural — não robótico.

6. *FLUXO TUTOR B2C - TRIAGEM RÁPIDA*: Para clientes Tutores (B2C), o seu papel é de *recepcionista inteligente e ágil*, não de vendedor fechador. Dê uma saudação direta e acolhedora, informe rapidamente se o produto está disponível e a faixa de preço geral. O Kyenner fará o atendimento completo e faturamento. Encerre de forma prática e gentil dizendo que vai conectá-lo com o Kyenner para finalizar. **EXCEÇÃO**: Se o produto solicitado estiver esgotado/fora de estoque, NÃO diga que vai transferir a conversa para o Kyenner; em vez disso, apenas ofereça a lista de espera e alternativas, aguardando a resposta do cliente.
7. *REGRA DE PAGAMENTO / PIX*: Sempre que o cliente (B2B ou B2C) perguntar sobre formas de pagamento, parcelamento ou cartão de crédito, você DEVE informar a taxa de 4.99% do cartão e fornecer OBRIGATORIAMENTE a chave Pix oficial: *(31) 98793-6822* (C6 Bank | Solução Farmacêutica Otimiza).
8. **MENSAGENS DE PROPAGANDA, SPAM OU PARCERIAS DE TERCEIROS (VENDENDO SERVIÇOS PARA A OTIMIZA)**: Se a mensagem do cliente for uma propaganda, oferta de serviço (marketing, software, agência, contabilidade, etc.) ou proposta de parceria, você **NÃO deve aplicar a regra de Modo Vendedor Ativo**, nem perguntar se ele é tutor/veterinário ou pedir CPF/CRMV. Responda de forma simples, polida e muito curta: *"Agradecemos o contato e a apresentação! No momento não temos interesse em novas contratações ou parcerias desse tipo. Obrigado."*
9. **MENSAGENS AMBÍGUAS OU SEM CONTEXTO CLARO**: Se o cliente mandar uma mensagem sem contexto definido ou confusa (como "Oi, tudo bem?"), responda de forma natural e acolhedora, pergunte o nome dele e do pet para personalizar o registro inicial, e pergunte como pode ajudar com base no que ele escreveu. Não dispare de imediato a pergunta sobre se ele é tutor/veterinário ou solicitações de CPF/CRMV.`;

    // Salvar histórico da conversa
    chatState.history.push({ role: 'user', content: clientMessage });
    if (chatState.history.length > 20) chatState.history.shift(); // Limitar histórico para 20 mensagens

    // --- CHAMADA DA IA (GEMINI) ---
    try {
        const systemInstructionConciseWithContext = brandbookContent + "\n" + contextoInjetado + "\n" + systemInstructionConcise;

        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: systemInstructionConciseWithContext
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
                "Olá! Peço desculpas pela mensagem anterior. Estou à disposição para ajudar com a saúde do seu pet. Como posso lhe auxiliar agora? 💜";
        }

        // Se a resposta da IA contém a palavra crmv (de forma a pedir o CRMV), ativamos o estado aguardando_crmv
        if (responseText.toLowerCase().includes("crmv")) {
            chatState.aguardando_crmv = true;
            console.log(`[SNC] Ativado estado aguardando_crmv para o cliente ${phone}.`);
        } else {
            chatState.aguardando_crmv = false;
        }

        // Salvar a resposta no histórico da IA
        chatState.history.push({ role: 'model', content: responseText });
        saveStates(states);

        // Enviar a resposta via Z-API
        await enviarMensagemBot(phone, responseText);

        // --- TRANSFERÊNCIA PÓS-RESPOSTA: somente após confirmação explícita (P1 lista espera / P2 compra) ---
        if ((b2cCompraConfirmadaNestaMsg || listaEsperaConfirmadaNestaMsg) && chatState.owner !== "human") {
            chatState.owner = "human";
            saveStates(states);

            const motivoTransferencia = listaEsperaConfirmadaNestaMsg
                ? `Lista de espera confirmada: ${chatState.produto_sem_estoque}`
                : `Tutor B2C confirmou compra: ${chatState.produto_mencionado}`;

            const notaKyenner = listaEsperaConfirmadaNestaMsg
                ? `⏳ *LISTA DE ESPERA CONFIRMADA:*\n` +
                  `👤 *Cliente:* ${clientName} (+${phone})\n` +
                  `📦 *Produto:* ${chatState.produto_sem_estoque}\n` +
                  `📋 *Ação:* Fazer follow-up assim que o produto entrar no estoque.`
                : `🐾 *TUTOR CONFIRMOU COMPRA — B2C*\n` +
                  `👤 *Cliente:* ${clientName}\n` +
                  `📱 *Telefone:* +${phone}\n` +
                  `🛒 *Produto:* ${chatState.produto_mencionado}\n` +
                  `💬 *Mensagem:* "${clientMessage.substring(0, 100)}"\n` +
                  `📋 *Próximo passo:* Kyenner finaliza endereço, pagamento e prazo.`;

            await chatwoot.enviarNotaPrivada(phone, notaKyenner);
            await chatwoot.solicitarSuporteHumano(phone, clientName, motivoTransferencia);
            console.log(`🔄 [SNC] Transferência pós-confirmação para ${phone}. Motivo: ${motivoTransferencia}`);
        }

    } catch (e) {
        console.error("❌ Erro ao chamar a API do Gemini:", e);
        const fallbackMsg = "Oi! Tive uma oscilação rápida aqui na minha rede. Você poderia repetir o que precisa, por favor? 💜";
        await enviarMensagemBot(phone, fallbackMsg);
    }

    return { status: 200, message: 'OK' };
}
app.get('/status', (req, res) => {
    res.json({
        status: "online",
        modo_silencioso: process.env.MODO_SILENCIOSO,
        is_silent_evaluated: process.env.MODO_SILENCIOSO !== 'false',
        chatwoot: {
            url: process.env.CHATWOOT_API_URL || "https://hub.chatwoot.app.br",
            account_id: process.env.CHATWOOT_ACCOUNT_ID || "39",
            inbox_id: process.env.CHATWOOT_INBOX_ID || "76",
            key_configured: !!process.env.CHATWOOT_API_KEY
        },
        zapi: {
            instance_id: process.env.ZAPI_INSTANCE_ID,
            token_configured: !!process.env.ZAPI_TOKEN
        },
        gemini: {
            key_configured: !!process.env.GEMINI_API_KEY
        },
        time: new Date().toISOString()
    });
});


app.post('/webhook/zapi', async (req, res) => {
    try {
        const result = await processarMensagem(req.body);
        res.status(result.status).send(result.message);
    } catch (e) {
        console.error("❌ [BOT] Erro ao processar mensagem do webhook:", e.message);
        res.status(500).send('Error');
    }
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

// Exportar processarMensagem para ser testável
module.exports = {
    processarMensagem
};

// Porta do Servidor e inicialização condicional
if (require.main === module) {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor Integrado Otimiza (Z-API + Chatwoot + Gemini) rodando na porta ${PORT}`);
    });
}
