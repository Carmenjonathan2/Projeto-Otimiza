const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// Configurações dos arquivos
const RAW_FILE = path.join(__dirname, 'scraper-condominios-bh', 'condominios_bh.csv');
const ENRICHED_FILE = path.join(__dirname, 'condominios_enriquecidos.csv');

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
    if (!url || url === "N/A" || url === "Não disponível" || url.includes("instagram.com") || url.includes("facebook.com")) return null;
    try {
        console.log(`   🌐 Acessando: ${url}...`);
        const response = await axios.get(url, { 
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
        });
        const emails = response.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        
        if (emails) {
            // Filtrar e-mails comuns que não queremos (placeholders)
            const filtrados = emails.filter(e => !e.includes('example.com') && !e.includes('sentry.io') && !e.includes('wix.com'));
            return filtrados.length > 0 ? filtrados[0] : null;
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function run() {
    console.log("🧪 Iniciando Enriquecimento de Condomínios...");

    const rawLeads = await carregarCsv(RAW_FILE);
    const enrichedLeads = await carregarCsv(ENRICHED_FILE);
    
    // Usar o Nome como chave única para condomínios
    const enrichedNames = new Set(enrichedLeads.map(l => l.NOME));
    const leadsParaProcessar = rawLeads.filter(l => !enrichedNames.has(l.NOME));

    console.log(`📊 Total na base: ${rawLeads.length}`);
    console.log(`📊 Já enriquecidos: ${enrichedLeads.size || enrichedNames.size}`);
    console.log(`🚀 Novos para processar: ${leadsParaProcessar.length}`);

    if (leadsParaProcessar.length === 0) {
        console.log("✅ Todos os leads já estão na base enriquecida.");
        return;
    }

    for (let lead of leadsParaProcessar) {
        console.log(`🔎 Buscando e-mail para: ${lead.NOME}...`);
        let email = null;
        
        if (lead.SITE && lead.SITE !== "Não disponível") {
            email = await findEmailOnSite(lead.SITE);
        }

        const novoLead = {
            NOME: lead.NOME,
            TELEFONE: lead.TELEFONE,
            ENDERECO: lead.ENDERECO,
            SITE: lead.SITE,
            EMAIL: email || "",
            STATUS_WHATSAPP: "Falha/Pendente Whats" // Padrão da sua planilha
        };

        // Salvar imediatamente no CSV enriquecido (Append)
        const row = `"${novoLead.NOME}","${novoLead.TELEFONE}","${novoLead.ENDERECO}","${novoLead.SITE}","${novoLead.EMAIL}","${novoLead.STATUS_WHATSAPP}"\n`;
        fs.appendFileSync(ENRICHED_FILE, row);
        
        if (email) {
            console.log(`   ✅ E-mail encontrado: ${email}`);
        } else {
            console.log(`   ❌ Nenhum e-mail novo encontrado.`);
        }
        
        // Delay para evitar bloqueios
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n🏁 Enriquecimento finalizado!");
}

run().catch(console.error);
