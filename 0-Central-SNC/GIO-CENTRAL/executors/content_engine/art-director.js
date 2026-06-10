/**
 * Módulo 5: O Diretor de Arte Automatizado
 * Localizado em: /otimiza-content-generator/art-director.js
 * 
 * Este módulo decide qual API de imagem usar baseado na frente de negócio:
 * - B2C / Aika: DALL-E 3 (OpenAI) para fotos realistas e impactantes.
 * - RT / B2B: Bannerbear para banners gráficos com texto (Título do Gancho).
 */

const axios = require('axios');

const {
    OPENAI_API_KEY,
    BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_ID
} = process.env;

/**
 * Roteia e gera a arte visual para o post
 * @param {Object} briefing - Objeto do Módulo 1
 * @param {string} visualSuggestion - Sugestão visual do Módulo 2
 */
async function generateVisualArt(briefing, visualSuggestion) {
    const isB2C = briefing.frente_de_negocio.toUpperCase().includes('B2C');

    try {
        if (isB2C) {
            console.log(`   🎨 Gerando imagem fotorrealista (DALL-E 3) para B2C...`);
            if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente.");

            const response = await axios.post('https://api.openai.com/v1/images/generations', {
                model: "dall-e-3",
                prompt: `Fotografia dramática e cinematográfica, alto contraste de cores (quentes/frias), hiper-realista. ${visualSuggestion}`,
                n: 1,
                size: "1024x1024",
                quality: "hd"
            }, {
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
            });

            return response.data.data[0].url;
        } else {
            console.log(`   🎨 Gerando banner gráfico (Bannerbear) para ${briefing.frente_de_negocio}...`);
            if (!BANNERBEAR_API_KEY || !BANNERBEAR_TEMPLATE_ID) throw new Error("Cofigurações Bannerbear ausentes.");

            const response = await axios.post('https://api.bannerbear.com/v2/images', {
                template: BANNERBEAR_TEMPLATE_ID,
                modifications: [
                    {
                        name: "titulo", // Nome da camada no template do Bannerbear
                        text: briefing.tema_central
                    }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${BANNERBEAR_API_KEY}` }
            });

            // Bannerbear pode ser assíncrono, mas o endpoint /images com POST costuma retornar o link direto se for pequeno
            return response.data.image_url || response.data.uid;
        }
    } catch (error) {
        console.error(`   ⚠️  Falha ao gerar arte visual: ${error.message}`);
        return null; // Retorna null para não quebrar o pipeline, Módulo 4 tratará isso.
    }
}

module.exports = { generateVisualArt };
