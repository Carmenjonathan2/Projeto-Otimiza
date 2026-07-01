const fs = require('fs');
const path = require('path');

const SUGESTOES_FILE = path.resolve(__dirname, '../../sugestoes_bot.jsonl');
const FEW_SHOT_FILE = path.resolve(__dirname, './exemplos_aprovados.jsonl');

/**
 * Lê sugestões aprovadas e as exporta como exemplos few-shot.
 * Rodar diariamente ou sob demanda.
 */
function sincronizarAprovados() {
    if (!fs.existsSync(SUGESTOES_FILE)) {
        console.log('[APRENDIZADO] Nenhum arquivo de sugestões encontrado.');
        return 0;
    }

    const linhas = fs.readFileSync(SUGESTOES_FILE, 'utf8').split('\n').filter(Boolean);
    const aprovados = linhas.map(l => JSON.parse(l)).filter(r => r.aprovado_humano === true);

    let novos = 0;
    const existentes = fs.existsSync(FEW_SHOT_FILE)
        ? new Set(fs.readFileSync(FEW_SHOT_FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).id))
        : new Set();

    for (const registro of aprovados) {
        if (existentes.has(registro.id)) continue;
        const exemplo = {
            id: registro.id,
            persona: registro.persona,
            input: registro.mensagemCliente,
            output: registro.respostaSugerida,
            aprovado_em: new Date().toISOString()
        };
        fs.appendFileSync(FEW_SHOT_FILE, JSON.stringify(exemplo) + '\n', 'utf8');
        novos++;
    }

    console.log(`[APRENDIZADO] ${novos} novos exemplos adicionados ao few-shot.`);
    return novos;
}

module.exports = { sincronizarAprovados };
