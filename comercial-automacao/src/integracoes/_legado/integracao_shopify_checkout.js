/**
 * Geração de Draft Order no Shopify → link de checkout pré-preenchido.
 *
 * Quando bot detecta compra B2C confirmada (palavras-gatilho já existentes
 * no server: "quero", "vou levar", "fecha"), em vez de só mandar o Pix e
 * empurrar pro Kyenner, gera um link de checkout do Shopify direto.
 *
 * Tabela `mapa_produto_variant.json` faz o de/para nome → variant_id.
 * Se o produto não tá mapeado, retorna null e o fluxo cai no Pix tradicional.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const SHOP_URL = process.env.SHOPIFY_SHOP_URL || "49mbh1-kp.myshopify.com";
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const MAPA_FILE = path.resolve(__dirname, '../../diretrizes-e-branding/mapa_produto_variant.json');
const CHECKOUT_ENABLED = (process.env.SHOPIFY_CHECKOUT_ENABLED || 'false') === 'true';

let mapaCache = null;
function carregarMapa() {
    if (mapaCache) return mapaCache;
    try {
        if (fs.existsSync(MAPA_FILE)) {
            mapaCache = JSON.parse(fs.readFileSync(MAPA_FILE, 'utf8'));
            return mapaCache;
        }
    } catch (e) {
        console.error(`❌ [CHECKOUT] Falha ao ler mapa: ${e.message}`);
    }
    return { produtos: [] };
}

function buscarVariantId(nomeProduto) {
    const mapa = carregarMapa();
    const nomeLower = (nomeProduto || '').toLowerCase();
    for (const p of (mapa.produtos || [])) {
        if (p.match.some(m => nomeLower.includes(m))) return p.variant_id;
    }
    return null;
}

/**
 * Gera link de checkout Shopify pré-preenchido com o produto + telefone.
 * @returns {Promise<string|null>} URL ou null se falhou/desativado
 */
async function gerarLinkCheckout({ nomeProduto, phone, clientName }) {
    if (!CHECKOUT_ENABLED) return null;
    if (!ACCESS_TOKEN) {
        console.warn("⚠️ [CHECKOUT] SHOPIFY_ACCESS_TOKEN não configurado.");
        return null;
    }

    const variantId = buscarVariantId(nomeProduto);
    if (!variantId) {
        console.log(`[CHECKOUT] '${nomeProduto}' não tem variant_id mapeado — pulando.`);
        return null;
    }

    const payload = {
        draft_order: {
            line_items: [{ variant_id: variantId, quantity: 1 }],
            note: `Pedido via bot WhatsApp Otimiza. Cliente: ${clientName || 'n/a'}. Phone: +${phone}.`,
            tags: "whatsapp-bot,checkout-direto",
            customer: phone ? { phone: `+${phone}` } : undefined
        }
    };

    try {
        const r = await axios.post(
            `https://${SHOP_URL}/admin/api/2024-01/draft_orders.json`,
            payload,
            { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }, timeout: 8000 }
        );
        const invoiceUrl = r.data?.draft_order?.invoice_url;
        if (invoiceUrl) {
            console.log(`✅ [CHECKOUT] Draft Order ${r.data.draft_order.id} criado. URL: ${invoiceUrl}`);
            return invoiceUrl;
        }
        return null;
    } catch (e) {
        console.error(`❌ [CHECKOUT] Falha ao criar Draft Order: ${e.response?.data?.errors || e.message}`);
        return null;
    }
}

module.exports = {
    gerarLinkCheckout,
    buscarVariantId
};
