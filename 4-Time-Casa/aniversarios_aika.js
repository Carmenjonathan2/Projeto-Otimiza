const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { DateTime } = require('luxon');
const axios = require('axios');
require('dotenv').config();

// Gateway Unificado do WhatsApp
const whatsappGateway = require('../0-Central-SNC/src/integracoes/whatsapp_gateway');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1j8wDixIqT6QEbCFecGTftuE8jCN0nlHAeKjao9m3xUs';
const RANGE = 'relatorio_aniversariantes!A2:C'; 

const MENSAGEM_TEMPLATE = (nome) => 
`Olá, *${nome}*! 🐾 Aqui é a Aika da *Otimiza FarmaVet*!

Passando para te desejar um aniversário incrível e cheio de alegria! 🎉

Para comemorar, queremos te presentear! 🎁
Se você quiser o seu presente, basta responder a esta mensagem. 😉`;

const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if (!limpo) return null;
    if (limpo.startsWith('55')) {
        return limpo;
    }
    if (limpo.length === 10 || limpo.length === 11) {
        return `55${limpo}`;
    }
    return limpo;
};

async function getAuthClient() {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    // Caminho corrigido para a pasta de conformidade 2-RT-Compliance
    const tokenPath = path.resolve(__dirname, '../2-RT-Compliance/cold-email-automation/token_otimiza.json');
    if (!fs.existsSync(tokenPath)) {
        console.error(`❌ Arquivo token_otimiza.json não encontrado em: ${tokenPath}`);
        process.exit(1);
    }
    auth.setCredentials(JSON.parse(fs.readFileSync(tokenPath)));
    return auth;
}

async function enviarRelatorioTelegram(sucessos, falhas) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
        console.log("⚠️ Telegram Bot não configurado para envio de relatório.");
        return;
    }
    const messageText = `🎂 *Aika Turbo: Relatório de Aniversários (Z-API)* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;
    try { 
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { 
            chat_id: chatId, 
            text: messageText, 
            parse_mode: 'Markdown' 
        }); 
    } catch (e) {
        console.error("❌ Erro ao enviar relatório ao Telegram:", e.message);
    }
}

async function rodarAniversarios() {
    console.log(`🚀 MODO TURBO ANIVERSÁRIOS (Z-API): Iniciando...`);
    let sucessos = 0, falhas = 0;

    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE });
        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log("📭 Lista de aniversariantes vazia.");
            console.log(`[OK] aniversarios_aika.js ${new Date().toISOString()} — Fim sem envios.`);
            process.exit(0);
        }

        console.log(`📊 Total de registros de aniversariantes no Sheets: ${rows.length}`);
        const hoje = DateTime.now().setZone('America/Sao_Paulo');

        for (const row of rows) {
            const [telRaw, nome, dataNascRaw] = row;
            if (!telRaw || !dataNascRaw) continue;

            const [dia, mes] = dataNascRaw.split('/');
            if (parseInt(dia) === hoje.day && parseInt(mes) === hoje.month) {
                const phone = limparTelefone(telRaw);
                if (phone) {
                    try {
                        console.log(`🎂 Enviando aniversário para ${nome} (+${phone})...`);
                        await whatsappGateway.enviarMensagemTexto(phone, MENSAGEM_TEMPLATE(nome), false);
                        console.log(`   ✔️ Sucesso!`);
                        sucessos++;
                        await new Promise(r => setTimeout(r, 10000)); // 10 segundos de segurança
                    } catch (e) { 
                        console.error(`   ❌ Falha ao enviar para ${nome}: ${e.message}`); 
                        falhas++; 
                    }
                }
            }
        }
        await enviarRelatorioTelegram(sucessos, falhas);
        console.log(`[OK] aniversarios_aika.js ${new Date().toISOString()} — Sucessos: ${sucessos}, Falhas: ${falhas}`);
        process.exit(0);
    } catch (e) { 
        console.error("[ERRO] erro fatal nos aniversários:", e.message);
        process.exit(1);
    }
}

rodarAniversarios();
