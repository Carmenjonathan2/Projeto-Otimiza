const axios = require('axios');
require('dotenv').config();

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID || "MOCK_INSTANCE";
const TOKEN = process.env.ZAPI_TOKEN || "MOCK_TOKEN";
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || "";

const BASE_URL = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`;

const headers = {
    'Content-Type': 'application/json'
};
if (CLIENT_TOKEN) {
    headers['Client-Token'] = CLIENT_TOKEN;
}

/**
 * Envia uma mensagem de texto simples pelo WhatsApp via Z-API.
 */
async function enviarMensagemTexto(telefone, texto) {
    console.log(`[Z-API] Enviando mensagem de texto para ${telefone}...`);
    
    // Se for ambiente de testes sem variáveis configuradas, apenas logamos
    if (INSTANCE_ID === "MOCK_INSTANCE" || TOKEN === "MOCK_TOKEN") {
        console.log(`[Z-API-MOCK] Mensagem: "${texto}"`);
        return { status: 200, data: { messageId: "mock_id_123" } };
    }

    try {
        const response = await axios.post(`${BASE_URL}/send-text`, {
            phone: telefone,
            message: texto
        }, { headers });
        return response.data;
    } catch (e) {
        console.error(`❌ [Z-API] Erro ao enviar mensagem para ${telefone}:`, e.response ? e.response.data : e.message);
        throw e;
    }
}

/**
 * Envia uma imagem com legenda pelo WhatsApp via Z-API.
 */
async function enviarImagem(telefone, imageUrl, legenda = "") {
    console.log(`[Z-API] Enviando imagem para ${telefone}...`);

    if (INSTANCE_ID === "MOCK_INSTANCE" || TOKEN === "MOCK_TOKEN") {
        console.log(`[Z-API-MOCK] Imagem URL: ${imageUrl} | Legenda: "${legenda}"`);
        return { status: 200, data: { messageId: "mock_img_123" } };
    }

    try {
        const response = await axios.post(`${BASE_URL}/send-image`, {
            phone: telefone,
            image: imageUrl,
            caption: legenda
        }, { headers });
        return response.data;
    } catch (e) {
        console.error(`❌ [Z-API] Erro ao enviar imagem para ${telefone}:`, e.response ? e.response.data : e.message);
        throw e;
    }
}

/**
 * Envia um arquivo PDF pelo WhatsApp via Z-API.
 */
async function enviarPDF(telefone, pdfUrl, nomeArquivo = "documento.pdf") {
    console.log(`[Z-API] Enviando PDF para ${telefone}...`);

    if (INSTANCE_ID === "MOCK_INSTANCE" || TOKEN === "MOCK_TOKEN") {
        console.log(`[Z-API-MOCK] PDF URL: ${pdfUrl} | Nome: ${nomeArquivo}`);
        return { status: 200, data: { messageId: "mock_pdf_123" } };
    }

    try {
        const response = await axios.post(`${BASE_URL}/send-document/pdf`, {
            phone: telefone,
            document: pdfUrl,
            fileName: nomeArquivo
        }, { headers });
        return response.data;
    } catch (e) {
        console.error(`❌ [Z-API] Erro ao enviar PDF para ${telefone}:`, e.response ? e.response.data : e.message);
        throw e;
    }
}

module.exports = {
    enviarMensagemTexto,
    enviarImagem,
    enviarPDF
};
