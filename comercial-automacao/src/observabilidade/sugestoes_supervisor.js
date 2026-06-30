const fs = require('fs');
const path = require('path');
const https = require('https');

const ARQUIVO = path.resolve(__dirname, '../../sugestoes_bot.jsonl');

function registrarSugestao({ numero, mensagemCliente, respostaSugerida, persona, estrategiaAtivada, contextoInjetado }) {
    const id = `${Date.now()}_${numero.slice(-4)}`;
    const registro = {
        id,
        timestamp: new Date().toISOString(),
        numero: numero.replace(/\d(?=\d{4})/g, '*'), // máscara parcial do número
        persona,
        mensagemCliente,
        respostaSugerida,
        estrategiaAtivada: estrategiaAtivada || null,
        contextoInjetado: (contextoInjetado || '').substring(0, 500),
        aprovado_humano: null,  // null = pendente, true = aprovado, false = reprovado
        motivo_reprovacao: null
    };

    const linha = JSON.stringify(registro) + '\n';
    fs.appendFileSync(ARQUIVO, linha, 'utf8');
    console.log(`[SUPERVISOR] Sugestão registrada: ${id}`);
    
    // Disparar o alerta do Telegram de forma assíncrona
    try {
        alertarTelegram({ id, persona, mensagemCliente, respostaSugerida, estrategiaAtivada });
    } catch (e) {
        console.error("❌ [SUPERVISOR-TELEGRAM] Erro ao alertar Telegram:", e.message);
    }

    return id;
}

function listarPendentes() {
    if (!fs.existsSync(ARQUIVO)) return [];
    const linhas = fs.readFileSync(ARQUIVO, 'utf8').split('\n').filter(Boolean);
    return linhas.map(l => JSON.parse(l)).filter(r => r.aprovado_humano === null);
}

function alertarTelegram({ id, persona, mensagemCliente, respostaSugerida, estrategiaAtivada }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = (process.env.TELEGRAM_CHAT_IDS || '').split(',').filter(Boolean);
    if (!token || chatIds.length === 0) return;

    const emoji = persona === 'Aika' ? '🐾' : '🩺';
    const texto =
`${emoji} *SUGESTÃO ${persona.toUpperCase()} [Incógnito]*

💬 *Cliente disse:*
_${mensagemCliente.substring(0, 200)}_

🎯 Estratégia: \`${estrategiaAtivada || 'nenhuma'}\`

🤖 *Resposta sugerida:*
${respostaSugerida.substring(0, 400)}

🆔 ID: \`${id}\`
_Revisar em sugestoes\\_bot.jsonl_`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    chatIds.forEach(chatId => {
        const data = JSON.stringify({ chat_id: chatId.trim(), text: texto, parse_mode: 'Markdown' });
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } });
        req.on('error', e => console.error(`[SUPERVISOR-TELEGRAM] Erro no chat ${chatId}: ${e.message}`));
        req.write(data);
        req.end();
    });
}

module.exports = { registrarSugestao, listarPendentes, alertarTelegram };
