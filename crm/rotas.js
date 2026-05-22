const express = require('express');
const router = express.Router();
const db = require('./database');
const { classificarLead } = require('./classificador');

// ── GET /api/leads ─────────────────────────────────────────────────────────
router.get('/leads', (req, res) => {
    const { etapa } = req.query;
    const leads = db.listarLeads(etapa || null);
    res.json({ ok: true, leads });
});

// ── GET /api/leads/:id ─────────────────────────────────────────────────────
router.get('/leads/:id', (req, res) => {
    const lead = db.buscarLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ ok: false, erro: 'Lead não encontrado' });

    const interacoes = db.buscarInteracoes(lead.id, 30);
    res.json({ ok: true, lead, interacoes });
});

// ── PATCH /api/leads/:id/etapa ─────────────────────────────────────────────
router.patch('/leads/:id/etapa', (req, res) => {
    const { etapa } = req.body;
    const etapasValidas = ['novo', 'interessado', 'negociacao', 'fechado', 'perdido'];
    if (!etapasValidas.includes(etapa)) {
        return res.status(400).json({ ok: false, erro: 'Etapa inválida' });
    }
    db.atualizarEtapaManual(Number(req.params.id), etapa);

    const io = req.app.get('io');
    if (io) io.emit('lead:etapa_atualizada', { id: Number(req.params.id), etapa });

    res.json({ ok: true });
});

// ── GET /api/kanban ────────────────────────────────────────────────────────
router.get('/kanban', (req, res) => {
    const resumo = db.resumoKanban();
    const leads = db.listarLeads();

    const colunas = {
        novo: [], interessado: [], negociacao: [], fechado: [], perdido: []
    };
    leads.forEach(l => {
        if (colunas[l.etapa]) colunas[l.etapa].push(l);
    });

    res.json({ ok: true, colunas, resumo });
});

// ── POST /api/evento ───────────────────────────────────────────────────────
// Recebe eventos do monitor_comercial.js em tempo real
router.post('/evento', async (req, res) => {
    const evento = req.body;

    if (!evento || !evento.telefone) {
        return res.status(400).json({ ok: false, erro: 'Evento inválido — telefone obrigatório' });
    }

    try {
        // 1. Upsert do lead
        const leadId = db.upsertLead({
            nome: evento.quem || evento.telefone,
            telefone: evento.telefone,
            chat_nome: evento.chat_nome || null
        });

        // 2. Salva a interação
        db.salvarInteracao({
            lead_id: leadId,
            timestamp: evento.timestamp || new Date().toISOString(),
            quem: evento.quem || evento.telefone,
            mensagem: evento.mensagem || null,
            tipo: evento.audio_local ? 'audio' : 'texto',
            audio_local: evento.audio_local || null,
            possivel_prazo: evento.possivel_prazo || null
        });
        db.incrementarInteracoes(leadId);

        // 3. Classifica com IA (assíncrono, não bloqueia o retorno)
        const interacoes = db.buscarInteracoes(leadId, 15);
        const lead = db.buscarLead(leadId);

        classificarLead(interacoes, lead.nome).then(classificacao => {
            db.atualizarLeadIA(leadId, classificacao);

            const io = req.app.get('io');
            if (io) {
                io.emit('lead:atualizado', {
                    id: leadId,
                    nome: lead.nome,
                    telefone: lead.telefone,
                    ...classificacao
                });
            }

            console.log(`[CRM] Lead "${lead.nome}" → etapa: ${classificacao.etapa} | temp: ${classificacao.temperatura}`);
        }).catch(err => console.error('[CRM] Erro ao classificar:', err.message));

        // Retorna imediatamente, IA processa em background
        res.json({ ok: true, lead_id: leadId });

    } catch (err) {
        console.error('[CRM] Erro ao processar evento:', err.message);
        res.status(500).json({ ok: false, erro: err.message });
    }
});

// ── GET /api/status ────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
    const leads = db.listarLeads();
    res.json({
        ok: true,
        total_leads: leads.length,
        ia_ativa: !!process.env.ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
