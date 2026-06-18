/**
 * [ig_002] Aika IG Bot — Responder de Comentários
 * Lê o comentário, gera resposta com Gemini usando a personalidade
 * definida em personalidade_aika.json e publica via Instagram Graph API.
 */

const axios = require('axios');
const path  = require('path');
const fs    = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// Carrega personalidade da Aika do arquivo de configuração externo
const PERSONALIDADE = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './personalidade_aika.json'), 'utf-8')
);

const TOKEN        = process.env.TOKEN;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const IG_USER_ID   = process.env.ID_Instagram;

if (!TOKEN || !GEMINI_KEY || !IG_USER_ID) {
    console.error('[ERRO] responder_comentarios.js — TOKEN, GEMINI_API_KEY ou ID_Instagram ausentes no .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.3,
        topP: 0.8
    }
});

// Hook de monitoramento de custo (opcional)
let custoMonitor = null;
try {
    custoMonitor = require('../../../observabilidade/custo_monitor');
} catch (e) { /* monitor opcional */ }

function buildPromptComentario() {
    const p = PERSONALIDADE;
    const situacoes = Object.entries(p.situacoes)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');
    const proibicoes = p.proibicoes.map(r => `- NUNCA: ${r}`).join('\n');

    return `
Você é ${p.identidade.nome}, ${p.identidade.papel}.
Está respondendo a um comentário PÚBLICO em um post do Instagram.

SEU TOM DE VOZ:
${p.tom_de_voz.estilo}
${p.tom_de_voz.vocabulario}
Emojis: ${p.tom_de_voz.emojis}

COMO AGIR EM CADA SITUAÇÃO:
${situacoes}

FECHAMENTO PADRÃO (quando fizer sentido): "${p.fechamento_comentario}"

REGRAS ABSOLUTAS:
${proibicoes}
- Máximo de ${p.limites_de_caracteres.comentario} caracteres (limite do Instagram para comentários)
- Responda APENAS com o texto da resposta. Sem aspas, sem explicações, sem prefixos.
`.trim();
}

async function gerarResposta(textoComentario, nomeUsuario) {
    const prompt = `${buildPromptComentario()}\n\nComentário de @${nomeUsuario || 'cliente'}: "${textoComentario}"\n\nSua resposta:`;

    const resultado = await model.generateContent(prompt);
    const resposta  = resultado.response.text().trim();

    // Registrar custo (se monitor disponível)
    if (custoMonitor && resultado.response.usageMetadata) {
        const u = resultado.response.usageMetadata;
        custoMonitor.registrarChamada({
            promptTokens: u.promptTokenCount || 0,
            candidateTokens: u.candidatesTokenCount || 0,
            cachedTokens: u.cachedContentTokenCount || 0,
            model: 'gemini-2.5-flash-lite',
            persona: 'Aika-Comentario'
        });
    }

    const limite = PERSONALIDADE.limites_de_caracteres.comentario;
    return resposta.length > limite ? resposta.substring(0, limite - 3) + '...' : resposta;
}

async function publicarResposta(comentarioId, texto) {
    const url = `https://graph.instagram.com/v19.0/${comentarioId}/replies`;
    await axios.post(url, null, {
        params: {
            message:      texto,
            access_token: TOKEN
        }
    });
}

async function processarComentario({ comentarioId, texto, usuarioId, usuario, midiaId }) {
    if (!texto || !comentarioId) return;

    // Ignora comentários da própria conta (evita loop)
    if (usuarioId === IG_USER_ID) {
        console.log(`[OK] responder_comentarios.js — Ignorado: comentário da própria conta na mídia ${midiaId}`);
        return;
    }

    console.log(`[INICIO] responder_comentarios.js ${new Date().toISOString()} — Novo comentário de @${usuario}: "${texto}"`);

    const resposta = await gerarResposta(texto, usuario);
    await publicarResposta(comentarioId, resposta);

    console.log(`[OK] responder_comentarios.js ${new Date().toISOString()} — Respondido @${usuario}: "${resposta}"`);
}

module.exports = { processarComentario };

// Self-test: rodar `node responder_comentarios.js --self-test`
if (require.main === module && process.argv.includes('--self-test')) {
    (async () => {
        try {
            console.log('[SELF-TEST] responder_comentarios.js — chamando Gemini com comentário fixo...');
            const resposta = await gerarResposta('Que linda a Aika!', 'selftest_user');
            console.log(`[SELF-TEST OK] Resposta: "${resposta}"`);
            process.exit(0);
        } catch (e) {
            console.error(`[SELF-TEST FAIL] ${e.message}`);
            process.exit(1);
        }
    })();
}
