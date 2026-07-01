const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Gateway Unificado do WhatsApp
const whatsappGateway = require('../../../src/integracoes/whatsapp_gateway');

const CSV_FILE = path.resolve(__dirname, '../../../../4-Time-Casa/scraper-condominios-bh/condominios_bh.csv');
const JSON_CONTATADOS = path.resolve(__dirname, '../../../../2-RT-Compliance/b2b_contatados.json');
const MAX_ENVIOS_DIA = 20;

console.log(`[INICIO] b2b_whatsapp.js ${new Date().toISOString()}`);

if (!fs.existsSync(JSON_CONTATADOS)) {
    fs.writeFileSync(JSON_CONTATADOS, JSON.stringify([], null, 2));
}
let contatados = JSON.parse(fs.readFileSync(JSON_CONTATADOS));

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

const carregarLeads = () => {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(CSV_FILE)) {
            console.log(`⚠️ CSV de leads não encontrado em: ${CSV_FILE}`);
            return resolve([]);
        }
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
};

async function enviarRelatorioTelegram(sucessos, falhas) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
        console.log("⚠️ Telegram Bot não configurado para envio de relatório.");
        return;
    }
    const messageText = `🏢 *Aika B2B Turbo: Condomínios (Z-API)* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;
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

async function main() {
    console.log("🚀 MODO TURBO B2B (Z-API): Ativo.");
    const leads = await carregarLeads();
    
    if (leads.length === 0) {
        console.log("[OK] Nenhum lead para processar.");
        console.log(`[OK] b2b_whatsapp.js ${new Date().toISOString()} — Fim sem envios.`);
        process.exit(0);
    }

    let envios = 0, sucessos = 0, falhas = 0;

    for (let lead of leads) {
        if (envios >= MAX_ENVIOS_DIA) break;
        
        const phone = limparTelefone(lead.TELEFONE);
        if (!phone || contatados.some(c => c.telOriginal === lead.TELEFONE)) continue;

        const nome = lead.NOME.split(/[-|]/)[0].trim();
        const msg = `Olá, tudo bem? 🐾 Sou da equipe da Otimiza FarmaVet.

Estamos lançando a campanha *Vet em casa e agora no seu condomínio* e gostaria de falar com o responsável por parcerias. Oferecemos Vacinação em Domicílio com **preço social de apenas R$ 20,00** (sem custo para a administradora). Com quem consigo falar?`;

        try {
            console.log(`🎯 [${envios + 1}] Enviando para: ${nome} (+${phone})...`);
            await whatsappGateway.enviarMensagemTexto(phone, msg, false);
            console.log(`   ✔️ Sucesso!`);
            sucessos++;
            contatados.push({ nome: lead.NOME, telOriginal: lead.TELEFONE, data: new Date().toISOString() });
            fs.writeFileSync(JSON_CONTATADOS, JSON.stringify(contatados, null, 2));
            envios++;
            await new Promise(r => setTimeout(r, 10000)); // 10 segundos de segurança (Ritmo Humano)
        } catch (e) { 
            console.error(`   ❌ Erro ao enviar para ${nome}: ${e.message}`); 
            falhas++; 
        }
    }

    await enviarRelatorioTelegram(sucessos, falhas);
    console.log(`[OK] b2b_whatsapp.js ${new Date().toISOString()} — Sucessos: ${sucessos}, Falhas: ${falhas}`);
    process.exit(0);
}

main().catch(err => {
    console.error(`[ERRO] b2b_whatsapp.js erro fatal:`, err.message);
    process.exit(1);
});
