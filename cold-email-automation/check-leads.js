const { getAuthClient } = require('./src/auth');
const { readLeads } = require('./src/sheets');

async function main() {
    const auth = await getAuthClient();
    const leads = await readLeads(auth);
    const waiting = leads.filter(l => l.status === 'Aguardando' || l.status === '');
    const sentToday = leads.filter(l => l.dataEnvio === '31/03/2026');
    
    console.log('--- Relatório de Planilha ---');
    console.log(`Total de Leads: ${leads.length}`);
    console.log(`Leads em Fila (Aguardando): ${waiting.length}`);
    console.log(`Leads Enviados HOJE: ${sentToday.length}`);
}

main();
