const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

const RAW_FILE = path.join(__dirname, '..', '..', '..', 'petshops_mg_600_leads.csv');
const ENRICHED_FILE = path.join(__dirname, '..', '..', '..', 'petshops_bh_enriquecidos.csv');
const LIMIT_DIARIO = 60;

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
    if (!url || url === "N/A" || url.includes("instagram.com") || url.includes("facebook.com")) return null;
    try {
        const response = await axios.get(url, { timeout: 5000 });
        const emails = response.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        return emails ? emails[0] : null;
    } catch (e) {
        return null;
    }
}

async function run() {
    console.log(`[INICIO] enriquecedor_diario.js ${new Date().toISOString()}`);

    const rawLeads = await carregarCsv(RAW_FILE);
    const enrichedLeads = await carregarCsv(ENRICHED_FILE);
    
    const enrichedIds = new Set(enrichedLeads.map(l => l.Place_ID));
    const leadsParaProcessar = rawLeads.filter(l => !enrichedIds.has(l.Place_ID)).slice(0, LIMIT_DIARIO);

    if (leadsParaProcessar.length === 0) {
        console.log("✅ Todos os leads já foram enriquecidos.");
        return;
    }

    for (let lead of leadsParaProcessar) {
        console.log(`🔎 Enriquecendo: ${lead.Nome}...`);
        const email = await findEmailOnSite(lead.Website);
        
        const novoLead = {
            Nome: lead.Nome,
            Telefone: lead.Telefone,
            Website: lead.Website,
            Endereco: lead.Endereco,
            Place_ID: lead.Place_ID,
            Email_Extraido: email || ""
        };

        // Salvar no arquivo enriquecido imediatamente (Append)
        const row = `"${novoLead.Nome}","${novoLead.Telefone}","${novoLead.Website}","${novoLead.Endereco}","${novoLead.Place_ID}","${novoLead.Email_Extraido}"\n`;
        fs.appendFileSync(ENRICHED_FILE, row);
        
        console.log(`✅ Salvo: ${novoLead.Nome}`);
        
        // Pequeno delay para não sobrecarregar sites
        await new Promise(r => setTimeout(r, 500));
    }
    console.log(`[OK] enriquecedor_diario.js ${new Date().toISOString()} — Rodada concluída.`);
}

run().catch(console.error);
