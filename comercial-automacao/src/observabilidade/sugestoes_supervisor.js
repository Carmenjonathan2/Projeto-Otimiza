'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ARQUIVO = path.resolve(__dirname, '../../sugestoes_bot.jsonl');

function registrarSugestao({ numero, mensagemCliente, respostaSugerida, persona, estrategiaAtivada, contextoInjetado }) {
    const registro = {
        id: `${Date.now()}_${String(numero).slice(-4)}`,
        timestamp: new Date().toISOString(),
        numero: String(numero).replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '$1$2****$4'),
        persona: persona || 'Aika',
        mensagemCliente,
        respostaSugerida,
        estrategiaAtivada: estrategiaAtivada || null,
        contextoInjetado: (contextoInjetado || '').substring(0, 500),
        aprovado_humano: null,
        motivo_reprovacao: null
    };
    fs.appendFileSync(ARQUIVO, JSON.stringify(registro) + '\n', 'utf8');
    console.log(`[SUPERVISOR] Sugestão registrada: ${registro.id}`);
    return registro.id;
}

function alertarTelegram({ id, persona, mensagemCliente, respostaSugerida, estrategiaAtivada }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = (process.env.TELEGRAM_CHAT_IDS || '6823632451,868045878').split(',').filter(Boolean);
    if (!token) return;

    const emoji = persona === 'Kyenner' ? '🦷' : '🐾';
    const texto = `${emoji} *SUGESTÃO ${persona.toUpperCase()} [Incógnito]*\n\n💬 *Cliente:*\n_${mensagemCliente.substring(0, 200)}_\n\n🎯 Estratégia: ${estrategiaAtivada || 'nenhuma'}\n\n🤖 *Bot sugere:*\n${respostaSugerida.substring(0, 400)}\n\n🆔 ID: ${id}`;

    chatIds.forEach(chatId => {
        const data = JSON.stringify({ chat_id: chatId.trim(), text: texto, parse_mode: 'Markdown' });
        const req = https.request(
            `https://api.telegram.org/bot${token}/sendMessage`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
            res => res.resume()
        );
        req.on('error', e => console.error(`[SUPERVISOR-TG] ${e.message}`));
        req.write(data);
        req.end();
    });
}

function supervisionar({ telefone, intencaoDetectada, respostaBot, flagRevisao, alertar }) {
    const id = registrarSugestao({
        numero: telefone,
        mensagemCliente: "(Mensagem capturada via webhook)",
        respostaSugerida: respostaBot,
        persona: 'Aika',
        estrategiaAtivada: intencaoDetectada,
        contextoInjetado: ''
    });

    // Alertar Telegram por padrão se estiver no modo silencioso ou se alertar for true
    if (alertar !== false || process.env.MODO_SILENCIOSO === 'true') {
        try {
            alertarTelegram({
                id,
                persona: 'Aika',
                mensagemCliente: "(Mensagem capturada via webhook)",
                respostaSugerida: respostaBot,
                estrategiaAtivada: intencaoDetectada
            });
        } catch (e) {
            console.error(`[SUPERVISOR-TG] Erro ao enviar alerta: ${e.message}`);
        }
    }

    return id;
}

module.exports = { registrarSugestao, alertarTelegram, supervisionar };
