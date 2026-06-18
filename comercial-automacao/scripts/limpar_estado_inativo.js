const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log(`[INICIO] limpar_estado_inativo.js ${new Date().toISOString()}`);

const stateFile = path.resolve(__dirname, '../conversas_state.json');

if (!fs.existsSync(stateFile)) {
    console.warn(`⚠️ [LIMPAR ESTADO] Arquivo conversas_state.json não encontrado.`);
    console.log(`[OK] limpar_estado_inativo.js ${new Date().toISOString()} Resumo: Arquivo inexistente.`);
    process.exit(0);
}

try {
    const statsBefore = fs.statSync(stateFile);
    const sizeBeforeBytes = statsBefore.size;

    const fileContent = fs.readFileSync(stateFile, 'utf8');
    const states = JSON.parse(fileContent);

    const ttlDias = parseInt(process.env.ESTADO_TTL_DIAS || '60');
    const limiteMs = Date.now() - ttlDias * 24 * 60 * 60 * 1000;

    // Criar backup
    const hojeStr = new Date().toISOString().split('T')[0];
    const backupFile = path.resolve(__dirname, `../conversas_state_backup_${hojeStr}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(states, null, 4), 'utf8');
    console.log(`💾 Backup de segurança criado em: ${backupFile}`);

    let mantidos = 0;
    let removidos = 0;
    const novosStates = {};

    for (const phone of Object.keys(states)) {
        const entry = states[phone];
        
        // Se a entrada não tem ultima_atividade, consideramos ativa agora para não deletar preventivamente
        if (!entry.ultima_atividade) {
            novosStates[phone] = entry;
            mantidos++;
            continue;
        }

        const tAtividade = new Date(entry.ultima_atividade).getTime();
        if (tAtividade >= limiteMs) {
            novosStates[phone] = entry;
            mantidos++;
        } else {
            removidos++;
        }
    }

    // Salvar de volta
    fs.writeFileSync(stateFile, JSON.stringify(novosStates, null, 4), 'utf8');
    
    const statsAfter = fs.statSync(stateFile);
    const sizeAfterBytes = statsAfter.size;

    console.log(`🧹 Limpeza concluída:`);
    console.log(`   • Registros Removidos: ${removidos}`);
    console.log(`   • Registros Mantidos:  ${mantidos}`);
    console.log(`   • Tamanho Antes:       ${(sizeBeforeBytes / 1024).toFixed(2)} KB`);
    console.log(`   • Tamanho Depois:      ${(sizeAfterBytes / 1024).toFixed(2)} KB`);

    console.log(`[OK] limpar_estado_inativo.js ${new Date().toISOString()} Resumo: Limpeza de estados inativos concluída. Removidos: ${removidos}, Mantidos: ${mantidos}.`);
} catch (err) {
    console.error(`[ERRO] limpar_estado_inativo.js ${err.message}`);
    process.exit(1);
}
