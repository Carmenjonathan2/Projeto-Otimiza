const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

const RAW_FILE = path.join(__dirname, '..', '..', '..', 'scraper-condominios-bh', 'condominios_residenciais_bh.csv');
const ENRICHED_FILE = path.join(__dirname, '..', '..', '..', 'condominios_enriquecidos.csv');
const JSON_CONTATADOS = path.join(__dirname, '..', '..', '..', 'b2b_contatados.json');

async function carregarCsv(file) {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(file)) return resolve([]);
        fs.createReadStream(file)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
}

async function findEmailOnSite(url) {
    if (!url || url === "Não disponível" || url === "N/A" || url.includes("instagram.com") || url.includes("facebook.com")) return null;
    try {
        console.log(`   🌐 Acessando: ${url}...`);
        const response = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const emails = response.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        return emails ? [...new Set(emails)][0] : null; // Pega o primeiro e remove duplicatas
    } catch (e) {
        return null;
    }
}

async function run() {
    console.log("🧪 Iniciando Enriquecimento de E-mails para Condomínios...");

    const rawLeads = await carregarCsv(RAW_FILE);
    const contatados = fs.existsSync(JSON_CONTATADOS) ? JSON.parse(fs.readFileSync(JSON_CONTATADOS)) : [];
    const jaContatadosTels = new Set(contatados.map(c => c.telOriginal));

    if (!fs.existsSync(ENRICHED_FILE)) {
        fs.writeFileSync(ENRICHED_FILE, "NOME,TELEFONE,ENDERECO,SITE,EMAIL,STATUS_WHATSAPP\n");
    }

    const enrichedLeads = await carregarCsv(ENRICHED_FILE);
    const enrichedNames = new Set(enrichedLeads.map(l => l.NOME));

    const leadsParaProcessar = rawLeads.filter(l => !enrichedNames.has(l.NOME));

    if (leadsParaProcessar.length === 0) {
        console.log("✅ Todos os leads de condomínio já foram processados.");
        return;
    }

    console.log(`📊 Encontrados ${leadsParaProcessar.length} leads novos para enriquecer.`);

    for (let lead of leadsParaProcessar) {
        const jaConversou = jaContatadosTels.has(lead.TELEFONE);
        console.log(`🔎 [${jaConversou ? 'WHATS OK' : 'WHATS FALHOU/PENDENTE'}] Enriquecendo: ${lead.NOME}...`);
        
        let email = "";
        if (lead.SITE && lead.SITE !== "Não disponível") {
            email = await findEmailOnSite(lead.SITE) || "";
        }
        
        const statusWhats = jaConversou ? "Contatado via Whats" : "Falha/Pendente Whats";
        const row = `"${lead.NOME.replace(/"/g, '""')}","${lead.TELEFONE}","${lead.ENDERECO.replace(/"/g, '""')}","${lead.SITE}","${email}","${statusWhats}"\n`;
        
        fs.appendFileSync(ENRICHED_FILE, row);
        if (email) console.log(`   ✅ E-mail encontrado: ${email}`);
        
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`🏁 Enriquecimento finalizado. Arquivo salvo em: ${ENRICHED_FILE}`);
}

run().catch(console.error);
