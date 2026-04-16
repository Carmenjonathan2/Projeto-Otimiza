const axios = require('axios');
require('dotenv').config();

/**
 * Envia um alerta estilizado para o Telegram quando um lead responde.
 * @param {string} nomeContato 
 * @param {string} nomeEmpresa 
 */
async function enviarAlertaTelegram(nomeContato, nomeEmpresa) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Verificações simples de configuração
    if (!token || !chatId) {
        console.warn("⚠️ [TELEGRAM] Bot Token ou Chat ID não configurados no .env. Alerta não enviado.");
        return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const message = `🚨 *LEAD QUENTE - RT!* \n\nO contato *${nomeContato}* da empresa *${nomeEmpresa}* acabou de responder à prospecção. Vá checar a caixa de entrada!`;

    try {
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log(`📱 Notificação Telegram enviada com sucesso para: ${nomeContato}`);
    } catch (error) {
        console.error("❌ Erro ao enviar alerta para o Telegram:", error.response?.data?.description || error.message);
    }
}

module.exports = { enviarAlertaTelegram };
