const axios = require('axios');
require('dotenv').config();

const url = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-01/articles.json?limit=5`;

axios.get(url, {
    headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
})
.then(res => {
    console.log("Últimos 5 artigos na Shopify:");
    res.data.articles.forEach(a => {
        console.log(`- Título: ${a.title} | ID: ${a.id} | Blog ID: ${a.blog_id} | Published at: ${a.published_at}`);
    });
})
.catch(err => console.error(err.response?.data || err.message));
