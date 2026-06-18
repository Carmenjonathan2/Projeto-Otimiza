/**
 * [ig_002] Aika IG Bot — Servidor Webhook Unificado
 * Cobre dois canais do Instagram via um único servidor:
 *   1. comments → responde comentários públicos em posts
 *   2. messages → responde mensagens diretas (DMs)
 */

const express = require('express');
const crypto  = require('crypto');
const path    = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const { processarComentario } = require('./responder_comentarios');
const { processarDM }         = require('./responder_dm');

const app  = express();
const PORT = process.env.PORT || 3001;

const VERIFY_TOKEN = process.env.IG_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET   = process.env.IG_APP_SECRET;
const IG_USER_ID   = process.env.ID_Instagram;

if (!VERIFY_TOKEN || !APP_SECRET || !IG_USER_ID) {
    console.error('[ERRO] server.js — IG_WEBHOOK_VERIFY_TOKEN, IG_APP_SECRET ou ID_Instagram ausentes no .env');
    process.exit(1);
}

// Mantém o body raw para validar a assinatura HMAC
app.use(express.json({
    verify: (req, _res, buf) => { req.rawBody = buf; }
}));

// ─── GET /webhook — Verificação inicial da Meta ───────────────────────────────
app.get('/webhook', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[OK] server.js — Webhook verificado pela Meta com sucesso.');
        return res.status(200).send(challenge);
    }
    console.error('[ERRO] server.js — Token de verificação inválido. Acesso negado.');
    res.sendStatus(403);
});

// ─── POST /webhook — Recebe todos os eventos da Meta ─────────────────────────
app.post('/webhook', (req, res) => {
    // 1. Valida assinatura HMAC-SHA256 (segurança)
    const assinaturaRecebida = req.headers['x-hub-signature-256'] || '';
    const assinaturaEsperada = 'sha256=' + crypto
        .createHmac('sha256', APP_SECRET)
        .update(req.rawBody)
        .digest('hex');

    if (assinaturaRecebida !== assinaturaEsperada) {
        console.error('[ERRO] server.js — Assinatura HMAC inválida. Requisição rejeitada.');
        return res.sendStatus(403);
    }

    // 2. Responde 200 imediatamente (obrigatório pela Meta em <5s)
    res.sendStatus(200);

    const body = req.body;
    if (body.object !== 'instagram') return;

    for (const entrada of body.entry || []) {

        // ── Canal 1: COMENTÁRIOS em posts ────────────────────────────────────
        for (const mudanca of entrada.changes || []) {
            if (mudanca.field !== 'comments') continue;

            const dado = mudanca.value;
            if (dado.parent_id) continue; // ignora respostas (evita loop)

            processarComentario({
                comentarioId: dado.id,
                texto:        dado.text,
                usuarioId:    dado.from?.id,
                usuario:      dado.from?.username,
                midiaId:      dado.media?.id,
            }).catch(err => console.error('[ERRO] responder_comentarios.js —', err.message));
        }

        // ── Canal 2: DIRECT MESSAGES ─────────────────────────────────────────
        for (const evento of entrada.messaging || []) {
            // Ignora eco (mensagem enviada pela própria conta) e eventos sem texto
            if (evento.sender?.id === IG_USER_ID) continue;
            if (!evento.message?.text)             continue;
            if (evento.message?.is_echo)           continue;

            processarDM({
                remetenteId: evento.sender?.id,
                texto:       evento.message.text,
                messageId:   evento.message?.mid,
            }).catch(err => console.error('[ERRO] responder_dm.js —', err.message));
        }
    }
});

// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
    status:  'ok',
    servico: 'Aika IG Bot (Comentários + DMs)',
    uptime:  process.uptime()
}));

app.listen(PORT, () => {
    console.log(`[INICIO] server.js ${new Date().toISOString()} — Aika IG Bot escutando na porta ${PORT}`);
});
