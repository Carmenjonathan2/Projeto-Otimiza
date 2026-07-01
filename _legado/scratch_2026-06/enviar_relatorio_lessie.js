const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const LEADS_DB_FILE = path.resolve(__dirname, '../lessie_leads_db.json');
const DESTINATARIO = "carmenmsdcarvalho@gmail.com";

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
                console.log(`🔑 Token carregado de: ${tokenPath}`);
                tokenLoaded = true;
                break;
            } catch (err) {
                console.error(`⚠️ Erro ao ler token em ${tokenPath}:`, err.message);
            }
        }
    }

    if (!tokenLoaded) {
        throw new Error("❌ Nenhum token.json válido encontrado para autenticação Gmail.");
    }

    return oauth2Client;
}

async function run() {
    console.log(`📧 Preparando envio do relatório Lessie para ${DESTINATARIO}...`);

    if (!fs.existsSync(LEADS_DB_FILE)) {
        console.error("❌ Erro: Base de dados lessie_leads_db.json não encontrada.");
        process.exit(1);
    }

    const db = JSON.parse(fs.readFileSync(LEADS_DB_FILE, 'utf8'));
    // Ordena por score decrescente
    const sortedLeads = db.sort((a, b) => b.score - a.score);

    let html = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            h1 { color: #2B579A; border-bottom: 2px solid #2B579A; padding-bottom: 10px; }
            h2 { color: #E84E1B; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f2f2f2; color: #333; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .score { color: #FFD700; font-size: 16px; }
            .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .aika { background-color: #D4EDDA; color: #155724; }
            .kyenner { background-color: #CCE5FF; color: #004085; }
            .script-box { background-color: #f9f9f9; border-left: 4px solid #007BFF; padding: 10px; margin: 10px 0; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>🕵️‍♂️ Painel de Leads Lessie AI — Tabela de Match</h1>
        <p>Olá Carmen, abaixo está a lista consolidada das <b>${sortedLeads.length} empresas prospectadas e qualificadas</b> pelo Agente Lessie na região de Belo Horizonte/MG (excluindo grandes redes corporativas como Petz e Cobasi).</p>
        
        <h2>📊 Tabela de Match</h2>
        <table>
            <thead>
                <tr>
                    <th>Score</th>
                    <th>Empresa</th>
                    <th>Nicho</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Persona</th>
                    <th>Tem RT?</th>
                    <th>Intenção</th>
                    <th>Dor/Oportunidade</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedLeads.forEach(l => {
        const stars = "★".repeat(l.score) + "☆".repeat(5 - l.score);
        const badgeClass = l.persona === 'Aika' ? 'badge aika' : 'badge kyenner';
        
        html += `
            <tr>
                <td class="score">${stars}</td>
                <td><b>${l.empresa}</b><br><small>${l.nomeContato}</small></td>
                <td>${l.nicho}</td>
                <td>${l.telefone || '<i>Sem Telefone</i>'}</td>
                <td>${l.email || '<i>Sem E-mail</i>'}</td>
                <td><span class="${badgeClass}">${l.persona}</span></td>
                <td><b>${l.temRT}</b></td>
                <td>${l.grauIntencao}</td>
                <td>${l.dorIdentificada}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        
        <h2>📞 Roteiros de Ligação Fria (Pitch Comercial por Lead)</h2>
        <p>Abaixo estão os scripts sugeridos de 1 a 3 frases para ligar para cada um dos estabelecimentos usando ganchos reais:</p>
    `;

    // Seção Kyenner
    html += `<h3>🏥 Kyenner (RT & Conformidade)</h3>`;
    const leadsKyenner = sortedLeads.filter(l => l.persona === 'Kyenner');
    if (leadsKyenner.length === 0) {
        html += `<p><i>Nenhum lead de RT na fila.</i></p>`;
    } else {
        leadsKyenner.forEach(l => {
            html += `
                <div style="margin-bottom: 15px;">
                    <b>${l.empresa}</b> (${l.nomeContato} - ${l.telefone}):
                    <div class="script-box">"${l.scriptLigacao}"</div>
                </div>
            `;
        });
    }

    // Seção Aika
    html += `<h3>🐾 Aika (Vet em Casa / Parcerias)</h3>`;
    const leadsAika = sortedLeads.filter(l => l.persona === 'Aika');
    if (leadsAika.length === 0) {
        html += `<p><i>Nenhum lead de Parceria na fila.</i></p>`;
    } else {
        leadsAika.forEach(l => {
            html += `
                <div style="margin-bottom: 15px;">
                    <b>${l.empresa}</b> (${l.nomeContato} - ${l.telefone}):
                    <div class="script-box">"${l.scriptLigacao}"</div>
                </div>
            `;
        });
    }

    html += `
        <br>
        <hr>
        <p><small>Este e-mail foi gerado automaticamente pelo Agente Lessie da Otimiza FarmaVet.</small></p>
    </body>
    </html>
    `;

    try {
        const auth = await getGoogleAuth();
        const gmail = google.gmail({ version: 'v1', auth });
        
        const raw = createMimeMessage(DESTINATARIO, `🕵️‍♂️ Relatório de Leads Lessie AI — Tabela de Match (FarmaVet)`, html);
        
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });

        console.log(`✅ Relatório enviado com sucesso para ${DESTINATARIO}!`);
    } catch (e) {
        console.error("❌ Falha ao enviar e-mail:", e.message);
        process.exit(1);
    }
}

run();
