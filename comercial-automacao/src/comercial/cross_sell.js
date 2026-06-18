/**
 * Cross-sell pós-compra B2C.
 *
 * Quando bot detecta compra confirmada (sinal `b2cCompraConfirmadaNestaMsg`),
 * busca regra em `cross_sell.json` que combine com o produto comprado e
 * devolve a oferta complementar pra injetar no system prompt.
 *
 * Cache TTL 5min — Carmen muda o JSON, próxima janela reflete.
 */

const fs = require('fs');
const path = require('path');

const ARQUIVO = path.resolve(__dirname, '../../diretrizes-e-branding/cross_sell.json');
const TTL_MS = 5 * 60 * 1000;

let cache = null;
let carregadoEm = 0;

function carregar() {
    if (cache && (Date.now() - carregadoEm) < TTL_MS) return cache;
    try {
        cache = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
        carregadoEm = Date.now();
        return cache;
    } catch (e) {
        console.error(`❌ [CROSS-SELL] Falha ao ler ${ARQUIVO}: ${e.message}`);
        return { regras: [] };
    }
}

function ofertaPara(nomeProduto) {
    if (!nomeProduto) return null;
    const dados = carregar();
    const nomeLower = nomeProduto.toLowerCase();
    for (const r of (dados.regras || [])) {
        if (r.match.some(m => nomeLower.includes(m))) return r.oferta;
    }
    return null;
}

module.exports = { ofertaPara };
