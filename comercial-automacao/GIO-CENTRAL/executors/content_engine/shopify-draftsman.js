/**
 * Módulo: Shopify Draftsman
 * Localizado em: /otimiza-content-generator/shopify-draftsman.js
 * Função: Criar rascunhos de artigos com SEO/GEO na Shopify
 */

require('dotenv').config();
const axios = require('axios');

const STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// IDs dos Blogs (Capturados via Diagnóstico)
const BLOGS = {
    'tutores': '118332752160',
    'novidades': '117194391840',
    'fala-medvet': '117194391840' // Alias para o blog de novidades
};

/**
 * Cria um rascunho de artigo com SEO embutido
 * @param {Object} data - Objeto contendo titulo, corpo, resumo e schema
 * @param {string} category - 'B2B' ou 'B2C'
 */
async function createDraftArticle(data, category = 'B2C') {
    const blogKey = category === 'B2B' ? 'fala-medvet' : 'tutores';
    const blogId = BLOGS[blogKey];
    const url = `https://${STORE_URL}/admin/api/2024-01/blogs/${blogId}/articles.json`;

    console.log(`\n📤 Módulo Shopify: Criando rascunho [${data.title.substring(0, 30)}...]`);

    const payload = {
        article: {
            title: data.title,
            body_html: data.body_html,
            author: "Otimiza FarmaVet",
            published: false, // Garante que é Rascunho
            summary_html: data.summary || "",
            metafields: [
                {
                    namespace: "custom",
                    key: "geo_article_schema",
                    value: JSON.stringify(data.schema_markup),
                    type: "json"
                }
            ]
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        const article = response.data.article;
        console.log(`   ✅ Artigo Criado com Sucesso!`);
        console.log(`      🆔 ID: ${article.id}`);
        console.log(`      🔗 Link Edição: https://${STORE_URL}/admin/articles/${article.id}`);
        
        return {
            id: article.id,
            url: `https://${STORE_URL}/admin/articles/${article.id}`
        };

    } catch (error) {
        console.error(`   ❌ Erro ao criar rascunho na Shopify:`, error.response?.data || error.message);
        return null;
    }
}

module.exports = { createDraftArticle };
