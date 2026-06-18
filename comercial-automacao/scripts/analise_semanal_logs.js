const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

console.log(`[INICIO] analise_semanal_logs.js ${new Date().toISOString()}`);

// Configuração do Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ [ERRO] GEMINI_API_KEY não configurada no ambiente.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// Paths
const logFilePath = path.resolve(__dirname, '../conversas_log.jsonl');
const relatoriosDir = path.resolve(__dirname, '../relatorios');

// Garante pasta de relatórios
if (!fs.existsSync(relatoriosDir)) {
    fs.mkdirSync(relatoriosDir, { recursive: true });
}

// Config Chatwoot
const CHATWOOT_URL = process.env.CHATWOOT_API_URL || "https://hub.chatwoot.app.br";
const CHATWOOT_KEY = process.env.CHATWOOT_API_KEY;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const INBOX_ID = process.env.CHATWOOT_INBOX_ID;

const headers = {
    'api_access_token': CHATWOOT_KEY,
    'Content-Type': 'application/json'
};

/**
 * Busca histórico do Chatwoot se disponível para pegar as respostas humanas
 */
async function getChatwootMessages(phone) {
    if (!CHATWOOT_KEY || CHATWOOT_KEY === "MOCK_KEY" || !ACCOUNT_ID) {
        return [];
    }
    try {
        // 1. Buscar contato pelo telefone
        const searchRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/search?q=${phone}`, { headers });
        if (!searchRes.data || !searchRes.data.payload || searchRes.data.payload.length === 0) {
            return [];
        }
        const contactId = searchRes.data.payload[0].id;
        
        // 2. Buscar conversas
        const convsRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`, { headers });
        if (!convsRes.data || !convsRes.data.payload || convsRes.data.payload.length === 0) {
            return [];
        }
        
        // 3. Pegar mensagens
        const conversationId = convsRes.data.payload[0].id;
        const msgRes = await axios.get(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, { headers });
        if (msgRes.data && msgRes.data.payload) {
            return msgRes.data.payload;
        }
        return [];
    } catch (e) {
        // Silenciar erro do chatwoot para rodar offline/mocked de forma transparente
        return [];
    }
}

async function rodar() {
    if (!fs.existsSync(logFilePath)) {
        console.warn(`⚠️ [ANALISE SEMANAL] Arquivo de log não localizado em: ${logFilePath}`);
        console.log(`[OK] analise_semanal_logs.js ${new Date().toISOString()} Resumo: Arquivo de log vazio.`);
        process.exit(0);
    }

    const fileContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(Boolean);
    
    const now = Date.now();
    const last7DaysLimit = now - 7 * 24 * 60 * 60 * 1000;
    
    const logsFiltrados = [];
    
    for (const line of lines) {
        try {
            const entry = JSON.parse(line);
            const t = new Date(entry.timestamp).getTime();
            if (t >= last7DaysLimit) {
                logsFiltrados.push(entry);
            }
        } catch (e) {
            // Ignorar erro de parsing
        }
    }

    if (logsFiltrados.length === 0) {
        console.warn("⚠️ [ANALISE SEMANAL] Nenhuma conversa encontrada nos últimos 7 dias.");
        console.log(`[OK] analise_semanal_logs.js ${new Date().toISOString()} Resumo: Sem dados recentes.`);
        process.exit(0);
    }

    // Agrupar por phone + data YYYY-MM-DD
    const sessoesMap = new Map();
    
    for (const log of logsFiltrados) {
        const dateStr = log.timestamp.split('T')[0];
        const sessionKey = `${log.phone}_${dateStr}`;
        
        if (!sessoesMap.has(sessionKey)) {
            sessoesMap.set(sessionKey, {
                phone: log.phone,
                clientName: log.clientName || 'Cliente',
                date: dateStr,
                logs: [],
                hasTransbordo: false
            });
        }
        
        const sessao = sessoesMap.get(sessionKey);
        sessao.logs.push(log);
        
        // Determinar transbordo via responseText indicando transferência
        const textLower = (log.responseText || '').toLowerCase();
        if (textLower.includes('transferir') || textLower.includes('transferindo') || textLower.includes('suporte manual') || log.owner === 'human') {
            sessao.hasTransbordo = true;
        }
    }

    const sessoes = Array.from(sessoesMap.values());
    
    // Priorizar: 1. Transbordo; 2. Tamanho da sessão (mais mensagens)
    sessoes.sort((a, b) => {
        if (a.hasTransbordo && !b.hasTransbordo) return -1;
        if (!a.hasTransbordo && b.hasTransbordo) return 1;
        return b.logs.length - a.logs.length;
    });

    // Filtrar sessões curtas/irrelevantes (menos de 2 interações, exceto se houver transbordo)
    const sessoesFiltradas = sessoes.filter(s => s.hasTransbordo || s.logs.length >= 2);

    // Limitar a no máximo 50 sessões
    const sessoesParaAnalisar = sessoesFiltradas.slice(0, 50);
    console.log(`[ANALISE SEMANAL] Total de sessões encontradas: ${sessoes.length} (filtradas para ${sessoesFiltradas.length}). Analisando as ${sessoesParaAnalisar.length} prioritárias.`);

    const resultadosAnalise = [];
    const custoMonitor = require('../src/observabilidade/custo_monitor');

    for (let i = 0; i < sessoesParaAnalisar.length; i++) {
        const sessao = sessoesParaAnalisar[i];
        console.log(`[ANALISE SEMANAL] Analisando sessão ${i + 1}/${sessoesParaAnalisar.length} (+${sessao.phone} - ${sessao.clientName})`);
        
        // Montar histórico local do log
        let historicoTexto = "";
        sessao.logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        for (const log of sessao.logs) {
            historicoTexto += `Cliente: "${log.clientMessage}"\n`;
            if (log.error) {
                historicoTexto += `IA (ERRO): "${log.error}"\n`;
            } else {
                historicoTexto += `IA (${log.persona}): "${log.responseText}"\n`;
            }
        }
        
        // Tentar obter histórico do Chatwoot para mensagens do humano
        const cwMessages = await getChatwootMessages(sessao.phone);
        if (cwMessages.length > 0) {
            // Filtrar mensagens do humano da data correspondente
            const dataFoco = sessao.date;
            const msgHumano = cwMessages.filter(m => {
                const isHumanOut = m.message_type === 1 && !m.private; // outbound non-private (operator reply)
                let isSameDate = false;
                if (m.created_at) {
                    try {
                        let msgDateStr = "";
                        if (typeof m.created_at === 'number') {
                            const dateObj = new Date(m.created_at * 1000);
                            msgDateStr = dateObj.toISOString().split('T')[0];
                        } else if (typeof m.created_at === 'string') {
                            if (/^\d+$/.test(m.created_at)) {
                                const dateObj = new Date(parseInt(m.created_at) * 1000);
                                msgDateStr = dateObj.toISOString().split('T')[0];
                            } else {
                                msgDateStr = m.created_at.split('T')[0];
                            }
                        }
                        isSameDate = (msgDateStr === dataFoco);
                    } catch (err) {
                        isSameDate = false;
                    }
                }
                return isHumanOut && isSameDate;
            });
            
            if (msgHumano.length > 0) {
                historicoTexto += `\n--- Respostas do Atendente Humano no Chatwoot ---\n`;
                msgHumano.forEach(m => {
                    historicoTexto += `Humano: "${m.content}"\n`;
                });
            }
        }

        // Chamar Gemini para análise
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite",
                generationConfig: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 800,
                    temperature: 0.2
                }
            });

            const prompt = `Você é um avaliador editorial. Analise esta conversa de WhatsApp da farmácia veterinária Otimiza. A IA atendeu primeiro; em alguns casos um humano assumiu depois.
Identifique:
1. A IA seguiu as regras críticas? Cite a regra violada se sim.
2. A resposta da IA foi correta tecnicamente? (preço, prazo, compliance)
3. A IA foi prolixa ou floreou? (deveria responder em 1-2 frases)
4. Se houve transbordo, o humano disse algo MUITO diferente do que a IA teria dito? Resuma a diferença.
5. Padrão de dúvida do cliente que poderia virar resposta automática (short-circuit) ou regra nova no regras_criticas.md.

Histórico da Conversa:
"""
${historicoTexto}
"""

Responda estritamente em JSON:
{
  "violacoes_regra": ["regra violada ou vazio"],
  "erros_tecnicos": ["erro tecnico ou vazio"],
  "prolixidade": false,
  "divergencia_humano": "resumo ou null",
  "sugestao_short_circuit": "padrao ou null",
  "sugestao_regra": "regra recomendada ou null"
}`;

            let responseText = null;
            let result = null;
            let retries = 3;
            let delay = 1500;

            while (retries > 0) {
                try {
                    result = await model.generateContent(prompt);
                    responseText = result.response.text();
                    break;
                } catch (err) {
                    retries--;
                    if (retries === 0) {
                        throw err;
                    }
                    console.warn(`⚠️ [GEMINI 503/LOCKED] Erro ao chamar Gemini para +${sessao.phone} (${err.message}). Tentando novamente em ${delay}ms... (Tentativas restantes: ${retries})`);
                    await new Promise(r => setTimeout(r, delay));
                    delay *= 2;
                }
            }

            let jsonRes;
            try {
                jsonRes = JSON.parse(responseText);
            } catch (jsonErr) {
                console.error("❌ Falha no parsing do JSON retornado pelo Gemini:", responseText);
                continue;
            }

            // Registrar custo no monitor
            const usageMetadata = result.response.usageMetadata;
            if (usageMetadata) {
                custoMonitor.registrarChamada({
                    promptTokens: usageMetadata.promptTokenCount || 0,
                    candidateTokens: usageMetadata.candidatesTokenCount || 0,
                    cachedTokens: usageMetadata.cachedContentTokenCount || 0,
                    model: 'gemini-2.5-flash-lite',
                    persona: 'Aika'
                });
            }

            resultadosAnalise.push({
                sessao,
                analise: jsonRes
            });

            // Evitar rate limit
            await new Promise(r => setTimeout(r, 500));
        } catch (geminiErr) {
            console.error(`❌ Erro na chamada do Gemini para +${sessao.phone}:`, geminiErr.message);
        }
    }

    // Gerar Relatório MD
    const hojeStr = new Date().toISOString().split('T')[0];
    const relatorioPath = path.join(relatoriosDir, `analise_semanal_${hojeStr}.md`);

    // Calcular Métricas
    const totalAnalisadas = resultadosAnalise.length;
    let totalViolacoes = 0;
    let totalProlixas = 0;
    const shortCircuitsMap = new Map();
    const regrasMap = new Map();
    const divergencias = [];

    for (const item of resultadosAnalise) {
        const a = item.analise;
        if (a.violacoes_regra && a.violacoes_regra.length > 0 && a.violacoes_regra[0] !== "") {
            totalViolacoes++;
        }
        if (a.prolixidade) {
            totalProlixas++;
        }
        if (a.sugestao_short_circuit) {
            shortCircuitsMap.set(a.sugestao_short_circuit, (shortCircuitsMap.get(a.sugestao_short_circuit) || 0) + 1);
        }
        if (a.sugestao_regra) {
            regrasMap.set(a.sugestao_regra, (regrasMap.get(a.sugestao_regra) || 0) + 1);
        }
        if (a.divergencia_humano) {
            divergencias.push({
                phone: item.sessao.phone,
                clientName: item.sessao.clientName,
                resumo: a.divergencia_humano
            });
        }
    }

    const pctViolacao = totalAnalisadas > 0 ? ((totalViolacoes / totalAnalisadas) * 100).toFixed(1) : 0;
    const pctProlixas = totalAnalisadas > 0 ? ((totalProlixas / totalAnalisadas) * 100).toFixed(1) : 0;

    // Top 5 short-circuits
    const topShortCircuits = Array.from(shortCircuitsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => `${entry[0]} (detectado em ${entry[1]} conversas)`);

    // Agrupar regras
    const regrasSugeridas = Array.from(regrasMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => `* ${entry[0]} (recorrente em ${entry[1]} conversas)`);

    let mdContent = `# 📊 Relatório de Análise Semanal de Logs — Otimiza FarmaVet\n`;
    mdContent += `**Data de Geração:** ${hojeStr}\n\n`;
    mdContent += `## 📈 Métricas Gerais\n`;
    mdContent += `*   **Conversas Analisadas:** ${totalAnalisadas}\n`;
    mdContent += `*   **Conversas com Violação de Regras:** ${pctViolacao}% (${totalViolacoes}/${totalAnalisadas})\n`;
    mdContent += `*   **Conversas Classificadas como Prolixas:** ${pctProlixas}% (${totalProlixas}/${totalAnalisadas})\n\n`;
    
    mdContent += `## 💡 Top Padrões de Dúvida (Candidatos a Short-Circuit)\n`;
    if (topShortCircuits.length === 0) {
        mdContent += `*Nenhum padrão recorrente identificado nesta rodada.*\n\n`;
    } else {
        topShortCircuits.forEach((sc, idx) => {
            mdContent += `${idx + 1}. ${sc}\n`;
        });
        mdContent += `\n`;
    }

    mdContent += `## 📋 Sugestões de Novas Regras (Para Revisão da Carmen)\n`;
    if (regrasSugeridas.length === 0) {
        mdContent += `*Nenhuma regra recomendada nesta rodada.*\n\n`;
    } else {
        mdContent += regrasSugeridas.join('\n') + `\n\n`;
    }

    mdContent += `## 🔄 Padrões de Divergência Humano vs IA\n`;
    if (divergencias.length === 0) {
        mdContent += `*Nenhuma divergência expressiva observada nos atendimentos transbordados.*\n\n`;
    } else {
        divergencias.forEach(d => {
            mdContent += `*   **+${d.phone} (${d.clientName}):** ${d.resumo}\n`;
        });
        mdContent += `\n`;
    }

    mdContent += `## 🔍 Detalhes das Sessões Avaliadas\n`;
    resultadosAnalise.forEach(item => {
        const s = item.sessao;
        const a = item.analise;
        mdContent += `### 👤 +${s.phone} (${s.clientName}) - ${s.date}\n`;
        mdContent += `*   **Violações:** ${a.violacoes_regra.join(', ') || 'Nenhuma'}\n`;
        mdContent += `*   **Erros Técnicos:** ${a.erros_tecnicos.join(', ') || 'Nenhum'}\n`;
        mdContent += `*   **Prolixidade:** ${a.prolixidade ? 'Sim ❌' : 'Não (Compacta) ✅'}\n`;
        if (a.divergencia_humano) {
            mdContent += `*   **Divergência:** ${a.divergencia_humano}\n`;
        }
        mdContent += `\n`;
    });

    fs.writeFileSync(relatorioPath, mdContent, 'utf8');
    console.log(`✅ Relatório semanal salvo com sucesso em: ${relatorioPath}`);

    // ─── Alerta Telegram com resumo executivo ──────────────────────────────
    await enviarResumoTelegram({
        totalAnalisadas,
        totalViolacoes,
        totalProlixas,
        pctViolacao,
        pctProlixas,
        topShortCircuits,
        regrasSugeridas,
        divergencias,
        relatorioPath
    });

    console.log(`[OK] analise_semanal_logs.js ${new Date().toISOString()} Resumo: Análise concluída. Relatório gerado.`);
}

/**
 * Envia resumo executivo da análise semanal para o Telegram.
 * Mensagem curta com TL;DR pra Carmen ver no celular sem abrir o painel.
 */
async function enviarResumoTelegram(dados) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID
        || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);

    if (!token || !chatId) {
        console.log("⚠️ [TELEGRAM] Bot não configurado — pulando alerta semanal.");
        return;
    }

    const top3SC = (dados.topShortCircuits || []).slice(0, 3);
    const top3Regras = (dados.regrasSugeridas || []).slice(0, 3);
    const top3Diverg = (dados.divergencias || []).slice(0, 3);

    let msg = `📊 <b>Análise Semanal — Otimiza</b>\n\n`;
    msg += `<b>${dados.totalAnalisadas}</b> conversas analisadas\n`;
    msg += `🛑 <b>${dados.pctViolacao}%</b> com violação de regra (${dados.totalViolacoes})\n`;
    msg += `📝 <b>${dados.pctProlixas}%</b> prolixas (${dados.totalProlixas})\n\n`;

    if (top3SC.length > 0) {
        msg += `💡 <b>Top padrões pra short-circuit:</b>\n`;
        top3SC.forEach((sc, i) => {
            const limpo = sc.replace(/\(detectado em \d+ conversas?\)/, '').trim();
            msg += `${i + 1}. ${limpo.substring(0, 120)}${limpo.length > 120 ? '…' : ''}\n`;
        });
        msg += '\n';
    }

    if (top3Regras.length > 0) {
        msg += `📋 <b>Top sugestões de regra:</b>\n`;
        top3Regras.forEach((r, i) => {
            const limpo = r.replace(/^\* /, '').replace(/\(recorrente em \d+ conversas?\)/, '').trim();
            msg += `${i + 1}. ${limpo.substring(0, 120)}${limpo.length > 120 ? '…' : ''}\n`;
        });
        msg += '\n';
    }

    if (top3Diverg.length > 0) {
        msg += `🔄 <b>Divergências humano vs IA:</b> ${dados.divergencias.length} casos (${top3Diverg.length} mostrados)\n\n`;
    }

    msg += `📂 Relatório completo: <code>${path.basename(dados.relatorioPath)}</code>\n`;
    msg += `🔗 Detalhes em <code>/saude</code> no painel.`;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: msg,
            parse_mode: "HTML"
        });
        console.log("✅ [TELEGRAM] Resumo executivo da análise semanal enviado.");
    } catch (e) {
        console.error(`❌ [TELEGRAM] Falha ao enviar resumo: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
    }
}

rodar().catch(err => {
    console.error(`[ERRO] analise_semanal_logs.js ${err.message}`);
    process.exit(1);
});
