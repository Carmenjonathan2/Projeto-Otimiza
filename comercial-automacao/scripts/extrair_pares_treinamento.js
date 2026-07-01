/**
 * Extrator de Pares Humano vs IA — base do "modo aprende" do bot.
 *
 * Para cada conversa do `conversas_log.jsonl`:
 *   1. Pega a sugestão da IA pra cada turno.
 *   2. Busca no Chatwoot a próxima resposta humana ao mesmo cliente na mesma data.
 *   3. Se humano respondeu diferente da IA (divergiu acima de threshold), grava
 *      o par em `pares_treinamento.jsonl` pra revisão semanal.
 *
 * Saída: `0-Central-SNC/pares_treinamento.jsonl` (1 par por linha).
 * Carmen revisa, e pares úteis podem virar few-shot ou regras novas.
 *
 * Rodar manualmente: `npm run extrair-pares`
 * Cron sugerido: junto com analise-semanal (toda segunda).
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

console.log(`[INICIO] extrair_pares_treinamento.js ${new Date().toISOString()}`);

const logFile = path.resolve(__dirname, '../conversas_log.jsonl');
const paresFile = path.resolve(__dirname, '../pares_treinamento.jsonl');

const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://hub.chatwoot.app.br";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const SIMILARITY_THRESHOLD = parseFloat(process.env.PARES_SIMILARITY_THRESHOLD || '0.5');

const headers = {
    'api_access_token': CHATWOOT_KEY,
    'Content-Type': 'application/json'
};

function normalizar(s) {
    return (s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
}

function similaridade(a, b) {
    const ta = new Set(normalizar(a).split(/\s+/).filter(Boolean));
    const tb = new Set(normalizar(b).split(/\s+/).filter(Boolean));
    if (ta.size === 0 && tb.size === 0) return 1;
    if (ta.size === 0 || tb.size === 0) return 0;
    let inter = 0;
    for (const t of ta) if (tb.has(t)) inter++;
    return inter / (ta.size + tb.size - inter);
}

async function buscarMensagensChatwoot(phone) {
    if (!CHATWOOT_KEY || !ACCOUNT_ID) return [];
    try {
        const searchRes = await axios.get(
            `${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/search?q=${phone}`,
            { headers }
        );
        if (!searchRes.data?.payload?.length) return [];
        const contactId = searchRes.data.payload[0].id;

        const convsRes = await axios.get(
            `${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
            { headers }
        );
        if (!convsRes.data?.payload?.length) return [];
        const conversationId = convsRes.data.payload[0].id;

        const msgRes = await axios.get(
            `${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
            { headers }
        );
        return msgRes.data?.payload || [];
    } catch (e) {
        return [];
    }
}

async function rodar() {
    if (!fs.existsSync(logFile)) {
        console.warn(`⚠️ Arquivo de log inexistente: ${logFile}`);
        process.exit(0);
    }

    const linhas = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
    const limite7d = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const sugestoesIA = [];
    for (const linha of linhas) {
        try {
            const e = JSON.parse(linha);
            const t = new Date(e.timestamp).getTime();
            if (t >= limite7d && e.responseText && e.clientMessage
                && e.responseText !== '[trivial-no-reply]'
                && !e.shortCircuit) {
                sugestoesIA.push(e);
            }
        } catch (_) { /* linha inválida */ }
    }

    if (sugestoesIA.length === 0) {
        console.log("ℹ️ Nenhuma sugestão da IA nos últimos 7 dias.");
        process.exit(0);
    }

    console.log(`📊 ${sugestoesIA.length} sugestões de IA encontradas. Cruzando com Chatwoot...`);

    // Carrega pares já extraídos pra deduplicar (por phone+timestamp)
    const jaExtraidos = new Set();
    if (fs.existsSync(paresFile)) {
        const linhasExist = fs.readFileSync(paresFile, 'utf8').trim().split('\n').filter(Boolean);
        for (const l of linhasExist) {
            try {
                const e = JSON.parse(l);
                jaExtraidos.add(`${e.phone}_${e.timestamp}`);
            } catch (_) {}
        }
    }

    // Agrupa por phone pra evitar buscar Chatwoot N vezes pro mesmo cliente
    const porPhone = new Map();
    for (const s of sugestoesIA) {
        if (!porPhone.has(s.phone)) porPhone.set(s.phone, []);
        porPhone.get(s.phone).push(s);
    }

    let pares = 0;
    let divergencias = 0;

    for (const [phone, sugestoes] of porPhone.entries()) {
        const msgsChatwoot = await buscarMensagensChatwoot(phone);
        // Apenas mensagens outgoing não-privadas (= resposta humana real)
        const respostasHumano = msgsChatwoot.filter(m =>
            m.message_type === 1 && !m.private && m.content && m.content.trim().length > 5
        );

        for (const s of sugestoes) {
            const chave = `${s.phone}_${s.timestamp}`;
            if (jaExtraidos.has(chave)) continue;

            const tSug = new Date(s.timestamp).getTime();
            // Pega a resposta humana mais próxima nos próximos 60 minutos
            const candidatas = respostasHumano.filter(m => {
                let tMsg = 0;
                if (typeof m.created_at === 'number') tMsg = m.created_at * 1000;
                else if (typeof m.created_at === 'string') {
                    tMsg = /^\d+$/.test(m.created_at)
                        ? parseInt(m.created_at) * 1000
                        : new Date(m.created_at).getTime();
                }
                return tMsg > tSug && tMsg - tSug < 60 * 60 * 1000;
            });

            if (candidatas.length === 0) continue;
            const respostaHumano = candidatas[0].content.trim();
            const sim = similaridade(s.responseText, respostaHumano);
            const divergiu = sim < SIMILARITY_THRESHOLD;

            const par = {
                timestamp: s.timestamp,
                phone: s.phone,
                clientName: s.clientName || null,
                persona: s.persona,
                clientMessage: s.clientMessage,
                ia_resposta: s.responseText,
                humano_resposta: respostaHumano,
                similaridade: parseFloat(sim.toFixed(3)),
                divergiu
            };
            fs.appendFileSync(paresFile, JSON.stringify(par) + '\n', 'utf8');
            pares++;
            if (divergiu) divergencias++;
        }
    }

    console.log(`✅ ${pares} pares extraídos (${divergencias} com divergência > threshold ${SIMILARITY_THRESHOLD}).`);
    console.log(`[OK] extrair_pares_treinamento.js ${new Date().toISOString()} — pares: ${pares}, divergentes: ${divergencias}`);

    // Telegram opcional
    if (pares > 0 && process.env.TELEGRAM_BOT_TOKEN) {
        const chatId = process.env.TELEGRAM_CHAT_ID
            || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
        if (chatId) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    text: `🎓 <b>Pares humano vs IA extraídos</b>\n\n${pares} pares novos (${divergencias} com divergência forte).\nArquivo: <code>pares_treinamento.jsonl</code>`
                });
            } catch (e) { /* silencioso */ }
        }
    }
}

rodar().catch(err => {
    console.error(`[ERRO] ${err.message}`);
    process.exit(1);
});
