const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const WHATSAPP_QUEUE_FILE = path.resolve(__dirname, 'lessie_whatsapp_queue.json');
const LEADS_DB_FILE = path.resolve(__dirname, 'lessie_leads_db.json');
const LEADS_REPORT_FILE = path.resolve(__dirname, 'lessie_leads_report.md');

/**
 * Tenta carregar o token de autenticação do Google do diretório do cold-email-automation.
 */
async function getGoogleAuth() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    const possibleTokenPaths = [
        path.resolve(__dirname, '../2-RT-Compliance/cold-email-automation/token.json'),
        path.resolve(__dirname, '../2-RT-Compliance/cold-email-automation/token_otimiza.json'),
        path.resolve(__dirname, '../token.json')
    ];

    let tokenLoaded = false;
    for (const tokenPath of possibleTokenPaths) {
        if (fs.existsSync(tokenPath)) {
            try {
                const tokenData = fs.readFileSync(tokenPath, 'utf8');
                oauth2Client.setCredentials(JSON.parse(tokenData));
                console.log(`🔑 Token carregado com sucesso de: ${path.basename(tokenPath)}`);
                tokenLoaded = true;
                break;
            } catch (err) {
                console.error(`⚠️ Erro ao ler token em ${tokenPath}:`, err.message);
            }
        }
    }

    if (!tokenLoaded) {
        throw new Error("❌ Nenhum token.json válido do Google OAuth encontrado.");
    }

    return oauth2Client;
}

/**
 * Insere o lead qualificado diretamente na planilha do Google Sheets oficial de prospecção.
 * @param {any} assessedLead Dados do lead analisado e qualificado pelo Gemini
 */
async function dispatchToGoogleSheets(assessedLead) {
    if (!assessedLead.emailDestino || assessedLead.emailDestino.trim() === "") {
        console.log(`⚠️ Lead ${assessedLead.empresa} não possui e-mail. Ignorando envio para o Google Sheets.`);
        return false;
    }

    try {
        const auth = await getGoogleAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Estrutura das Colunas:
        // A: Nome | B: Razão Social | C: Nome Fantasia | D: Endereço/Cidade | E: Email | F: Contexto | G: Status
        const values = [[
            assessedLead.nomeContato,
            "", // Razão Social (vazio ou preenchido pela IA se achado)
            assessedLead.empresa,
            assessedLead.nicho, // Usando nicho/endereco conforme padrão da planilha
            assessedLead.emailDestino,
            assessedLead.contextoIA,
            "Aguardando" // O script de cold-email-automation processa quem está como Aguardando
        ]];

        console.log(`📤 Injetando lead "${assessedLead.empresa}" na planilha do Google Sheets...`);
        
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Página1!A:G',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values }
        });

        console.log(`✅ Lead "${assessedLead.empresa}" cadastrado com sucesso no Google Sheets.`);
        return true;
    } catch (e) {
        console.error(`❌ Erro ao enviar lead para o Google Sheets:`, e.message);
        return false;
    }
}

/**
 * Gera a mensagem personalizada de WhatsApp com base no perfil e persona.
 * @param {any} assessedLead Dados do lead analisado
 */
function buildWhatsAppMessage(assessedLead) {
    if (assessedLead.persona === 'Aika') {
        return `Olá, ${assessedLead.nomeContato}! 🐾 Sou a *Aika* da equipe da *Otimiza FarmaVet*.
        
${assessedLead.contextoIA}

Trabalhamos com manipulação veterinária e temos uma proposta de parceria para pet shops e banho e tosa na região. Oferecemos campanhas de vacinação com preço social de apenas R$ 20,00, agregando muito valor para os seus clientes. 

Podemos conversar 2 minutinhos só para eu te contar como funciona?`;
    } else {
        return `Olá, ${assessedLead.nomeContato}, tudo bem? Sou o *Kyenner* da *Otimiza FarmaVet*! 🐾
        
${assessedLead.contextoIA}

Atualmente ajudamos clínicas e hospitais veterinários da sua região com suporte completo de Responsabilidade Técnica (RT) e blindagem perante o CRMV e vigilância sanitária.

Conseguimos falar dois minutos sobre como podemos apoiar a conformidade técnica da ${assessedLead.empresa} hoje?`;
    }
}

/**
 * Adiciona o lead qualificado à fila local de prospecção do WhatsApp.
 * @param {any} assessedLead Dados do lead analisado
 * @param {string} telefone Telefone original do lead
 */
async function dispatchToWhatsAppQueue(assessedLead, telefone) {
    if (!telefone || telefone.trim() === "" || telefone === "N/A") {
        console.log(`⚠️ Lead ${assessedLead.empresa} não possui telefone comercial. Ignorando fila de WhatsApp.`);
        return false;
    }

    try {
        let queue = [];
        if (fs.existsSync(WHATSAPP_QUEUE_FILE)) {
            const fileData = fs.readFileSync(WHATSAPP_QUEUE_FILE, 'utf8');
            queue = JSON.parse(fileData);
        }

        // Evita duplicados na fila pelo telefone
        const jaExiste = queue.some(item => item.telefone === telefone);
        if (jaExiste) {
            console.log(`ℹ️ Lead com telefone ${telefone} já está na fila de WhatsApp.`);
            return false;
        }

        const msgZap = buildWhatsAppMessage(assessedLead);

        queue.push({
            nomeContato: assessedLead.nomeContato,
            empresa: assessedLead.empresa,
            telefone: telefone,
            persona: assessedLead.persona,
            nicho: assessedLead.nicho,
            contextoIA: assessedLead.contextoIA,
            mensagemZap: msgZap,
            status: "Aguardando",
            dataAdicao: new Date().toISOString()
        });

        fs.writeFileSync(WHATSAPP_QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
        console.log(`📱 Lead "${assessedLead.empresa}" adicionado à fila local de WhatsApp (lessie_whatsapp_queue.json).`);
        return true;
    } catch (e) {
        console.error(`❌ Erro ao salvar lead na fila do WhatsApp:`, e.message);
        return false;
    }
}

/**
 * Salva o dossiê completo do lead no banco local lessie_leads_db.json e atualiza o relatório lessie_leads_report.md
 * @param {any} assessedLead Dados qualificados do lead
 * @param {any} rawLeadData Dados brutos coletados
 */
async function dispatchToLocalDatabase(assessedLead, rawLeadData) {
    try {
        let db = [];
        if (fs.existsSync(LEADS_DB_FILE)) {
            db = JSON.parse(fs.readFileSync(LEADS_DB_FILE, 'utf8'));
        }

        // Evita duplicados pela Razão Social ou Telefone
        const index = db.findIndex(item => item.empresa === assessedLead.empresa || (item.telefone && item.telefone === rawLeadData.phone));
        
        const leadRecord = {
            empresa: assessedLead.empresa,
            nomeContato: assessedLead.nomeContato,
            nicho: assessedLead.nicho,
            persona: assessedLead.persona,
            score: assessedLead.score,
            motivo: assessedLead.motivo,
            contextoIA: assessedLead.contextoIA,
            email: assessedLead.emailDestino || rawLeadData.email || "",
            telefone: rawLeadData.phone || assessedLead.telefone || "",
            temRT: assessedLead.temRT || "Dúvida",
            grauIntencao: assessedLead.grauIntencao || "Médio",
            dorIdentificada: assessedLead.dorIdentificada || "Prospecção ativa padrão.",
            scriptLigacao: assessedLead.scriptLigacao || "",
            mapsRating: rawLeadData.rating,
            mapsReviewsCount: rawLeadData.reviewsCount,
            website: rawLeadData.website || "",
            endereco: rawLeadData.address || "",
            dataColeta: new Date().toISOString()
        };

        if (index !== -1) {
            db[index] = leadRecord; // Atualiza cadastro existente
        } else {
            db.push(leadRecord); // Insere novo lead
        }

        fs.writeFileSync(LEADS_DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        console.log(`💾 Lead "${assessedLead.empresa}" salvo na base local lessie_leads_db.json.`);
        
        // Regenerar o relatório visual em Markdown para o usuário
        generateMarkdownReport(db);

        return true;
    } catch (e) {
        console.error("❌ Erro ao salvar na base local de leads:", e.message);
        return false;
    }
}

/**
 * Gera um relatório visual de prospecção com a Tabela de Match e roteiros de ligação
 * @param {any[]} db Base de dados atualizada de leads
 */
function generateMarkdownReport(db) {
    // Ordena por Score descrescente (leads de maior prioridade no topo)
    const sortedLeads = [...db].sort((a, b) => b.score - a.score);

    let md = `# 🕵️‍♂️ Painel de Leads Lessie AI — Tabela de Match\n`;
    md += `*Gerado/Atualizado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
    md += `Este painel centraliza a qualificação profunda de leads da Otimiza FarmaVet. Focado em indicar conformidade (RT), dores e scripts telefônicos para o time comercial.\n\n`;
    
    md += `## 📊 Tabela de Match (Prioridade por Score)\n\n`;
    md += `| Score | Empresa | Contato | Telefone | E-mail | Persona | Tem RT? | Grau Intenção | Dor/Oportunidade |\n`;
    md += `| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |\n`;

    sortedLeads.forEach(l => {
        const scoreStars = "⭐".repeat(l.score);
        md += `| ${scoreStars} | **${l.empresa}** | ${l.nomeContato} | ${l.telefone || '*Sem Telefone*'} | ${l.email || '*Sem E-mail*'} | \`${l.persona}\` | ${l.temRT} | ${l.grauIntencao} | ${l.dorIdentificada} |\n`;
    });

    md += `\n---\n\n`;
    md += `## 📞 Roteiros de Ligação Fria (Pitch Comercial por Persona)\n\n`;
    
    md += `### 🏥 Kyenner (RT & Conformidade)\n`;
    const leadsKyenner = sortedLeads.filter(l => l.persona === 'Kyenner');
    if (leadsKyenner.length === 0) {
        md += `*Nenhum lead de RT na fila no momento.*\n`;
    } else {
        leadsKyenner.forEach(l => {
            md += `*   **${l.empresa}** (${l.nomeContato} - ${l.telefone}):\n`;
            md += `    > 🗣️ *"${l.scriptLigacao}"*\n\n`;
        });
    }

    md += `### 🐾 Aika (Vet em Casa / Parcerias)\n`;
    const leadsAika = sortedLeads.filter(l => l.persona === 'Aika');
    if (leadsAika.length === 0) {
        md += `*Nenhum lead de Parceria na fila no momento.*\n`;
    } else {
        leadsAika.forEach(l => {
            md += `*   **${l.empresa}** (${l.nomeContato} - ${l.telefone}):\n`;
            md += `    > 🗣️ *"${l.scriptLigacao}"*\n\n`;
        });
    }

    fs.writeFileSync(LEADS_REPORT_FILE, md, 'utf8');
    console.log(`📊 Relatório em Markdown atualizado em: ${LEADS_REPORT_FILE}`);
}

module.exports = {
    dispatchToGoogleSheets,
    dispatchToWhatsAppQueue,
    dispatchToLocalDatabase
};
