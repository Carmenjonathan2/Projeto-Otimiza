const crypto = require('crypto');
const zapi = require('./integracao_zapi');
const chatwoot = require('./integracao_chatwoot');

/**
 * Gateway Unificado do WhatsApp para a Otimiza FarmaVet.
 * Centraliza as regras do MODO_SILENCIOSO e do MODO CANARY pra todos os fluxos de saída.
 *
 * MODO_SILENCIOSO=true  → bot NÃO envia nada (só nota privada no Chatwoot).
 * MODO_SILENCIOSO=false → bot envia, mas pode ser filtrado pelo Canary.
 *
 * CANARY_PCT (0 a 100):
 *   - Quando MODO_SILENCIOSO=true E CANARY_PCT > 0, X% dos phones (decisão
 *     determinística por hash) ficam em modo ATIVO; o resto continua silencioso.
 *   - Quando MODO_SILENCIOSO=false, CANARY_PCT é ignorado (todos ativos).
 *   - CANARY_PCT=0 (default) = sem canary, MODO_SILENCIOSO manda direto.
 *
 * Use o canary pra subir gradual: 5% por dia até bater 100%, vendo o painel.
 */

function canaryAtivoParaPhone(phone) {
    const pctRaw = parseInt(process.env.CANARY_PCT || '0', 10);
    if (isNaN(pctRaw) || pctRaw <= 0) return false;
    if (pctRaw >= 100) return true;
    // Hash determinístico por phone — mesmo phone cai sempre no mesmo bucket.
    const hash = crypto.createHash('sha256').update(String(phone)).digest();
    const bucket = hash.readUInt16BE(0) % 100; // 0..99
    return bucket < pctRaw;
}

function deveEnviarReal(phone) {
    // 1. Verificar se o número de telefone está na allowlist (Fase 3.1)
    const allowlistStr = process.env.ALLOWLIST_NUMEROS || '';
    if (allowlistStr) {
        const numerosAprovados = allowlistStr.split(',').map(n => n.replace(/\D/g, '').trim()).filter(Boolean);
        const phoneLimpo = String(phone).replace(/\D/g, '').trim();
        if (numerosAprovados.includes(phoneLimpo)) {
            console.log(`[ALLOWLIST] +${phoneLimpo} está na allowlist de teste. Forçando envio real.`);
            return true;
        }
    }

    const isSilentGlobal = process.env.MODO_SILENCIOSO !== 'false';
    if (!isSilentGlobal) return true; // modo ativo full
    // Em silencioso, ainda pode estar no canary
    return canaryAtivoParaPhone(phone);
}

function logModo(phone, tipo) {
    const isSilentGlobal = process.env.MODO_SILENCIOSO !== 'false';
    const isCanary = isSilentGlobal && canaryAtivoParaPhone(phone);
    if (isCanary) return `[CANARY ATIVO - ${tipo}]`;
    if (isSilentGlobal) return `[MODO SILENCIOSO - ${tipo}]`;
    return `[ATIVO - ${tipo}]`;
}

async function enviarMensagemTexto(phone, text, syncToChatwoot = true, forceSend = false) {
    if (!forceSend && !deveEnviarReal(phone)) {
        console.log(`${logModo(phone, 'GATEWAY')} IA Sugestão para ${phone}: "${text}"`);
        if (syncToChatwoot) {
            await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - Copiloto]*:\n${text}`);
        }
        return { status: 200, message: "Ignored (Silent/Canary out)", data: { messageId: "silent_mock_id" } };
    }

    console.log(`${logModo(phone, 'GATEWAY')} Enviando texto para ${phone}... (forceSend: ${forceSend})`);
    const result = await zapi.enviarMensagemTexto(phone, text);
    if (syncToChatwoot) {
        await chatwoot.sincronizarMensagemBot(phone, text);
    }
    return result;
}

async function enviarImagem(phone, imageUrl, legenda = "", syncToChatwoot = true) {
    if (!deveEnviarReal(phone)) {
        console.log(`${logModo(phone, 'GATEWAY')} IA Sugestão de Imagem para ${phone}: URL=${imageUrl} Legenda="${legenda}"`);
        if (syncToChatwoot) {
            await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - Imagem]*:\nURL: ${imageUrl}\nLegenda: ${legenda}`);
        }
        return { status: 200, message: "Ignored (Silent/Canary out)", data: { messageId: "silent_mock_img" } };
    }

    console.log(`${logModo(phone, 'GATEWAY')} Enviando imagem para ${phone}...`);
    const result = await zapi.enviarImagem(phone, imageUrl, legenda);
    if (syncToChatwoot) {
        await chatwoot.sincronizarMensagemBot(phone, `[Imagem] ${legenda || imageUrl}`);
    }
    return result;
}

async function enviarPDF(phone, pdfUrl, nomeArquivo = "documento.pdf", syncToChatwoot = true) {
    if (!deveEnviarReal(phone)) {
        console.log(`${logModo(phone, 'GATEWAY')} IA Sugestão de PDF para ${phone}: URL=${pdfUrl} Nome=${nomeArquivo}`);
        if (syncToChatwoot) {
            await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - PDF]*:\nURL: ${pdfUrl}\nNome: ${nomeArquivo}`);
        }
        return { status: 200, message: "Ignored (Silent/Canary out)", data: { messageId: "silent_mock_pdf" } };
    }

    console.log(`${logModo(phone, 'GATEWAY')} Enviando PDF para ${phone}...`);
    const result = await zapi.enviarPDF(phone, pdfUrl, nomeArquivo);
    if (syncToChatwoot) {
        await chatwoot.sincronizarMensagemBot(phone, `[PDF] ${nomeArquivo}`);
    }
    return result;
}

module.exports = {
    enviarMensagemTexto,
    enviarImagem,
    enviarPDF,
    // Exportados pra observabilidade/testes
    canaryAtivoParaPhone,
    deveEnviarReal
};
