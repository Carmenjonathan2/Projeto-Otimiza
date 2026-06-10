const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { DateTime } = require('luxon');
const axios = require('axios');
require('dotenv').config();

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1j8wDixIqT6QEbCFecGTftuE8jCN0nlHAeKjao9m3xUs';
const RANGE = 'relatorio_aniversariantes!A2:C'; 

const MENSAGEM_TEMPLATE = (nome) => 
`Olá, *${nome}*! 🐾 Aqui é a Aika da *Otimiza FarmaVet*!

Passando para te desejar um aniversário incrível e cheio de alegria! 🎉

Para comemorar, queremos te presentear! 🎁
Se você quiser o seu presente, basta responder a esta mensagem. 😉`;

const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if(!limpo) return null;
    if(limpo.startsWith('55')) limpo = limpo.substring(2);
    if (limpo.length === 11 && limpo.substring(2, 3) === '9') return `55${limpo}@c.us`;
    if (limpo.length === 10) return `55${limpo}@c.us`;
    return null;
};

async function getAuthClient() {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    const tokenPath = path.join(__dirname, 'cold-email-automation', 'token_otimiza.json');
    if (!fs.existsSync(tokenPath)) {
        console.error("❌ Arquivo token_otimiza.json não encontrado em cold-email-automation/");
        process.exit(1);
    }
    auth.setCredentials(JSON.parse(fs.readFileSync(tokenPath)));
    return auth;
}

async function enviarRelatorioTelegram(sucessos, falhas) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;
    const messageText = `🎂 *Aika Turbo: Relatório de Aniversários* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;
    try { await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: messageText, parse_mode: 'Markdown' }); } catch (e) {}
}

async function rodarAniversarios() {
    console.log(`🚀 MODO TURBO: Iniciando Aniversários...`);
    let sucessos = 0, falhas = 0;

    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE });
        const rows = response.data.values;
        if (!rows) return console.log("📭 Lista vazia.");

        const client = new Client({
            authTimeoutMs: 0,
            puppeteer: { 
                headless: true,
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                userDataDir: path.join(__dirname, 'perfil_aika'),
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                ] 
            }
        });

        client.on('qr', () => {
            console.log("⚠️ QR Code necessário. O WhatsApp está desconectado.");
            client.destroy();
            process.exit(1);
        });
        client.on('ready', async () => {
            console.log("✅ Conexão Estabelecida.");
            const hoje = DateTime.now().setZone('America/Sao_Paulo');

            for (const row of rows) {
                const [telRaw, nome, dataNascRaw] = row;
                if (!telRaw || !dataNascRaw) continue;

                const [dia, mes] = dataNascRaw.split('/');
                if (parseInt(dia) === hoje.day && parseInt(mes) === hoje.month) {
                    const jid_limpo = limparTelefone(telRaw);
                    if (jid_limpo) {
                        try {
                            const numero = jid_limpo.split('@')[0];
                            const numberId = await client.getNumberId(numero);
                            if (numberId) {
                                console.log(`📧 Enviando para ${nome}...`);
                                await client.sendMessage(numberId._serialized, MENSAGEM_TEMPLATE(nome));
                                console.log(`   ✔️ Sucesso!`);
                                sucessos++;
                                await new Promise(r => setTimeout(r, 60000)); // 1 minuto de segurança
                            } else {
                                console.log(`   ⚠️ Número inválido: ${numero}`);
                                falhas++;
                            }
                        } catch (e) { console.error(`   ❌ Falha: ${e.message}`); falhas++; }
                    }
                }
            }
            await enviarRelatorioTelegram(sucessos, falhas);
            console.log("🏁 Fim.");
            await client.destroy(); // Libera o Chrome para o próximo script
            process.exit(0);
        });
        client.initialize();
    } catch (e) { console.error(e); }
}

rodarAniversarios();
