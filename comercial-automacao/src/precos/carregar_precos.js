/**
 * Carregador de preços do Vet em Casa.
 *
 * Lê o arquivo JSON em runtime e gera strings prontas pra injetar no system
 * prompt e no `contextoInjetado` de vacinas B2C. Sem hardcode de preço no JS.
 *
 * Cache em memória com TTL de 5min — se o RT atualiza o JSON, o bot pega na
 * próxima janela sem precisar reiniciar.
 */

const fs = require('fs');
const path = require('path');

const ARQUIVO = path.resolve(__dirname, '../../diretrizes-e-branding/precos_vet_em_casa.json');
const TTL_MS = 5 * 60 * 1000; // 5 minutos

let cache = null;
let carregadoEm = 0;

function carregar() {
    if (cache && (Date.now() - carregadoEm) < TTL_MS) return cache;
    try {
        const conteudo = fs.readFileSync(ARQUIVO, 'utf8');
        cache = JSON.parse(conteudo);
        carregadoEm = Date.now();
        return cache;
    } catch (e) {
        console.error(`❌ [PRECOS] Falha ao ler ${ARQUIVO}: ${e.message}`);
        // Fallback hardcoded de segurança (apenas se arquivo sumir).
        return {
            vacinas: [
                { nome: 'Antirrábica', preco: 60 },
                { nome: 'V8/V9', preco: 70 },
                { nome: 'V10', preco: 80 },
                { nome: 'Gripe', preco: 90 },
                { nome: 'Giardia', preco: 97 }
            ],
            observacoes: ['Aplicação domiciliar inclusa.', 'Há taxa de deslocamento por CEP.'],
            pix: { chave: '(31) 98793-6822', banco: 'C6 Bank', titular: 'Solução Farmacêutica Otimiza' },
            cartao: { taxa_pct: 4.99 }
        };
    }
}

function tabelaVacinasTexto() {
    const d = carregar();
    return d.vacinas.map(v => `${v.nome} *R$${v.preco.toFixed(0)}*`).join(', ');
}

function pixTexto() {
    const d = carregar();
    return `*${d.pix.chave}* (${d.pix.banco})`;
}

function cartaoTaxaTexto() {
    const d = carregar();
    return `${d.cartao.taxa_pct.toFixed(2).replace('.', ',')}%`;
}

function obsTexto() {
    const d = carregar();
    return (d.observacoes || []).join(' ');
}

module.exports = {
    carregar,
    tabelaVacinasTexto,
    pixTexto,
    cartaoTaxaTexto,
    obsTexto
};
