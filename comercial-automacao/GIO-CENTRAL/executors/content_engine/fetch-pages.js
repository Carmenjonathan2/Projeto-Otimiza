const axios = require('axios');
require('dotenv').config();
const STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

axios.get(`https://${STORE_URL}/admin/api/2024-01/pages.json`, {
  headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' }
})
.then(res => {
  res.data.pages.forEach(p => console.log('\n--- ID: ' + p.id + ' | TITLE: ' + p.title + ' ---\n' + (p.body_html || '').substring(0, 1000) + '...'));
})
.catch(err => console.error(err));
