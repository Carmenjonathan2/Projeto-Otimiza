const { google } = require('googleapis');
const { getAuthClient } = require('./src/auth');

async function checkFollowUps() {
    try {
        const auth = await getAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });

        console.log("Procurando e-mails de Follow-up (Bump) enviados...");

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'in:sent "apenas subindo esse e-mail para o topo"', // Busca pelo texto do follow-up
            maxResults: 5
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) {
            console.log("\n❌ Nenhum e-mail de follow-up (Bump) foi encontrado na sua caixa de enviados.");
            return;
        }

        console.log(`\n✅ Foram encontrados ${messages.length} e-mails de follow-up recentes!\n`);

        for (const msg of messages) {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full'
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
        }
    } catch (error) {
        console.error("Erro ao buscar emails enviados:", error);
    }
}

checkFollowUps();
