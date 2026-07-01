/**
 * Histórico de compras do cliente (últimos 12 meses) via Shopify Admin API.
 *
 * Injeta resumo curto no `contextoInjetado` do bot pra personalizar respostas:
 * "Cliente comprou 2x Bravecto (último em 2026-04-01) e 1x V8 (2026-03-15).
 *  Total gasto em 12m: R$ 480. Última compra há 21 dias."
 *
 * Cache TTL configurável (default 1h) por phone — evita lookup repetido em
 * conversas longas.
 */

const axios = require('axios');
require('dotenv').config();

const SHOP_URL = process.env.SHOPIFY_SHOP_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const TTL_MS = parseInt(process.env.HISTORICO_TTL_SECONDS || '3600', 10) * 1000;
const HABILITADO = (process.env.HISTORICO_COMPRAS_ENABLED || 'true') === 'true';
const cache = new Map();

function limparTelefone(tel) {
    if (!tel) return null;
    let l = String(tel).replace(/\D/g, '');
    if (!l) return null;
    if (l.startsWith('55')) return l;
    if (l.length === 10 || l.length === 11) return `55${l}`;
    return l;
}

/**
 * Resume compras do cliente em string curta pronta pra injetar no prompt.
 * Retorna null se desabilitado, sem credenciais ou sem compras.
 */
async function resumirCompras(phone) {
    if (!HABILITADO || !ACCESS_TOKEN || !SHOP_URL) return null;
    const tel = limparTelefone(phone);
    if (!tel) return null;

    // Cache
    const cached = cache.get(tel);
    if (cached && (Date.now() - cached.em) < TTL_MS) return cached.resumo;

    try {
        const desde = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
        // Shopify não filtra por phone direto — busca clientes pelo telefone
        const buscaCli = await axios.get(
            `https://${SHOP_URL}/admin/api/2024-01/customers/search.json?query=phone:+${tel}`,
            { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }, timeout: 8000 }
        );
        const clientes = buscaCli.data?.customers || [];
        if (clientes.length === 0) {
            cache.set(tel, { em: Date.now(), resumo: null });
            return null;
        }
        const customerId = clientes[0].id;

        const pedidosResp = await axios.get(
            `https://${SHOP_URL}/admin/api/2024-01/customers/${customerId}/orders.json?status=any&financial_status=paid&created_at_min=${desde}&limit=50`,
            { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }, timeout: 8000 }
        );
        const pedidos = pedidosResp.data?.orders || [];
        if (pedidos.length === 0) {
            cache.set(tel, { em: Date.now(), resumo: null });
            return null;
        }

        // Agrupar por produto
        const contagem = {};
        let total = 0;
        let ultimaData = null;
        for (const p of pedidos) {
            const t = new Date(p.created_at);
            if (!ultimaData || t > ultimaData) ultimaData = t;
            total += parseFloat(p.total_price || 0);
            for (const item of (p.line_items || [])) {
                const key = item.title || 'Item';
                if (!contagem[key]) contagem[key] = { qtd: 0, ultimo: t };
                contagem[key].qtd += item.quantity || 1;
                if (t > contagem[key].ultimo) contagem[key].ultimo = t;
            }
        }
        const top = Object.entries(contagem)
            .sort((a, b) => b[1].qtd - a[1].qtd)
            .slice(0, 3)
            .map(([nome, info]) => `${info.qtd}x ${nome} (último ${info.ultimo.toISOString().slice(0, 10)})`)
            .join(', ');
        const diasUltima = Math.round((Date.now() - ultimaData.getTime()) / (24 * 60 * 60 * 1000));

        const resumo = `Cliente recorrente: comprou ${top}. Total gasto últimos 12m: R$ ${total.toFixed(2)}. Última compra há ${diasUltima} dias.`;
        cache.set(tel, { em: Date.now(), resumo });
        return resumo;
    } catch (e) {
        console.error(`❌ [HISTORICO] Falha ao buscar pedidos: ${e.response?.data?.errors || e.message}`);
        cache.set(tel, { em: Date.now(), resumo: null });
        return null;
    }
}

function invalidarCache(phone) {
    const tel = limparTelefone(phone);
    if (tel) cache.delete(tel);
}

module.exports = { resumirCompras, invalidarCache };
