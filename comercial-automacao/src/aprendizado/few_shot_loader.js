/**
 * Carregador de Few-Shot Dinâmico.
 *
 * Lê `few_shot_aprovados.json` (aprovados manualmente pela Carmen no painel
 * /saude) e gera string pra injetar no system instruction da próxima conversa.
 *
 * Cache TTL 5min — aprovação no painel reflete na próxima janela sem restart.
 *
 * Formato do arquivo:
 * {
 *   "aprovados": [
 *     {
 *       "id": "phone_timestamp",
 *       "persona": "Aika",
 *       "clientMessage": "...",
 *       "respostaCerta": "...",
 *       "aprovadoEm": "2026-06-17T..."
 *     }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

const ARQUIVO = path.resolve(__dirname, '../../few_shot_aprovados.json');
const FEW_SHOT_JSONL_FILE = path.resolve(__dirname, './exemplos_aprovados.jsonl');
const TTL_MS = 5 * 60 * 1000;
const MAX_EXEMPLOS_POR_PERSONA = 5;

let cache = null;
let carregadoEm = 0;

function carregar() {
    if (cache && (Date.now() - carregadoEm) < TTL_MS) return cache;
    try {
        let aprovadosList = [];

        // 1. Carregar do JSON antigo
        if (fs.existsSync(ARQUIVO)) {
            const jsonContent = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
            if (Array.isArray(jsonContent.aprovados)) {
                aprovadosList = jsonContent.aprovados.map(a => ({
                    id: a.id,
                    persona: a.persona,
                    clientMessage: a.clientMessage,
                    respostaCerta: a.respostaCerta || a.respostaSugerida
                }));
            }
        }

        // 2. Carregar do JSONL novo (exemplos_aprovados.jsonl)
        if (fs.existsSync(FEW_SHOT_JSONL_FILE)) {
            const lines = fs.readFileSync(FEW_SHOT_JSONL_FILE, 'utf8').split('\n').filter(Boolean);
            lines.forEach(l => {
                try {
                    const item = JSON.parse(l);
                    aprovadosList.push({
                        id: item.id,
                        persona: item.persona,
                        clientMessage: item.input,
                        respostaCerta: item.output
                    });
                } catch (jsonlErr) {
                    console.warn(`⚠️ [FEW-SHOT] Falha ao ler linha do JSONL:`, jsonlErr.message);
                }
            });
        }

        cache = { aprovados: aprovadosList };
        carregadoEm = Date.now();
        return cache;
    } catch (e) {
        console.error(`❌ [FEW-SHOT] Falha ao ler exemplos: ${e.message}`);
        return { aprovados: [] };
    }
}

function textoFewShot(persona) {
    const dados = carregar();
    const filtrados = (dados.aprovados || [])
        .filter(a => a.persona === persona)
        .slice(-MAX_EXEMPLOS_POR_PERSONA);

    if (filtrados.length === 0) return "";

    const exemplos = filtrados.map(a =>
        `Cliente: "${a.clientMessage}"\nResposta certa: "${a.respostaCerta}"`
    ).join('\n\n');

    return `\n\n[EXEMPLOS APROVADOS PELA EQUIPE — IMITAR O ESTILO]:\n${exemplos}`;
}

function aprovarPar(par) {
    let dados = { aprovados: [] };
    if (fs.existsSync(ARQUIVO)) {
        try {
            dados = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
            if (!Array.isArray(dados.aprovados)) dados.aprovados = [];
        } catch (_) { dados = { aprovados: [] }; }
    }

    // Deduplicar por id
    if (dados.aprovados.some(a => a.id === par.id)) {
        return { ok: false, motivo: 'já aprovado' };
    }

    dados.aprovados.push({
        id: par.id,
        persona: par.persona,
        clientMessage: par.clientMessage,
        respostaCerta: par.respostaCerta,
        aprovadoEm: new Date().toISOString()
    });

    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2), 'utf8');
    cache = null; // força reload
    return { ok: true, total: dados.aprovados.length };
}

module.exports = {
    carregar,
    textoFewShot,
    aprovarPar
};
