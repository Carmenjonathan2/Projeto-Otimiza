const { getAuthClient } = require('./src/auth');
const { readLeads, updateLead } = require('./src/sheets');
const { validateEmail } = require('./src/validator');
require('dotenv').config();

async function runValidation() {
    try {
        console.log("🔍 Iniciando Validação Técnica de Leads...");
        const auth = await getAuthClient();
        const leads = await readLeads(auth);

        if (leads.length === 0) {
            console.log("Nenhum lead para validar.");
            return;
        }

        let invalidCount = 0;
        let validCount = 0;

        for (const lead of leads) {
            // Só valida leads que ainda não foram enviados ou marcados como inválidos
            if (lead.status === 'Aguardando' || lead.status === '' || lead.status === 'Válido') {
                process.stdout.write(`Validando: ${lead.email} ... `);

                const result = await validateEmail(lead.email);

                if (!result.valid) {
                    console.log(`❌ Inválido (${result.reason})`);
                    await updateLead(auth, lead.rowIndex, `Inválido: ${result.reason}`, '---');
                    invalidCount++;
                } else {
                    console.log(`✅ OK`);
                    // Opcionalmente marcar como "Válido" para saber que já passou pelo filtro
                    await updateLead(auth, lead.rowIndex, 'Aguardando', lead.dataEnvio);
                    validCount++;
                }
            }
        }

        console.log("\n--- Resumo da Validação ---");
        console.log(`✅ Leads Válidos: ${validCount}`);
        console.log(`❌ Leads Inválidos: ${invalidCount}`);
        console.log("---------------------------\n");

    } catch (error) {
        console.error("Erro durante a validação:", error);
    }
}

runValidation();
