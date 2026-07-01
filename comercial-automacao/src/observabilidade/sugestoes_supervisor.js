/**
 * Supervisor de Sugestões — registra respostas do bot e alerta equipe via Telegram.
 * Integrar em server_integracao.js após resposta do Gemini.
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const ARQUIVO_JSONL    = path.join(__dirname, '../../sugestoes_bot.jsonl');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_IDS     = ['6823632451', '868045878']; // Carmen, Jonathas

/**
 * Mascara telefone para privacidade: 5511912345678 → 551191***5678
 */
function mascararTelefone(telefone) {
  const t = String(telefone);
  if (t.length < 8) return '***';
  return t.slice(0, 6) + '***' + t.slice(-4);
}

/**
 * Registra uma interação no arquivo JSONL.
 * @param {string} telefone - Número do cliente
 * @param {string} intencaoDetectada - Intenção identificada pelo bot
 * @param {string} respostaBot - Resposta gerada pelo Gemini
 * @param {boolean} flagRevisao - true se o bot indicou incerteza ou escalada
 */
function registrarSugestao(telefone, intencaoDetectada, respostaBot, flagRevisao = false) {
  const entrada = {
    timestamp:          new Date().toISOString(),
    telefone_mascarado: mascararTelefone(telefone),
    intencao_detectada: intencaoDetectada,
    resposta_bot:       respostaBot ? respostaBot.substring(0, 500) : '',
    flag_revisao:       flagRevisao
  };

  try {
    fs.appendFileSync(ARQUIVO_JSONL, JSON.stringify(entrada) + '\n', 'utf8');
  } catch (err) {
    console.error('[SUPERVISOR] Erro ao registrar sugestão:', err.message);
  }

  return entrada;
}

/**
 * Envia alerta no Telegram para Carmen e Jonathas.
 * Só dispara se flagRevisao=true ou se for escalada para humano.
 */
function alertarTelegram(intencaoDetectada, respostaBot, telefone) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[SUPERVISOR] TELEGRAM_BOT_TOKEN não configurado. Alerta não enviado.');
    return;
  }

  const msg = encodeURIComponent(
    `🔔 *Aika — Revisão Necessária*\n\n` +
    `📱 Cliente: ${mascararTelefone(telefone)}\n` +
    `🎯 Intenção: ${intencaoDetectada}\n` +
    `💬 Resposta: ${(respostaBot || '').substring(0, 200)}...\n\n` +
    `_Acesse o Chatwoot para revisar._`
  );

  TELEGRAM_IDS.forEach(chatId => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${msg}&parse_mode=Markdown`;
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`[SUPERVISOR] Telegram erro ${res.statusCode} para ${chatId}`);
      }
    }).on('error', (err) => {
      console.error('[SUPERVISOR] Telegram request error:', err.message);
    });
  });
}

/**
 * Ponto de entrada principal — chamar após resposta do Gemini.
 * @param {object} params
 * @param {string} params.telefone
 * @param {string} params.intencaoDetectada
 * @param {string} params.respostaBot
 * @param {boolean} params.flagRevisao - true quando bot está incerto ou escalando
 * @param {boolean} params.alertar - true para enviar alerta Telegram imediato
 */
function supervisionar({ telefone, intencaoDetectada, respostaBot, flagRevisao = false, alertar = false }) {
  registrarSugestao(telefone, intencaoDetectada, respostaBot, flagRevisao);

  if (flagRevisao || alertar) {
    alertarTelegram(intencaoDetectada, respostaBot, telefone);
  }
}

module.exports = { supervisionar, registrarSugestao, alertarTelegram };
