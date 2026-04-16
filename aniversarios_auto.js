const fs = require('fs');
const { google } = require('googleapis');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { DateTime } = require('luxon');
const axios = require('axios');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
require('dotenv').config({ path: './cold-email-automation/.env' });

const ARQUIVO_QR = 'conexao_comercial.png';

// ==========================================
// CONFIGURAÇÕES E COPY (Pode editar o negrito aqui)
// ==========================================
const SPREADSHEET_ID = '1j8wDixIqT6QEbCFecGTftuE8jCN0nlHAeKjao9m3xUs';
const RANGE = 'relatorio_aniversariantes!A2:C'; 

// Mensagem Editável (Use asteriscos para negrito no WhatsApp)
const MENSAGEM_TEMPLATE = (nome) => 
`Olá, *${nome}*! 🐾 Aqui é a Aika da *Otimiza FarmaVet*!

Passando para te desejar um **aniversário incrível** e cheio de alegria! 🎉

Para comemorar, preparei um presente especial: **15% OFF** em todo o nosso site para você e seu pet! 🎁

Resgate seu desconto aqui: https://otimizafarmavet.com.br/discount/Aniver_Best_tutor

Aproveite muito o seu dia! 🦴🎂`;

// ==========================================
// MOTOR DE EXECUÇÃO
// ==========================================

async function getAuthClient() {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    // Tenta carregar o token já existente do outro projeto
    const tokenPath = './cold-email-automation/token.json';
    if (!fs.existsSync(tokenPath)) {
        throw new Error("Token do Google não encontrado em " + tokenPath);
    }
    const token = fs.readFileSync(tokenPath);
    auth.setCredentials(JSON.parse(token));
    return auth;
}

async function enviarRelatorioTelegram(sucessos, falhas) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
        console.log("⚠️ Telegram não configurado.");
        return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const message = `🎂 *Relatório de Aniversários - Aika* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;

    try {
        await axios.post(url, { chat_id: chatId, text: message, parse_mode: 'Markdown' });
        console.log("📱 Relatório enviado ao Telegram.");
    } catch (e) {
        console.error("❌ Erro ao enviar relatório Telegram:", e.message);
    }
}

async function rodarAniversarios() {
    console.log(`\n🕒 Iniciando Verificação de Aniversários: ${DateTime.now().setZone('America/Sao_Paulo').toFormat('dd/MM HH:mm')}`);
    
    let sucessos = 0;
    let falhas = 0;

    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log("📭 Ninguém na lista de tutores.");
            return;
        }

        // Setup WhatsApp - Mudança para Perfil Permanente (Chrome Real)
        const client = new Client({
            puppeteer: { 
                headless: true, // Modo silencioso (sessão já autenticada)
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                userDataDir: 'c:\\Users\\jonat\\OneDrive\\Desktop\\Projeto Otimiza\\perfil_aika',
                args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            }
        });

        client.on('qr', async (qr) => {
            console.log("🐾 AIKA: Um novo QR Code foi gerado!");
            try {
                // Gera em ambos os formatos para garantir compatibilidade
                await QRCode.toFile('conexao_comercial.png', qr);
                await QRCode.toFile('conexao_comercial.jpg', qr);
                console.log(`🖼️  Sessão expirada! Escaneie o arquivo [conexao_comercial.jpg] para continuar.`);
                qrcodeTerminal.generate(qr, { small: true });
            } catch (err) {
                console.error('Erro ao gerar QR:', err);
            }
        });

        client.on('ready', async () => {
            console.log("✅ WhatsApp Conectado.");
            // Limpa as imagens para segurança
            if (fs.existsSync('conexao_comercial.png')) fs.unlinkSync('conexao_comercial.png');
            if (fs.existsSync('conexao_comercial.jpg')) fs.unlinkSync('conexao_comercial.jpg');
            const hoje = DateTime.now().setZone('America/Sao_Paulo');

            for (const row of rows) {
                const telefoneRaw = row[0];
                const nomeTutor = row[1];
                const dataNascRaw = row[2];

                if (!telefoneRaw || !dataNascRaw) continue;

                // Parsing da Data (Ex: 22/10/1978 ou Objeto Google)
                let dataNasc;
                if (dataNascRaw.includes('/')) {
                    const [dia, mes] = dataNascRaw.split('/');
                    dataNasc = { dia: parseInt(dia), mes: parseInt(mes) };
                } else {
                    // Tenta parsear como data ISO se vier diferente
                    const d = new Date(dataNascRaw);
                    dataNasc = { dia: d.getDate(), mes: d.getMonth() + 1 };
                }

                if (dataNasc.dia === hoje.day && dataNasc.mes === hoje.month) {
                    console.log(`🎉 Aniversário hoje: ${nomeTutor}`);
                    
                    let telLimpo = telefoneRaw.replace(/\D/g, '');
                    
                    // Se já começar com 55 e tiver 12 ou 13 dígitos, remove o 55 para padronizar
                    if (telLimpo.startsWith('55') && (telLimpo.length === 12 || telLimpo.length === 13)) {
                        telLimpo = telLimpo.substring(2);
                    }
                    
                    const zapId = (telLimpo.length === 10 || telLimpo.length === 11) ? `55${telLimpo}@c.us` : null;

                    if (zapId) {
                        try {
                            const msg = MENSAGEM_TEMPLATE(nomeTutor);
                            await client.sendMessage(zapId, msg);
                            console.log(`  ✔️ Mensagem enviada para ${nomeTutor}`);
                            sucessos++;
                            // Delay pequeno entre envios para não travar
                            await new Promise(r => setTimeout(r, 5000));
                        } catch (e) {
                            console.error(`  ❌ Falha no envio para ${nomeTutor}:`, e.message);
                            falhas++;
                        }
                    } else {
                        console.log(`  ⚠️ Telefone inválido: ${telefoneRaw}`);
                        falhas++;
                    }
                }
            }

            await enviarRelatorioTelegram(sucessos, falhas);
            console.log("\n🏁 Fim da rotina de aniversários.");
            process.exit(0);
        });

        client.initialize();

    } catch (error) {
        console.error("❌ Erro fatal na rotina:", error.message);
        process.exit(1);
    }
}

// Execução
rodarAniversarios();
