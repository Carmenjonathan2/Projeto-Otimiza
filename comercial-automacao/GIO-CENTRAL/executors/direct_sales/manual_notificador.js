const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { google } = require('googleapis');
require('dotenv').config();

const INPUT_FILE = path.join(__dirname, '..', '..', '..', 'petshops_bh_enriquecidos.csv');
const SENT_TRACKER = path.join(__dirname, '..', '..', '..', 'leads_enviados_manual.json');
const LIMIT_PER_DAY = 20;

// Configuração da Mensagem (Copy da Aika para Petshops)
const MENSAGEM_TEMPLATE = (nome) => 
`Olá, *${nome}*! 🐾 Sou da equipe da *Otimiza FarmaVet*.

Vi o excelente trabalho de vocês e gostaria de falar com o responsável por parcerias. Trabalhamos com manipulação veterinária e temos uma proposta de parceria para farmácias e pet shops parceiros. Com quem consigo falar?`;

// Helper para converter texto em MIME Base64 (padrão Gmail)
function createMimeMessage(to, subject, htmlBody) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        htmlBody
    ];
    const message = messageParts.join('\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAuthClient() {
    const tokenPath = path.join(__dirname, '..', '..', '..', 'cold-email-automation', 'token.json');
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials(JSON.parse(fs.readFileSync(tokenPath)));
    return auth;
}

async function carregarLeads() {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(INPUT_FILE)) return resolve([]);
        fs.createReadStream(INPUT_FILE)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
}

async function run() {
    console.log(`[INICIO] manual_notificador.js ${new Date().toISOString()}`);

    if (!fs.existsSync(SENT_TRACKER)) fs.writeFileSync(SENT_TRACKER, JSON.stringify([], null, 2));
    const enviados = JSON.parse(fs.readFileSync(SENT_TRACKER));

    const leads = await carregarLeads();
    const paraEnviar = leads.filter(l => !enviados.includes(l.Place_ID) && l.Telefone !== "N/A").slice(0, LIMIT_PER_DAY);

    if (paraEnviar.length === 0) {
        console.log("📭 Nenhum lead novo para enviar hoje.");
        return;
    }

    let htmlLeads = `<h2>🐾 Leads do Dia - Prospecção Manual Petshop</h2>
    <p>Olá! Abaixo estão os leads qualificados para contato hoje. Clique no botão para abrir o WhatsApp Web já com a mensagem da Aika pronta.</p>
    <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f2f2f2;">
            <th>Nome</th>
            <th>Telefone</th>
            <th>Ação</th>
        </tr>`;

    paraEnviar.forEach(l => {
        const telLimpo = l.Telefone.replace(/\D/g, '');
        const msg = MENSAGEM_TEMPLATE(l.Nome);
        const link = `https://wa.me/${telLimpo}?text=${encodeURIComponent(msg)}`;
        
        htmlLeads += `<tr>
            <td>${l.Nome}</td>
            <td>${l.Telefone}</td>
            <td><a href="${link}" style="background-color:#25D366;color:white;padding:5px 10px;text-decoration:none;border-radius:5px;font-weight:bold;">Chamar no Whats</a></td>
        </tr>`;
    });

    htmlLeads += `</table><p>Após enviar, marque-os como concluídos.</p>`;

    try {
        const auth = await getAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });
        
        // Buscamos o e-mail do próprio usuário autenticado
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const adminEmail = profile.data.emailAddress;

        const raw = createMimeMessage(adminEmail, `[Aika] Lista de Prospecção Manual - ${paraEnviar.length} Leads`, htmlLeads);

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });

        console.log(`[OK] manual_notificador.js ${new Date().toISOString()} — E-mail enviado para ${adminEmail} com ${paraEnviar.length} leads.`);
        
        // Atualiza rastreador
        paraEnviar.forEach(l => enviados.push(l.Place_ID));
        fs.writeFileSync(SENT_TRACKER, JSON.stringify(enviados, null, 2));

    } catch (e) {
        console.error("❌ Erro ao enviar notificação:", e.message);
    }
}

run();
