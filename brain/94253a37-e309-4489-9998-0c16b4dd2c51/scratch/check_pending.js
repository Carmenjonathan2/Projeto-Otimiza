// Verificador de Pendências Otimiza
// Este script verifica o status atual na Shopify para o relatório do Jonathan

require('dotenv').config({ path: './otimiza-content-generator/.env' });
const axios = require('axios');

const STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function checkStatus() {
    const url = `https://${STORE_URL}/admin/api/2024-01/graphql.json`;
    const headers = { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' };

    try {
        console.log("🔍 Verificando Blog e Coleções...");

        // 1. Artigos Pendentes
        const articleQuery = `
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
        const resArt = await axios.post(url, { query: articleQuery }, { headers });
        const articles = resArt.data.data.articles.edges.map(e => e.node);
        const articlesPending = articles.filter(a => !a.metafield).length;

        // 2. Coleções Pendentes
        const collectionQuery = `
          query {
            collections(first: 100) {
              edges {
                node {
                  title
                  metafield(namespace: "custom", key: "geo_faq") { value }
                }
              }
            }
          }
        `;
        const resCol = await axios.post(url, { query: collectionQuery }, { headers });
        const collections = resCol.data.data.collections.edges.map(e => e.node);
        const collectionsPending = collections.filter(c => !c.metafield).length;

        console.log(`\n📊 STATUS ATUAL:`);
        console.log(`📝 Artigos Blog Pendentes: ${articlesPending} de ${articles.length}`);
        console.log(`📌 Coleções Pendentes: ${collectionsPending} de ${collections.length}`);

    } catch (e) {
        console.error("❌ Erro na consulta:", e.message);
    }
}

checkStatus();
