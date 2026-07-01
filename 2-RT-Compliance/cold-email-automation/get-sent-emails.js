const { google } = require('googleapis');
const { getAuthClient } = require('./src/auth');

async function fetchSentEmails() {
    try {
        const auth = await getAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });

        // Buscando envios recentes com os novos assuntos (Teste A/B)
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'in:sent (subject:"sobre a" OR subject:"dúvida rápida")',
            maxResults: 15
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) {
            console.log("Nenhum email enviado encontrado.");
            return;
        }

        console.log(`\n=== ÚLTIMOS ${messages.length} EMAILS ENVIADOS ===\n`);

        for (const msg of messages) {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full' // pegamos o formato full para ver o snippet/corpo
            });
            
            const payload = detail.data.payload;
            const headers = payload.headers;
            
            const toHeader = headers.find(h => h.name === 'To')?.value || 'Sem Destinatário';
            const subjectHeader = headers.find(h => h.name === 'Subject')?.value || 'Sem Assunto';
            const dateHeader = headers.find(h => h.name === 'Date')?.value || '';

            console.log(`-------------------------------------------------`);
            console.log(`Para: ${toHeader}`);
            console.log(`Assunto: ${subjectHeader}`);
            console.log(`Data: ${dateHeader}`);
            console.log(`\nSnippet do Corpo:\n${detail.data.snippet}\n`);
            
            // Tentando extrair o body text/plain se disponível para ver o icebreaker completo:
            let bodyData = '';
            if (payload.parts) {
                const part = payload.parts.find(p => p.mimeType === 'text/plain');
                if (part && part.body && part.body.data) {
                    bodyData = Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
            } else if (payload.body && payload.body.data) {
                bodyData = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            }
            
            if (bodyData) {
               // Pega só os primeiros 2-3 parágrafos para ver o Icebreaker gerado:
               const linhas = bodyData.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
               console.log(`[ICEBREAKER EXTRACTED]:\n${linhas.join('\n')}\n`);
            }
        }
    } catch (error) {
        console.error("Erro ao buscar emails enviados:", error);
    }
}

fetchSentEmails();
