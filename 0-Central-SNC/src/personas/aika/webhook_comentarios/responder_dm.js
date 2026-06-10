/**
 * [ig_002] Aika IG Bot — Responder de DMs (Direct Messages)
 * Lê a mensagem direta, gera resposta com Gemini usando a personalidade
 * definida em personalidade_aika.json e envia via Instagram Graph API.
 *
 * Diferença do canal de comentários:
 *   - Conversa privada → mais detalhada e pessoal
 *   - Mantém histórico das últimas 5 trocas por usuário (em memória)
 *   - Limite de 600 caracteres (vs 280 nos comentários)
 */

const axios = require('axios');
const path  = require('path');
const fs    = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// Carrega personalidade da Aika do arquivo de configuração externo
const PERSONALIDADE = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './personalidade_aika.json'), 'utf-8')
);

const TOKEN      = process.env.TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!TOKEN || !GEMINI_KEY) {
    console.error('[ERRO] responder_dm.js — TOKEN ou GEMINI_API_KEY ausentes no .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Histórico de conversa por usuário (em memória — reseta ao reiniciar o servidor)
// Chave: remetenteId → array de { role, parts }
const historicoConversas = new Map();
const MAX_HISTORICO      = 5; // últimas 5 trocas (10 mensagens)

function buildInstrucaoDM() {
    const p = PERSONALIDADE;
    const situacoes = Object.entries(p.situacoes)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');
    const proibicoes = p.proibicoes.map(r => `- NUNCA: ${r}`).join('\n');

    return `
Você é ${p.identidade.nome}, ${p.identidade.papel}.
Está em uma CONVERSA PRIVADA (Direct Message) com um tutor ou cliente.

SEU TOM DE VOZ:
${p.tom_de_voz.estilo}
${p.tom_de_voz.vocabulario}
Emojis: ${p.tom_de_voz.emojis}

COMO AGIR EM CADA SITUAÇÃO:
${situacoes}

FECHAMENTO PADRÃO (quando fizer sentido): "${p.fechamento_dm}"

REGRAS ABSOLUTAS:
${proibicoes}
- Máximo de ${p.limites_de_caracteres.dm} caracteres por mensagem
- É uma conversa contínua: leve em conta o histórico ao responder.
- Responda APENAS com o texto da mensagem. Sem aspas, sem explicações, sem prefixos.
`.trim();
}

async function gerarRespostaDM(remetenteId, novaMsg) {
    // Recupera ou cria histórico da conversa
    if (!historicoConversas.has(remetenteId)) {
        historicoConversas.set(remetenteId, []);
    }
    const historico = historicoConversas.get(remetenteId);
    const instrucao = buildInstrucaoDM();

    // Inicia chat com histórico + instrução do sistema
    const chat = model.startChat({
        history: [
            { role: 'user',  parts: [{ text: instrucao }] },
            { role: 'model', parts: [{ text: 'Entendido! Estou pronta para atender com carinho. 🐾' }] },
            ...historico
        ]
    });

    const resultado = await chat.sendMessage(novaMsg);
    const resposta  = resultado.response.text().trim();

    // Atualiza histórico (mantém últimas MAX_HISTORICO trocas)
    historico.push({ role: 'user',  parts: [{ text: novaMsg }] });
    historico.push({ role: 'model', parts: [{ text: resposta }] });
    if (historico.length > MAX_HISTORICO * 2) {
        historico.splice(0, 2); // remove a troca mais antiga
    }

    // Garante limite de caracteres
    const limite = PERSONALIDADE.limites_de_caracteres.dm;
    return resposta.length > limite ? resposta.substring(0, limite - 3) + '...' : resposta;
}

async function enviarDM(remetenteId, texto) {
    // Instagram Messaging API — envia DM via Graph API
    await axios.post(`https://graph.instagram.com/v19.0/me/messages`, {
        recipient: { id: remetenteId },
        message:   { text: texto }
    }, {
        params: { access_token: TOKEN }
    });
}

async function processarDM({ remetenteId, texto, messageId }) {
    if (!remetenteId || !texto) return;

    console.log(`[INICIO] responder_dm.js ${new Date().toISOString()} — DM de ${remetenteId}: "${texto}"`);

    const resposta = await gerarRespostaDM(remetenteId, texto);
    await enviarDM(remetenteId, resposta);

    console.log(`[OK] responder_dm.js ${new Date().toISOString()} — Respondido ${remetenteId}: "${resposta}"`);
}

module.exports = { processarDM };
