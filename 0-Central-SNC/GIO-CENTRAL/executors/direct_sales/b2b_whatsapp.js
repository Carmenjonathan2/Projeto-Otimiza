const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const CSV_FILE = path.join(__dirname, '..', '..', '..', 'scraper-condominios-bh', 'condominios_bh.csv');
const JSON_CONTATADOS = path.join(__dirname, '..', '..', '..', 'b2b_contatados.json');
const MAX_ENVIOS_DIA = 20;

console.log(`[INICIO] b2b_whatsapp.js ${new Date().toISOString()}`);

if (!fs.existsSync(JSON_CONTATADOS)) fs.writeFileSync(JSON_CONTATADOS, JSON.stringify([], null, 2));
let contatados = JSON.parse(fs.readFileSync(JSON_CONTATADOS));

const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if(!limpo) return null;
    if(limpo.startsWith('55')) limpo = limpo.substring(2);
    if(limpo.length === 11) return `55${limpo}@c.us`;
    if(limpo.length === 10) return `55${limpo}@c.us`; 
    return null;
};

const carregarLeads = () => {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(CSV_FILE)) return resolve([]);
        fs.createReadStream(CSV_FILE).pipe(csv()).on('data', (data) => results.push(data)).on('end', () => resolve(results));
    });
};

async function enviarRelatorioTelegram(sucessos, falhas) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;
    const messageText = `🏢 *Aika B2B Turbo: Condomínios* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;
    try { await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: messageText, parse_mode: 'Markdown' }); } catch (e) {}
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "aika-b2b" }),
    puppeteer: { 
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// [Blindagem 4] Auto-Healing
client.on('disconnected', (reason) => {
    console.log('❌ Aika desconectada:', reason);
    console.log('🔄 Tentando reiniciar em 30 segundos...');
    setTimeout(() => client.initialize(), 30000);
});

client.on('qr', (qr) => {
    console.log('⚠️ QR Code necessário para a Aika:');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, {small: true});
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('loading_screen', (percent, message) => {
    console.log('⏳ Carregando WhatsApp:', percent, '% -', message);
});

client.on('ready', async () => {
    console.log("🚀 MODO TURBO B2B: Ativo.");
    const leads = await carregarLeads();
    let envios = 0, sucessos = 0, falhas = 0;

    for (let lead of leads) {
        if (envios >= MAX_ENVIOS_DIA) break;
        const jid = limparTelefone(lead.TELEFONE);
        if(!jid || contatados.some(c => c.telOriginal === lead.TELEFONE)) continue;

        const nome = lead.NOME.split(/[-|]/)[0].trim();
        const msg = `Olá, tudo bem? 🐾 Sou da equipe da Otimiza FarmaVet.

Estamos lançando a campanha *Vet em casa e agora no seu condomínio* e gostaria de falar com o responsável por parcerias. Oferecemos Vacinação em Domicílio com **preço social de apenas R$ 20,00** (sem custo para a administradora). Com quem consigo falar?`;

        try {
            const numero = jid.split('@')[0];
            const numberId = await client.getNumberId(numero);
            if (numberId) {
                console.log(`🎯 [${envios+1}] Enviando para: ${nome}...`);
                await client.sendMessage(numberId._serialized, msg);
                console.log(`   ✔️ Sucesso!`);
                sucessos++;
                contatados.push({ nome: lead.NOME, telOriginal: lead.TELEFONE, data: new Date().toISOString() });
                fs.writeFileSync(JSON_CONTATADOS, JSON.stringify(contatados, null, 2));
                envios++;
                await new Promise(r => setTimeout(r, 60000)); // 1 minuto de segurança (Ritmo Humano)
            } else {
                console.log(`   ⚠️ Número não possui WhatsApp ativo: ${numero}`);
                falhas++;
            }
        } catch(e) { console.error(`   ❌ Erro: ${e.message}`); falhas++; }
    }
    await enviarRelatorioTelegram(sucessos, falhas);
    console.log(`[OK] b2b_whatsapp.js ${new Date().toISOString()} — Sucessos: ${sucessos}, Falhas: ${falhas}`);
    await client.destroy();
    process.exit(0);
});

client.initialize();
