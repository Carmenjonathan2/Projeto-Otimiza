const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Módulo de integração Z-API
const zapi = require('../../../src/integracoes/integracao_zapi');

// CONFIGURAÇÕES
const CSV_FILE = path.resolve(__dirname, '../../../../2-RT-Compliance/novos_leads_prospeccao.csv');
const JSON_CONTATADOS = path.resolve(__dirname, '../../../../2-RT-Compliance/rt_petshops_contatados.json');
const MAX_ENVIOS_DIA = 10; 

console.log(`[INICIO] rt_petshops_prospect.js ${new Date().toISOString()}`);

if (!fs.existsSync(JSON_CONTATADOS)) {
    fs.writeFileSync(JSON_CONTATADOS, JSON.stringify([], null, 2));
}
let contatados = JSON.parse(fs.readFileSync(JSON_CONTATADOS));

const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if (!limpo || limpo === '') return null;
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

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const messageText = `🏥 *Relatório Kyenner RT: Petshops/Clínicas (Z-API)* \n\n✅ Sucessos: *${sucessos}*\n❌ Falhas: *${falhas}*`;

    try {
        await axios.post(url, { chat_id: chatId, text: messageText, parse_mode: 'Markdown' });
    } catch (e) {
        console.error("❌ Erro Telegram:", e.message);
    }
}

async function main() {
    console.log("✅ Kyenner RT (Z-API): Ativo.");
    
    const leads = await carregarLeads();
    
    if (leads.length === 0) {
        console.log("[OK] Nenhum lead para processar.");
        console.log(`[OK] rt_petshops_prospect.js ${new Date().toISOString()} — Fim sem envios.`);
        process.exit(0);
    }

    let enviosLocais = 0;
    let sucessos = 0;
    let falhas = 0;
    
    for (let lead of leads) {
        if (enviosLocais >= MAX_ENVIOS_DIA) break;

        const phone = limparTelefone(lead.TELEFONE);
        if (!phone) continue; 
        
        const jaFoiContatado = contatados.some(c => c.telOriginal === lead.TELEFONE);
        if (jaFoiContatado) continue;

        const nomeLead = lead.NOME.trim();
        const mensagem = 
`Olá, tudo bem? Sou o *Kyenner* da Otimiza FarmaVet! 🐾

Vi o trabalho de vocês na *${nomeLead}* e gostaria de validar como está o suporte de Responsabilidade Técnica (RT) de vocês hoje.

Atualmente oferecemos uma blindagem técnica completa para estabelecimentos veterinários, garantindo total conformidade com o CRMV e órgãos reguladores.

Podemos conversar 2 minutinhos só para eu te explicar como funciona esse suporte especializado?`;

        console.log(`\n🎯 [${enviosLocais + 1}/${MAX_ENVIOS_DIA}] -> Processando Petshop: ${nomeLead} (+${phone})`);
        
        try {
            await zapi.enviarMensagemTexto(phone, mensagem);
            console.log(`  ✔️ Sucesso via Z-API!`);
            sucessos++;

            contatados.push({
                nome: nomeLead,
                telOriginal: lead.TELEFONE,
                status: "RT Petshop Prospectado",
                data: new Date().toISOString()
            });
            fs.writeFileSync(JSON_CONTATADOS, JSON.stringify(contatados, null, 2));
            enviosLocais++;
            
            await new Promise(r => setTimeout(r, 10000)); // 10 segundos de respiro
        } catch (e) {
            console.error(`  ❌ Erro ao enviar para ${nomeLead}:`, e.message);
            falhas++;
        }
    }

    await enviarRelatorioTelegram(sucessos, falhas);
    console.log(`[OK] rt_petshops_prospect.js ${new Date().toISOString()} — Sucessos: ${sucessos}, Falhas: ${falhas}`);
    process.exit(0);
}

main().catch(err => {
    console.error(`[ERRO] rt_petshops_prospect.js erro fatal:`, err.message);
    process.exit(1);
});
