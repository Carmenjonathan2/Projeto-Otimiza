const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CUSTO_FILE = path.resolve(__dirname, '../../custo_diario.json');

// Tabela de preços fixa por modelo (em USD por 1 milhão de tokens)
const PRECOS_USD_POR_MILHAO = {
    'gemini-2.5-flash-lite': { input: 0.10, cached: 0.025, output: 0.40 },
    'gemini-2.5-flash':      { input: 0.30, cached: 0.075, output: 2.50 },
    'gemini-2.0-flash':      { input: 0.10, cached: 0.025, output: 0.40 }
};

/**
 * Registra o consumo de tokens de uma chamada à API do Gemini e atualiza o histórico diário.
 * @param {object} params
 * @param {number} params.promptTokens - Tokens de entrada não-cacheados
 * @param {number} params.candidateTokens - Tokens de saída gerados
 * @param {number} params.cachedTokens - Tokens de entrada recuperados do cache
 * @param {string} params.model - Identificador do modelo utilizado
 * @param {string} params.persona - Persona ativa ('Aika' ou 'Kyenner')
 */
function registrarChamada({ promptTokens, candidateTokens, cachedTokens, model, persona }) {
    const hoje = new Date().toISOString().split('T')[0];
    let dados = {};

    if (fs.existsSync(CUSTO_FILE)) {
        try {
            dados = JSON.parse(fs.readFileSync(CUSTO_FILE, 'utf8'));
        } catch (e) {
            dados = {};
        }
    }

    if (!dados[hoje]) {
        dados[hoje] = {
            chamadas: 0,
            input_tokens: 0,
            output_tokens: 0,
            cached_tokens: 0,
            custo_usd_estimado: 0.0,
            modelo_predominante: model,
            alerta_enviado_hoje: false
        };
    }

    const dia = dados[hoje];
    
    // Obter preços para o modelo
    const precos = PRECOS_USD_POR_MILHAO[model] || PRECOS_USD_POR_MILHAO['gemini-2.5-flash-lite'];
    
    // Calcular o custo estimado da chamada individual
    const custoChamada = (promptTokens * precos.input + cachedTokens * precos.cached + candidateTokens * precos.output) / 1000000;

    dia.chamadas += 1;
    dia.input_tokens += promptTokens;
    dia.output_tokens += candidateTokens;
    dia.cached_tokens += cachedTokens;
    dia.custo_usd_estimado += custoChamada;
    dia.modelo_predominante = model;

    // Salvar arquivo atualizado sincronamente para evitar race conditions rápidos
    fs.writeFileSync(CUSTO_FILE, JSON.stringify(dados, null, 4), 'utf8');

    console.log(`[CUSTO-MONITOR] Chamada registrada (${persona} / ${model}). Custo: USD ${custoChamada.toFixed(6)}. Acumulado hoje: USD ${dia.custo_usd_estimado.toFixed(4)}`);

    // Validar limites em segundo plano para não bloquear a chamada
    verificarLimites(hoje, dia).catch(e => {
        console.error("❌ [CUSTO-MONITOR] Erro ao verificar limites de custo:", e.message);
    });
}

/**
 * Verifica se os limites definidos no .env foram atingidos e aciona alertas ou o kill-switch.
 */
async function verificarLimites(dataStr, dia) {
    const custoAlertaTelegram = parseFloat(process.env.CUSTO_ALERTA_TELEGRAM_USD || '2.00');
    const custoKillSwitch = parseFloat(process.env.CUSTO_KILL_SWITCH_USD || '10.00');

    // 1. Alerta por Telegram
    if (dia.custo_usd_estimado > custoAlertaTelegram && !dia.alerta_enviado_hoje) {
        console.log(`[CUSTO-MONITOR] Custo diário acumulado ultrapassou o alerta de USD ${custoAlertaTelegram.toFixed(2)}. Disparando aviso...`);
        
        // Marcar o alerta como enviado no arquivo para persistência
        try {
            const dados = JSON.parse(fs.readFileSync(CUSTO_FILE, 'utf8'));
            if (dados[dataStr]) {
                dados[dataStr].alerta_enviado_hoje = true;
                fs.writeFileSync(CUSTO_FILE, JSON.stringify(dados, null, 4), 'utf8');
            }
        } catch (e) {
            console.error("❌ [CUSTO-MONITOR] Falha ao marcar alerta_enviado_hoje:", e.message);
        }

        const msgAlerta = `⚠️ <b>[CUSTO-MONITOR] ALERTA DE CONSUMO DIÁRIO</b>\n\n` +
            `O custo diário acumulado da API Gemini atingiu <b>USD ${dia.custo_usd_estimado.toFixed(4)}</b>.\n\n` +
            `• <b>Chamadas:</b> ${dia.chamadas}\n` +
            `• <b>Input Tokens:</b> ${dia.input_tokens}\n` +
            `• <b>Cached Tokens:</b> ${dia.cached_tokens}\n` +
            `• <b>Output Tokens:</b> ${dia.output_tokens}\n` +
            `• <b>Modelo Predominante:</b> <code>${dia.modelo_predominante}</code>`;
        
        await enviarAlertaTelegram(msgAlerta);
    }

    // 2. Kill-Switch (Forçar Modo Silencioso)
    if (dia.custo_usd_estimado > custoKillSwitch && process.env.MODO_SILENCIOSO !== 'true') {
        console.warn(`[KILL-SWITCH] Custo do dia ultrapassou USD ${custoKillSwitch.toFixed(2)}. Modo silencioso forçado.`);
        
        process.env.MODO_SILENCIOSO = 'true';

        const msgKillSwitch = `🚨 <b>[KILL-SWITCH CRÍTICO] ORÇAMENTO EXCEDIDO</b>\n\n` +
            `O custo diário atingiu <b>USD ${dia.custo_usd_estimado.toFixed(4)}</b>, ultrapassando o teto crítico de <b>USD ${custoKillSwitch.toFixed(2)}</b>.\n\n` +
            `<b>AÇÃO AUTOMÁTICA: O MODO SILENCIOSO FOI ATIVADO EM MEMÓRIA!</b> nenhuma resposta automática será enviada ao cliente pelo WhatsApp para impedir custos adicionais.`;

        await enviarAlertaTelegram(msgKillSwitch);
    }
}

/**
 * Envia um alerta no grupo do Telegram.
 */
async function enviarAlertaTelegram(mensagem) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
    
    if (!token || !chatId) {
        console.log("⚠️ [CUSTO-MONITOR] Telegram não configurado no .env.");
        return;
    }

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: mensagem,
            parse_mode: "HTML"
        });
        console.log("✅ [CUSTO-MONITOR] Alerta enviado ao Telegram.");
    } catch (e) {
        console.error("❌ [CUSTO-MONITOR] Erro ao enviar mensagem para o Telegram:", e.response ? e.response.data : e.message);
    }
}

module.exports = {
    registrarChamada
};
