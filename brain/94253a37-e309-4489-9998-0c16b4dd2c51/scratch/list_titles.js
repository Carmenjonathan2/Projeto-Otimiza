// Diagnosticador de Artigos Pendentes
require('dotenv').config({ path: './otimiza-content-generator/.env' });
const axios = require('axios');

const STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function check() {
    const url = `https://${STORE_URL}/admin/api/2024-01/graphql.json`;
    const headers = { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' };
    const query = `
      query {
        articles(first: 100) {
          edges {
            node {
              title
              metafield(namespace: "custom", key: "geo_article_schema") { value }
            }
          }
        }
      }
    `;

    try {
        const res = await axios.post(url, { query }, { headers });
        const articles = res.data.data.articles.edges.map(e => e.node);
        const pending = articles.filter(a => !a.metafield).map(a => a.title);
        console.log("📝 ARTIGOS PENDENTES:");
        pending.forEach((t, i) => console.log(`${i + 1}. ${t}`));
    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

check();
