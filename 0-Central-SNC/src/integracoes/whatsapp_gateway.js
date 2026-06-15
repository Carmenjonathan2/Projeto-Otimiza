const zapi = require('./integracao_zapi');
const chatwoot = require('./integracao_chatwoot');

/**
 * Gateway Unificado do WhatsApp para a Otimiza FarmaVet.
 * Centraliza as regras do MODO_SILENCIOSO para todos os fluxos de saída de mensagens.
 */

async function enviarMensagemTexto(phone, text, syncToChatwoot = true) {
    const isSilent = process.env.MODO_SILENCIOSO !== 'false';
    if (isSilent) {
        console.log(`[MODO SILENCIOSO - GATEWAY] IA Sugestão para ${phone}: "${text}"`);
        if (syncToChatwoot) {
            await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - Copiloto]*:\n${text}`);
        }
        return { status: 200, message: "Ignored (Silent Mode)", data: { messageId: "silent_mock_id" } };
    }
    
    console.log(`[GATEWAY] Enviando mensagem de texto para ${phone}...`);
    const result = await zapi.enviarMensagemTexto(phone, text);
    if (syncToChatwoot) {
        await chatwoot.sincronizarMensagemBot(phone, text);
    }
    return result;
}

async function enviarImagem(phone, imageUrl, legenda = "", syncToChatwoot = true) {
    const isSilent = process.env.MODO_SILENCIOSO !== 'false';
    if (isSilent) {
        console.log(`[MODO SILENCIOSO - GATEWAY] IA Sugestão de Imagem para ${phone}: URL=${imageUrl} Legenda="${legenda}"`);
        if (syncToChatwoot) {
            await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - Imagem]*:\nURL: ${imageUrl}\nLegenda: ${legenda}`);
        }
        return { status: 200, message: "Ignored (Silent Mode)", data: { messageId: "silent_mock_img" } };
    }

    console.log(`[GATEWAY] Enviando imagem para ${phone}...`);
    const result = await zapi.enviarImagem(phone, imageUrl, legenda);
    if (syncToChatwoot) {
        await chatwoot.sincronizarMensagemBot(phone, `[Imagem] ${legenda || imageUrl}`);
    }
    return result;
}

async function enviarPDF(phone, pdfUrl, nomeArquivo = "documento.pdf", syncToChatwoot = true) {
    const isSilent = process.env.MODO_SILENCIOSO !== 'false';
    if (isSilent) {
        console.log(`[MODO SILENCIOSO - GATEWAY] IA Sugestão de PDF para ${phone}: URL=${pdfUrl} Nome=${nomeArquivo}`);
        if (syncToChatwoot) {
            await chatwoot.enviarNotaPrivada(phone, `🤖 *[Sugestão da IA - PDF]*:\nURL: ${pdfUrl}\nNome: ${nomeArquivo}`);
        }
        return { status: 200, message: "Ignored (Silent Mode)", data: { messageId: "silent_mock_pdf" } };
    }

    console.log(`[GATEWAY] Enviando PDF para ${phone}...`);
    const result = await zapi.enviarPDF(phone, pdfUrl, nomeArquivo);
    if (syncToChatwoot) {
        await chatwoot.sincronizarMensagemBot(phone, `[PDF] ${nomeArquivo}`);
    }
    return result;
}

module.exports = {
    enviarMensagemTexto,
    enviarImagem,
    enviarPDF
};
