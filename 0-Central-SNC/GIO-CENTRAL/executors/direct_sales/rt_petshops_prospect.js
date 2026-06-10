const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// ==========================================
// CONFIGURAÇÕES
// ==========================================
const CSV_FILE = path.join(__dirname, 'novos_leads_prospeccao.csv');
const JSON_CONTATADOS = path.join(__dirname, 'rt_petshops_contatados.json');
const MAX_ENVIOS_DIA = 10; 

if (!fs.existsSync(JSON_CONTATADOS)) {
    fs.writeFileSync(JSON_CONTATADOS, JSON.stringify([], null, 2));
}

let contatados = JSON.parse(fs.readFileSync(JSON_CONTATADOS));

// ==========================================
// FUNÇÕES DE SUPORTE
// ==========================================

const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if(!limpo || limpo === '') return null;
    if(limpo.startsWith('55')) limpo = limpo.substring(2);
    if (limpo.length === 11 && limpo.substring(2, 3) === '9') return `55${limpo}@c.us`;
    if (limpo.length === 10) return `55${limpo}@c.us`;
    return null;
};

const carregarLeads = () => {
    return new Promise((resolve) => {
        const results = [];
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
};

async function enviarRelatorioTelegram(sucessos, falhas) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const messageText = `🏥 *Relatório Kyenner RT (Petshops/Clínicas)* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;

    try {
        await axios.post(url, { chat_id: chatId, text: messageText, parse_mode: 'Markdown' });
    } catch (e) {
        console.error("❌ Erro Telegram:", e.message);
    }
}

// ==========================================
// MOTOR WHATSAPP
// ==========================================

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "kyenner-rt" }),
    puppeteer: {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// [Blindagem 4] Auto-Healing
client.on('disconnected', (reason) => {
    console.log('❌ Kyenner desconectado:', reason);
    console.log('🔄 Tentando reiniciar em 30 segundos...');
    setTimeout(() => client.initialize(), 30000);
});

client.on('qr', (qr) => {
    console.log('⚠️ AJUDA NECESSÁRIA: QR CODE REQUERIDO:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', async () => {
    console.log("✅ Kyenner Online (RT Petshops).");
    
    const leads = await carregarLeads();
    let enviosLocais = 0;
    let sucessos = 0;
    let falhas = 0;
    
    for (let lead of leads) {
        if (enviosLocais >= MAX_ENVIOS_DIA) break;

        const zapId = limparTelefone(lead.TELEFONE);
        if(!zapId) continue; 
        
        const jaFoiContatado = contatados.some(c => c.telOriginal === lead.TELEFONE);
        if(jaFoiContatado) continue;

        const nomeLead = lead.NOME.trim();
        const mensagem = 
`Olá, tudo bem? Sou o *Kyenner* da Otimiza FarmaVet! 🐾

Vi o trabalho de vocês na *${nomeLead}* e gostaria de validar como está o suporte de Responsabilidade Técnica (RT) de vocês hoje.

Atualmente oferecemos uma blindagem técnica completa para estabelecimentos veterinários, garantindo total conformidade com o CRMV e órgãos reguladores.

Podemos conversar 2 minutinhos só para eu te explicar como funciona esse suporte especializado?`;

        console.log(`\n🎯 [${enviosLocais+1}/${MAX_ENVIOS_DIA}] -> Processando Petshop: ${nomeLead}`);
        
        try {
            const numberId = await client.getNumberId(zapId.split('@')[0]);
            
            if (numberId) {
                const finalId = numberId._serialized;
                await client.sendMessage(finalId, mensagem);
                console.log(`  ✔️ Sucesso via API!`);
                sucessos++;

                contatados.push({
                    nome: nomeLead,
                    telOriginal: lead.TELEFONE,
                    status: "RT Petshop Prospectado",
                    data: new Date().toISOString()
                });
                fs.writeFileSync(JSON_CONTATADOS, JSON.stringify(contatados, null, 2));
                enviosLocais++;
            } else {
                console.log(`  ⚠️ Não registrado: ${zapId}`);
                falhas++;
            }
            
            await new Promise(r => setTimeout(r, 15000)); 

        } catch(e) {
            console.error(`  ❌ Erro:`, e.message);
            falhas++;
        }
    }

    await enviarRelatorioTelegram(sucessos, falhas);
    console.log("\n🏁 Varredura Petshops finalizada.");
});

client.initialize();
