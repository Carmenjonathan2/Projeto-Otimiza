/**
 * Sistema de follow-up automático.
 * Detecta leads frios/parados e gera sugestões de reengajamento via IA.
 * Uso: node crm/followup.js  (rode diariamente, ex: via cron ou .bat)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('./database');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DIAS_SEM_RESPOSTA_AVISO   = 3;
const DIAS_SEM_RESPOSTA_CRITICO = 7;

function diasDesde(dataStr) {
    if (!dataStr) return 999;
    const diff = Date.now() - new Date(dataStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function gerarMensagemFollowup(lead, interacoes) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return 'Configure ANTHROPIC_API_KEY para gerar mensagem de follow-up automaticamente.';
    }

    const ultimasMsgs = interacoes
        .slice(0, 5)
        .reverse()
        .map(i => `${i.quem}: ${i.mensagem || '(áudio)'}`)
        .join('\n');

    const prompt = `Você é copywriter especializado em vendas veterinárias B2B/B2C.
Crie UMA mensagem curta e natural de follow-up para WhatsApp.
Lead: ${lead.nome} | Dias sem resposta: ${diasDesde(lead.ultima_interacao)} | Contexto: ${lead.resumo_ia || 'sem histórico'}
Últimas mensagens:\n${ultimasMsgs || 'Nenhuma'}
Regras: tom amigável, máximo 3 linhas, sem emoji excessivo, ofereça ajuda genuína.
Responda APENAS com o texto da mensagem, sem aspas ou explicações.`;

    try {
        const res = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            messages: [{ role: 'user', content: prompt }]
        });
        return res.content[0].text.trim();
    } catch (err) {
        return `Olá ${lead.nome.split(' ')[0]}, tudo bem? Passando para ver se posso ajudar com algo.`;
    }
}

async function main() {
    const leads = db.listarLeads();
    const hoje = new Date().toLocaleDateString('pt-BR');

    const criticos = [];
    const avisos   = [];

    for (const lead of leads) {
        if (lead.etapa === 'fechado' || lead.etapa === 'perdido') continue;
        const dias = diasDesde(lead.ultima_interacao);
        if (dias >= DIAS_SEM_RESPOSTA_CRITICO) criticos.push({ lead, dias });
        else if (dias >= DIAS_SEM_RESPOSTA_AVISO) avisos.push({ lead, dias });
    }

    console.log(`\n📋 Relatório de Follow-up — ${hoje}`);
    console.log(`   Críticos (${DIAS_SEM_RESPOSTA_CRITICO}+ dias): ${criticos.length}`);
    console.log(`   Avisos (${DIAS_SEM_RESPOSTA_AVISO}+ dias): ${avisos.length}\n`);

    const todos = [
        ...criticos.map(x => ({ ...x, nivel: 'CRÍTICO' })),
        ...avisos.map(x => ({ ...x, nivel: 'AVISO' }))
    ];

    for (const { lead, dias, nivel } of todos) {
        const interacoes = db.buscarInteracoes(lead.id, 5);
        const mensagem = await gerarMensagemFollowup(lead, interacoes);

        console.log(`─────────────────────────────────────────`);
        console.log(`[${nivel}] ${lead.nome} — ${dias} dias sem resposta`);
        console.log(`Etapa: ${lead.etapa} | Temperatura: ${lead.temperatura}`);
        console.log(`Sugestão IA:\n"${mensagem}"`);

        // Atualiza temperatura para frio
        db.atualizarLeadIA(lead.id, {
            etapa: lead.etapa,
            temperatura: 'frio',
            proxima_acao: `Follow-up gerado em ${hoje}: "${mensagem.substring(0, 60)}..."`,
            resumo_ia: lead.resumo_ia
        });
    }

    if (todos.length === 0) {
        console.log('✅ Nenhum lead precisa de follow-up hoje. Base saudável!');
    } else {
        console.log(`\n─────────────────────────────────────────`);
        console.log(`\n✅ ${todos.length} sugestões geradas. Leads marcados como "frio" no CRM.\n`);
    }
}

main().catch(err => {
    console.error('[Follow-up] Erro:', err);
    process.exit(1);
});
