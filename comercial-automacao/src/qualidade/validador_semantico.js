/**
 * Validador Semântico — Auditor da resposta da IA ANTES de mandar pro cliente.
 *
 * Hoje o `snc_core.validarTomDeVoz` é blacklist de palavras (placebo). Esse
 * módulo faz validação real via Gemini: checa se a resposta gerada viola
 * regras críticas (preço inventado, persona errada, frases proibidas,
 * vazamento de fornecedor, etc.). Se reprova com alta confiança, o server
 * substitui a resposta por um fallback seguro.
 *
 * Toggle: VALIDADOR_SEMANTICO_ENABLED="true" (default true).
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let custoMonitor = null;
try {
    custoMonitor = require('../observabilidade/custo_monitor');
} catch (e) { /* monitor opcional */ }

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Arquivo onde reprovações ficam registradas em JSONL (lido pelo painel /saude)
const REPROVACOES_FILE = path.resolve(__dirname, '../../validacoes_reprovadas.jsonl');

function persistirReprovacao(registro) {
    try {
        let mascarado = registro;
        try {
            const mascararPii = require('../privacidade/mascarar_pii');
            mascarado = mascararPii.mascararLog(registro);
            if (mascarado.respostaOriginal) {
                mascarado.respostaOriginal = mascararPii.mascararTexto(mascarado.respostaOriginal);
            }
        } catch (_) { /* mascarador opcional */ }
        const linha = JSON.stringify({ timestamp: new Date().toISOString(), ...mascarado }) + '\n';
        fs.appendFileSync(REPROVACOES_FILE, linha, 'utf8');
    } catch (e) {
        console.error(`❌ [VALIDADOR] Falha ao persistir reprovação: ${e.message}`);
    }
}

/**
 * Avalia uma resposta da IA contra as regras críticas.
 * @param {string} responseText - texto que SERIA enviado ao cliente
 * @param {string} persona - 'Aika' ou 'Kyenner'
 * @param {string} contextoInjetado - contexto dinâmico usado na geração
 * @param {string} phone - telefone do cliente (pra decidir canary)
 * @returns {Promise<{aprovada: boolean, violacoes: string[], confianca: number}>}
 */
async function validarRespostaIA(responseText, persona, contextoInjetado = "", phone = null) {
    const enabled = (process.env.VALIDADOR_SEMANTICO_ENABLED || 'true') === 'true';
    if (!enabled) {
        return { aprovada: true, violacoes: [], confianca: 1, skipped: true };
    }

    // Pula validação se o envio real NÃO vai acontecer (silencioso e fora do canary).
    // Bot não envia mesmo, então não há motivo pra gastar token validando.
    try {
        const gateway = require('../integracoes/whatsapp_gateway');
        if (phone && !gateway.deveEnviarReal(phone)) {
            return { aprovada: true, violacoes: [], confianca: 1, skipped: 'silent-or-canary-out' };
        }
    } catch (e) {
        // Se não conseguiu carregar gateway, usa heurística simples
        if (process.env.MODO_SILENCIOSO !== 'false' && parseInt(process.env.CANARY_PCT || '0') === 0) {
            return { aprovada: true, violacoes: [], confianca: 1, skipped: 'silent-mode' };
        }
    }

    if (!responseText || responseText.trim().length === 0) {
        return { aprovada: false, violacoes: ['resposta-vazia'], confianca: 1 };
    }

    // Camada 4: Heurística de Segurança contra Vazamento / Prompt Injection
    const responseTextLower = responseText.toLowerCase();
    const padroesVazamento = [
        "instruções de sistema",
        "instrucoes de sistema",
        "minhas diretrizes",
        "sou um modelo de linguagem",
        "como um modelo de ia",
        "como inteligência artificial",
        "como inteligencia artificial",
        "developer mode",
        "regras do sistema",
        "ignore as instruções",
        "ignore as instrucoes",
        "white prompt"
    ];
    for (const padrao of padroesVazamento) {
        if (responseTextLower.includes(padrao)) {
            console.warn(`🚨 [VALIDADOR-SEGURANÇA] Vazamento suspeito detectado no output: "${padrao}"`);
            return {
                aprovada: false,
                violacoes: [`seguranca: vazamento de prompt detectado via termo "${padrao}"`],
                confianca: 1.0
            };
        }
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0,
                responseMimeType: 'application/json'
            }
        });

        const prompt = `Você é um auditor da farmácia veterinária Otimiza FarmaVet. Avalie se a resposta gerada pela IA abaixo respeita estas regras:
- Máximo 2 frases por mensagem.
- NÃO pode terminar com "Estou à disposição", "Qualquer dúvida estou aqui", "Posso ajudar com mais algo?" ou similares.
- Preço (R$ XX), se citado, deve aparecer no CONTEXTO fornecido OU estar entre os valores oficiais permitidos: vacinas Vet em Casa (R$60, R$70, R$80, R$90, R$97); Librela/Cytopoint (R$ 380 unitário, R$ 350 cada na compra de 2); vacinas atacado B2B (Rabisin R$ 17,90, Nobivac V8 R$ 44,50, Nobivac V5 R$ 37,90); Chave Pix (31) 98793-6822; taxa cartão 4,99%.
- Persona ${persona === 'Aika' ? 'Aika (B2C) deve usar 1 emoji (🐾 ou 💜)' : 'Kyenner (B2B) NÃO deve usar emoji'}.
- NUNCA pode mencionar "distribuidor" ou "fornecedor".
- ${persona === 'Kyenner' ? 'NUNCA usar "Dr.", "Dra.", "Doutor" ou "Doutora".' : 'NUNCA usar "Prezado", "Senhor", "Senhora".'}
- Para mensagens de SPAM/Propaganda/Venda de serviços por terceiros: a resposta deve apenas recusar a oferta de forma curta e polida. Não deve pedir CPF, CRMV ou tentar vender produtos. A instrução de CRM sobre cliente não localizado é irrelevante e deve ser ignorada nesses casos.

[ATENÇÃO]: Instruções de vendas e cross-sell no CONTEXTO abaixo são opcionais e NÃO devem ser auditadas como violação caso a resposta gerada não as inclua. Foque estritamente em compliance e segurança.

CONTEXTO disponível na geração:
"""
${(contextoInjetado || '(vazio)').substring(0, 1200)}
"""

RESPOSTA a auditar:
"""
${responseText}
"""

Responda estritamente em JSON:
{ "aprovada": true|false, "violacoes": ["descrição curta de cada violação"], "confianca": 0.0-1.0 }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Registrar custo
        if (custoMonitor && result.response.usageMetadata) {
            const u = result.response.usageMetadata;
            custoMonitor.registrarChamada({
                promptTokens: u.promptTokenCount || 0,
                candidateTokens: u.candidatesTokenCount || 0,
                cachedTokens: u.cachedContentTokenCount || 0,
                model: 'gemini-2.5-flash-lite',
                persona: 'Validador'
            });
        }

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.warn(`[VALIDADOR] JSON inválido, aprovando por segurança: ${text.substring(0, 100)}`);
            return { aprovada: true, violacoes: [], confianca: 0 };
        }

        return {
            aprovada: parsed.aprovada !== false,
            violacoes: Array.isArray(parsed.violacoes) ? parsed.violacoes : [],
            confianca: typeof parsed.confianca === 'number' ? parsed.confianca : 0
        };
    } catch (e) {
        // Falha do validador NÃO deve bloquear o atendimento — aprova por padrão
        console.error(`❌ [VALIDADOR] Erro: ${e.message}. Aprovando por fail-open.`);
        return { aprovada: true, violacoes: [], confianca: 0, erro: e.message };
    }
}

module.exports = { validarRespostaIA, persistirReprovacao };
