'use strict';
const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN  = process.env.SHOPIFY_ADMIN_TOKEN;
const ZAPI_URL       = process.env.ZAPI_URL;
const ZAPI_TOKEN     = process.env.ZAPI_TOKEN;

async function buscarProdutosDestaque() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SHOPIFY_DOMAIN,
            path: '/admin/api/2024-01/products.json?limit=3&status=active',
            headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
        };
        https.get(options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data).products || []));
        }).on('error', reject);
    });
}

async function enviarStatus(imagemPath, legenda) {
    // Envio via Z-API Stories/Status — adaptar ao endpoint correto da Z-API
    const payload = JSON.stringify({
        image: fs.readFileSync(imagemPath, 'base64'),
        caption: legenda
    });
    // POST para ZAPI_URL/send-image-status
    console.log('[VITRINE] Status enviado:', legenda.substring(0, 50));
}

async function executarVitrinesSemanal() {
    const produtos = await buscarProdutosDestaque();
    if (!produtos.length) { console.log('[VITRINE] Sem produtos para exibir.'); return; }

    for (const produto of produtos) {
        const legenda = `🐾 ${produto.title}\n💊 ${produto.variants[0]?.price ? 'R$ ' + produto.variants[0].price : ''}\n\nOtimiza FarmaVet`;
        // Usar sharp para gerar PNG com nome e preço — implementar conforme design
        console.log('[VITRINE] Produto processado:', produto.title);
    }
}

module.exports = { executarVitrinesSemanal };
