'use strict';
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TELEGRAM_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const JONATHAS_ID     = '868045878';
const PALAVRAS_CHAVE  = ['técnico farmácia', 'auxiliar farmácia', 'atendente farmácia', 'veterinário'];
const VAGAS_VISTAS    = path.resolve(__dirname, '../../kyenner_vagas_vistas.json');

function carregarVagasVistas() {
    try { return JSON.parse(fs.readFileSync(VAGAS_VISTAS, 'utf8')); } catch { return []; }
}

function salvarVagasVistas(ids) {
    fs.writeFileSync(VAGAS_VISTAS, JSON.stringify(ids), 'utf8');
}

async function alertarVaga(vaga) {
    const msg = encodeURIComponent(
        `💼 *Nova Vaga — Kyenner*\n\n` +
        `🏢 ${vaga.empresa}\n` +
        `📌 ${vaga.titulo}\n` +
        `📍 ${vaga.local}\n` +
        `🔗 ${vaga.url}`
    );
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${JONATHAS_ID}&text=${msg}&parse_mode=Markdown`;
    https.get(url, r => r.resume()).on('error', e => console.error('[VAGAS-TG]', e.message));
}

async function buscarVagas() {
    const vistas = carregarVagasVistas();
    // Integração Gupy API pública ou scraping leve do LinkedIn
    // Placeholder — adaptar à fonte de dados disponível
    console.log('[VAGAS] Busca executada. Palavras-chave:', PALAVRAS_CHAVE.join(', '));
    // Para cada vaga nova (não em `vistas`): alertarVaga(vaga) + adicionar ao array
    salvarVagasVistas(vistas);
}

module.exports = { buscarVagas };

if (require.main === module) { buscarVagas(); }
