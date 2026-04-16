const { google } = require('googleapis');
require('dotenv').config();

async function readLeads(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Página1!A2:I'; // Lemos até a Coluna I (Thread ID agora é I)

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        return rows.map((row, index) => {
            const razaoSocial = row[1] || '';
            const nomeFantasia = row[2] || '';
            const empresaAtiva = nomeFantasia.trim() !== '' ? nomeFantasia.trim() : razaoSocial.trim();

            return {
                rowIndex: index + 2,
                nome: row[0],
                empresa: empresaAtiva, // Usando fallback inteligente na raiz
                razaoOriginal: razaoSocial,
                endereco: row[3] || '', // Nova Coluna D (Endereço/Cidade)
                email: row[4],
                contexto: row[5],
                status: row[6] || 'Aguardando',
                dataEnvio: row[7] || '',
                messageId: row[8] || '' // Coluna I agora é MSG ID
            };
        });
    } catch (error) {
        console.error('Erro ao ler planilha:', error.message);
        return [];
    }
}

// Função robusta para atualizar múltiplos campos de uma vez
async function updateLead(auth, rowIndex, status, date, messageId = null) {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Atualiza Coluna G (Status), H (Data) e I (Message ID)
    const range = `Página1!G${rowIndex}:I${rowIndex}`;
    // Se messageId for nulo, mantemos o valor atual (ou passamos o que vier)
    const values = [[status, date, messageId]];

    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values },
        });
        console.log(`🔹 Lead [${rowIndex}] atualizado: ${status}`);
    } catch (error) {
        console.error('Erro ao atualizar lead:', error.message);
    }
}

module.exports = { readLeads, updateLead };
