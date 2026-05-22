const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'crm_comercial.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT UNIQUE NOT NULL,
    chat_nome TEXT,
    etapa TEXT DEFAULT 'novo',
    temperatura TEXT DEFAULT 'morno',
    proxima_acao TEXT,
    resumo_ia TEXT,
    total_interacoes INTEGER DEFAULT 0,
    ultima_interacao DATETIME,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    timestamp DATETIME NOT NULL,
    quem TEXT NOT NULL,
    mensagem TEXT,
    tipo TEXT DEFAULT 'texto',
    audio_local TEXT,
    possivel_prazo TEXT,
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  );

  CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON interacoes(lead_id);
  CREATE INDEX IF NOT EXISTS idx_leads_telefone ON leads(telefone);
`);

// ── Leads ──────────────────────────────────────────────────────────────────

function upsertLead({ nome, telefone, chat_nome }) {
    const existente = db.prepare('SELECT id FROM leads WHERE telefone = ?').get(telefone);
    if (existente) return existente.id;

    const result = db.prepare(`
        INSERT INTO leads (nome, telefone, chat_nome, ultima_interacao)
        VALUES (?, ?, ?, datetime('now'))
    `).run(nome, telefone, chat_nome || null);

    return result.lastInsertRowid;
}

function atualizarLeadIA(leadId, { etapa, temperatura, proxima_acao, resumo_ia }) {
    db.prepare(`
        UPDATE leads SET etapa = ?, temperatura = ?, proxima_acao = ?, resumo_ia = ?,
        ultima_interacao = datetime('now')
        WHERE id = ?
    `).run(etapa, temperatura, proxima_acao, resumo_ia, leadId);
}

function incrementarInteracoes(leadId) {
    db.prepare(`
        UPDATE leads SET total_interacoes = total_interacoes + 1,
        ultima_interacao = datetime('now')
        WHERE id = ?
    `).run(leadId);
}

function listarLeads(etapa = null) {
    if (etapa) {
        return db.prepare('SELECT * FROM leads WHERE etapa = ? ORDER BY ultima_interacao DESC').all(etapa);
    }
    return db.prepare('SELECT * FROM leads ORDER BY ultima_interacao DESC').all();
}

function buscarLead(id) {
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
}

function atualizarEtapaManual(id, etapa) {
    db.prepare('UPDATE leads SET etapa = ? WHERE id = ?').run(etapa, id);
}

// ── Interações ─────────────────────────────────────────────────────────────

function salvarInteracao({ lead_id, timestamp, quem, mensagem, tipo, audio_local, possivel_prazo }) {
    db.prepare(`
        INSERT INTO interacoes (lead_id, timestamp, quem, mensagem, tipo, audio_local, possivel_prazo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(lead_id, timestamp, quem, mensagem || null, tipo || 'texto', audio_local || null, possivel_prazo || null);
}

function buscarInteracoes(leadId, limite = 20) {
    return db.prepare(`
        SELECT * FROM interacoes WHERE lead_id = ? ORDER BY timestamp DESC LIMIT ?
    `).all(leadId, limite);
}

// ── Resumo do Kanban ───────────────────────────────────────────────────────

function resumoKanban() {
    return db.prepare(`
        SELECT etapa, COUNT(*) as total, temperatura
        FROM leads GROUP BY etapa, temperatura ORDER BY etapa
    `).all();
}

module.exports = {
    upsertLead, atualizarLeadIA, incrementarInteracoes,
    listarLeads, buscarLead, atualizarEtapaManual,
    salvarInteracao, buscarInteracoes, resumoKanban
};
