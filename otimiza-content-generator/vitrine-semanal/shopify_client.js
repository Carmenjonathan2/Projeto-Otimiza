const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

if (!STORE || !TOKEN || TOKEN.includes('PREENCHER')) {
    throw new Error('SHOPIFY_STORE e SHOPIFY_ADMIN_TOKEN devem estar configurados em .env (raiz do repo).');
}

const api = axios.create({
    baseURL: `https://${STORE}/admin/api/${VERSION}`,
    headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

async function listarProdutos({ limit = 250, status = 'active' } = {}) {
    const todos = [];
    let url = `/products.json?limit=${limit}&status=${status}`;
    while (url) {
        const r = await api.get(url);
        todos.push(...r.data.products);
        const link = r.headers.link;
        const next = link && link.match(/<([^>]+)>; rel="next"/);
        url = next ? next[1].replace(api.defaults.baseURL, '') : null;
    }
    return todos;
}

async function listarPedidos({ status = 'any', dias = 90 } = {}) {
    const desde = new Date(Date.now() - dias * 86400000).toISOString();
    const todos = [];
    let url = `/orders.json?status=${status}&created_at_min=${desde}&limit=250&fields=id,line_items,total_price,created_at,financial_status`;
    while (url) {
        const r = await api.get(url);
        todos.push(...r.data.orders);
        const link = r.headers.link;
        const next = link && link.match(/<([^>]+)>; rel="next"/);
        url = next ? next[1].replace(api.defaults.baseURL, '') : null;
    }
    return todos;
}

async function rankearMaisVendidos(diasJanela = 90) {
    const pedidos = await listarPedidos({ status: 'any', dias: diasJanela });
    const ranking = {};
    pedidos.forEach(o => {
        if (o.financial_status !== 'paid' && o.financial_status !== 'partially_paid') return;
        o.line_items.forEach(li => {
            const id = li.product_id;
            if (!id) return;
            if (!ranking[id]) ranking[id] = { product_id: id, titulo: li.title, qtd: 0, receita: 0 };
            ranking[id].qtd += li.quantity;
            ranking[id].receita += parseFloat(li.price) * li.quantity;
        });
    });
    return Object.values(ranking).sort((a, b) => b.qtd - a.qtd);
}

async function listarColecoes() {
    const r = await api.get('/custom_collections.json?limit=250');
    const s = await api.get('/smart_collections.json?limit=250');
    return [...r.data.custom_collections, ...s.data.smart_collections];
}

async function gerarCupomUnico({ codigo, percentual, validadeDias = 7 }) {
    const expira = new Date(Date.now() + validadeDias * 86400000).toISOString();
    const regra = await api.post('/price_rules.json', {
        price_rule: {
            title: codigo,
            target_type: 'line_item',
            target_selection: 'all',
            allocation_method: 'across',
            value_type: 'percentage',
            value: `-${percentual}`,
            customer_selection: 'all',
            starts_at: new Date().toISOString(),
            ends_at: expira,
            usage_limit: 1
        }
    });
    const cupom = await api.post(`/price_rules/${regra.data.price_rule.id}/discount_codes.json`, {
        discount_code: { code: codigo }
    });
    return cupom.data.discount_code;
}

module.exports = {
    api,
    listarProdutos,
    listarPedidos,
    rankearMaisVendidos,
    listarColecoes,
    gerarCupomUnico
};
