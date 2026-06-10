const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3333;

app.use(express.static(path.join(__dirname)));

// Endpoint para ler os logs dos robôs
app.get('/api/logs', (req, res) => {
    const logPath = path.join(__dirname, '..', '..', '..', '2-RT-Compliance', 'linkedin_log.txt');
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        res.json({ success: true, content });
    } else {
        res.json({ success: false, message: 'Log não encontrado' });
    }
});

// Endpoint para listar os leads do CSV (Top 10 para o dashboard)
app.get('/api/leads', (req, res) => {
    const csvPath = path.join(__dirname, '..', '..', '..', '2-RT-Compliance', 'petshops_bh_enriquecidos.csv');
    const leads = [];

    if (!fs.existsSync(csvPath)) {
        return res.json({ success: false, message: 'Planilha não encontrada' });
    }

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
            if (leads.length < 10) leads.push(data);
        })
        .on('end', () => {
            res.json({ success: true, leads });
        });
});

// NOVO: Endpoint para Leads de Prospecção Manual
app.get('/api/manual-leads', (req, res) => {
    const csvPath = path.join(__dirname, '..', '..', '..', '2-RT-Compliance', 'novos_leads_prospeccao.csv');
    const sentPath = path.join(__dirname, '..', '..', '..', '2-RT-Compliance', 'rt_petshops_contatados.json');
    const leads = [];
    
    let contatados = [];
    if (fs.existsSync(sentPath)) {
        try {
            contatados = JSON.parse(fs.readFileSync(sentPath, 'utf8'));
        } catch(e) {}
    }

    if (!fs.existsSync(csvPath)) {
        return res.json({ success: false, message: 'Planilha não encontrada' });
    }

    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
            const jaContatado = contatados.some(c => c.telOriginal === data.TELEFONE);
            if (!jaContatado) {
                leads.push(data);
            }
        })
        .on('end', () => {
            res.json({ success: true, leads: leads.slice(0, 15) });
        });
});

// Endpoint para Estatísticas Reais
app.get('/api/stats', (req, res) => {
    const stats = { aika: 0, linkedin: 0, leads: 0 };

    // 1. Contar Aika
    const aikaPath = path.join(__dirname, '..', '..', '..', '1-Farmacia-Ecommerce', 'Sistema de Fidelização Otimiza', 'disparos_whatsapp_hoje.json');
    if (fs.existsSync(aikaPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(aikaPath, 'utf8'));
            stats.aika = data.length;
        } catch(e) {}
    }

    // 2. Contar LinkedIn (no log)
    const logPath = path.join(__dirname, '..', '..', '..', '2-RT-Compliance', 'linkedin_log.txt');
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const matches = content.match(/✔️/g);
        stats.linkedin = matches ? matches.length : 0;
    }

    // 3. Contar Leads (CSV)
    const csvPath = path.join(__dirname, '..', '..', '..', '2-RT-Compliance', 'petshops_bh_enriquecidos.csv');
    if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf8');
        stats.leads = content.split('\n').length - 1;
    }

    res.json({ success: true, stats });
});

app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 GIO CENTRAL ONLINE em http://localhost:${PORT}`);
    console.log(`===================================================`);
});
