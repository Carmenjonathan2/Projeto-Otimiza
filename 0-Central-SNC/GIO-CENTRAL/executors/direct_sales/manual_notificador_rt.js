const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { google } = require('googleapis');
require('dotenv').config();

const INPUT_FILE = path.join(__dirname, '..', '..', '..', 'novos_leads_prospeccao.csv');
const SENT_TRACKER = path.join(__dirname, '..', '..', '..', 'rt_petshops_contatados.json');
const LIMIT_PER_DAY = 10;

// Configuração da Mensagem (Copy do Kyenner para RT)
const MENSAGEM_TEMPLATE = (nome) => 
`Olá, tudo bem? Sou o *Kyenner* da Otimiza FarmaVet! 🐾
Vi o trabalho de vocês na *${nome}* e gostaria de validar como está o suporte de Responsabilidade Técnica (RT) de vocês hoje. Podemos conversar 2 minutinhos?`;

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
    console.log(`[INICIO] manual_notificador_rt.js ${new Date().toISOString()}`);

    if (!fs.existsSync(SENT_TRACKER)) fs.writeFileSync(SENT_TRACKER, JSON.stringify([], null, 2));
    const enviados = JSON.parse(fs.readFileSync(SENT_TRACKER));

    const leads = await carregarLeads();
    // Filtro: não contatados e com telefone válido
    const paraEnviar = leads.filter(l => {
        const jaFoi = enviados.some(e => e.telOriginal === l.TELEFONE);
        return !jaFoi && l.TELEFONE && l.TELEFONE !== "N/A";
    }).slice(0, LIMIT_PER_DAY);

    if (paraEnviar.length === 0) {
        console.log("📭 Nenhum lead novo de RT para hoje.");
        return;
    }

    let htmlLeads = `<h2>🐾 Lista de Prospecção Manual RT (Kyenner)</h2>
    <p>Devido à cautela com o WhatsApp, aqui estão os leads de hoje para contato manual via e-mail/telefone.</p>
    <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f2f2f2;">
            <th>Nome</th>
            <th>Telefone</th>
            <th>Ação</th>
        </tr>`;

    paraEnviar.forEach(l => {
        const telLimpo = l.TELEFONE.replace(/\D/g, '');
        const msg = MENSAGEM_TEMPLATE(l.NOME);
        const link = `https://wa.me/${telLimpo}?text=${encodeURIComponent(msg)}`;
        
        htmlLeads += `<tr>
            <td>${l.NOME}</td>
            <td>${l.TELEFONE}</td>
            <td><a href="${link}" style="background-color:#007bff;color:white;padding:5px 10px;text-decoration:none;border-radius:5px;font-weight:bold;">Chamar Manualmente</a></td>
        </tr>`;
    });

    htmlLeads += `</table><p>Envie com calma para evitar novos bloqueios.</p>`;

    try {
        const auth = await getAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });
        
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const adminEmail = profile.data.emailAddress;

        const raw = createMimeMessage(adminEmail, `[Kyenner] Lista de RT - ${paraEnviar.length} Leads para Hoje`, htmlLeads);

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });

        console.log(`[OK] manual_notificador_rt.js ${new Date().toISOString()} — E-mail enviado para ${adminEmail} com ${paraEnviar.length} leads.`);
        
        // No RT manual, o Kyenner pede para não registrar como contatado automaticamente no JSON 
        // para que o bot oficial tente depois se quiser? 
        // Não, o usuário pediu o email justamente porque o bot está bloqueado.
        // Vou registrar para não mandar o mesmo lead amanhã.
        paraEnviar.forEach(l => {
            enviados.push({
                nome: l.NOME,
                telOriginal: l.TELEFONE,
                status: "E-mail Notificado (Manual)",
                data: new Date().toISOString()
            });
        });
        fs.writeFileSync(SENT_TRACKER, JSON.stringify(enviados, null, 2));

    } catch (e) {
        console.error("❌ Erro ao enviar notificação RT:", e.message);
    }
}

run();
