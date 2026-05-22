/**
 * Migra dados existentes para o banco CRM.
 * Fontes: historico_comercial.json e b2b_contatados.json
 * Uso: node crm/migrador.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const db = require('./database');
const { classificarLead } = require('./classificador');

const HISTORICO_PATH   = path.join(__dirname, '..', 'historico_comercial.json');
const B2B_PATH         = path.join(__dirname, '..', 'b2b_contatados.json');

let totalLeads = 0;
let totalInteracoes = 0;

// ── 1. Importa histórico do monitor_comercial ──────────────────────────────
function importarHistorico() {
    if (!fs.existsSync(HISTORICO_PATH)) {
        console.log('[Migrador] historico_comercial.json não encontrado, pulando.');
        return;
    }

    let historico = [];
    try {
        historico = JSON.parse(fs.readFileSync(HISTORICO_PATH, 'utf8'));
    } catch (e) {
        console.error('[Migrador] Erro ao ler historico_comercial.json:', e.message);
        return;
    }

    console.log(`[Migrador] Processando ${historico.length} eventos do histórico comercial...`);

    const grupos = {};
    for (const evento of historico) {
        if (!evento.telefone) continue;
        if (!grupos[evento.telefone]) grupos[evento.telefone] = [];
        grupos[evento.telefone].push(evento);
    }

    for (const [telefone, eventos] of Object.entries(grupos)) {
        const primeiro = eventos[0];
        const nome = primeiro.quem === 'COMERCIAL'
            ? (eventos.find(e => e.quem !== 'COMERCIAL')?.quem || telefone)
            : primeiro.quem;

        const leadId = db.upsertLead({
            nome,
            telefone,
            chat_nome: primeiro.chat_nome || null
        });

        for (const ev of eventos) {
            db.salvarInteracao({
                lead_id: leadId,
                timestamp: ev.timestamp,
                quem: ev.quem,
                mensagem: ev.mensagem !== '[ MENSAGEM DE ÁUDIO ]' ? ev.mensagem : null,
                tipo: ev.audio_local ? 'audio' : 'texto',
                audio_local: ev.audio_local || null,
                possivel_prazo: ev.possivel_prazo || null
            });
            db.incrementarInteracoes(leadId);
            totalInteracoes++;
        }
        totalLeads++;
    }

    console.log(`[Migrador] ✅ Histórico: ${totalLeads} leads, ${totalInteracoes} interações importados.`);
}

// ── 2. Importa leads B2B contatados ───────────────────────────────────────
function importarB2B() {
    if (!fs.existsSync(B2B_PATH)) {
        console.log('[Migrador] b2b_contatados.json não encontrado, pulando.');
        return;
    }

    let contatados = [];
    try {
        contatados = JSON.parse(fs.readFileSync(B2B_PATH, 'utf8'));
    } catch (e) {
        console.error('[Migrador] Erro ao ler b2b_contatados.json:', e.message);
        return;
    }

    console.log(`[Migrador] Processando ${contatados.length} leads B2B...`);
    let novosB2B = 0;

    for (const contato of contatados) {
        const telefone = contato.telLimpo || contato.telOriginal;
        if (!telefone) continue;

        const leadId = db.upsertLead({
            nome: contato.nome || telefone,
            telefone,
            chat_nome: 'B2B Condomínios'
        });

        db.salvarInteracao({
            lead_id: leadId,
            timestamp: contato.data || new Date().toISOString(),
            quem: 'COMERCIAL',
            mensagem: 'Quebra-Gelo B2B Enviado (campanha condomínios)',
            tipo: 'texto',
            audio_local: null,
            possivel_prazo: null
        });
        db.incrementarInteracoes(leadId);
        novosB2B++;
    }

    console.log(`[Migrador] ✅ B2B: ${novosB2B} leads contatados importados.`);
}

// ── 3. Classifica todos os leads com IA ───────────────────────────────────
async function classificarTodos() {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('[Migrador] ANTHROPIC_API_KEY não configurada — classificação IA pulada.');
        return;
    }

    const leads = db.listarLeads();
    console.log(`[Migrador] Classificando ${leads.length} leads com IA (pode demorar alguns minutos)...`);

    for (const lead of leads) {
        const interacoes = db.buscarInteracoes(lead.id, 15);
        const classificacao = await classificarLead(interacoes, lead.nome);
        db.atualizarLeadIA(lead.id, classificacao);
        process.stdout.write('.');
    }
    console.log('\n[Migrador] ✅ Classificação IA concluída.');
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🔄 Iniciando migração para o CRM...\n');
    importarHistorico();
    importarB2B();
    await classificarTodos();
    console.log('\n✅ Migração completa! Inicie o servidor: node crm/server.js\n');
}

main().catch(err => {
    console.error('[Migrador] Erro fatal:', err);
    process.exit(1);
});
