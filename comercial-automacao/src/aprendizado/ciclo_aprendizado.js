'use strict';
const fs   = require('fs');
const path = require('path');

const ARQUIVO_JSONL   = path.resolve(__dirname, '../../sugestoes_bot.jsonl');
const ARQUIVO_FEWSHOT = path.resolve(__dirname, '../aprendizado/exemplos_aprovados.jsonl');

function promoverAprovados() {
    if (!fs.existsSync(ARQUIVO_JSONL)) {
        console.log('[CICLO] sugestoes_bot.jsonl não encontrado. Nada a promover.');
        return 0;
    }

    const linhas = fs.readFileSync(ARQUIVO_JSONL, 'utf8').split('\n').filter(Boolean);
    const aprovados = linhas
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(r => r && r.aprovado_humano === true);

    if (aprovados.length === 0) {
        console.log('[CICLO] Nenhum registro aprovado encontrado ainda.');
        return 0;
    }

    const fewShots = aprovados.map(r => ({
        input:  r.mensagemCliente,
        output: r.respostaSugerida,
        persona: r.persona,
        promovido_em: new Date().toISOString()
    }));

    fs.appendFileSync(
        ARQUIVO_FEWSHOT,
        fewShots.map(f => JSON.stringify(f)).join('\n') + '\n',
        'utf8'
    );

    console.log(`[CICLO] ${aprovados.length} exemplos promovidos para few-shots.`);
    return aprovados.length;
}

module.exports = { promoverAprovados };

// Execução direta: node ciclo_aprendizado.js
if (require.main === module) {
    promoverAprovados();
}
