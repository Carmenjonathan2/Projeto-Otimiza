/**
 * NPS pós-compra (D+3).
 *
 * Funcionamento:
 *   1. Pega pedidos pagos do Shopify de 3 dias atrás.
 *   2. Pra cada cliente que ainda não recebeu pesquisa pra esse pedido,
 *      envia WhatsApp pedindo nota 1-5.
 *   3. Marca em `nps_solicitados.json` pra não duplicar.
 *
 * A coleta da resposta acontece no `server_integracao.js`: quando o cliente
 * responde com nota 1-5 e estado tem `aguardando_nps=true`, salva em
 * `nps_respostas.jsonl` e dispara Telegram se nota ≤ 2.
 *
 * Cron sugerido: diário 10:30 BRT.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const whatsappGateway = require('../src/integracoes/whatsapp_gateway');

console.log(`[INICIO] nps_pos_compra.js ${new Date().toISOString()}`);

const SHOP_URL = process.env.SHOPIFY_SHOP_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SOLICITADOS_FILE = path.resolve(__dirname, '../nps_solicitados.json');
const MAX_ENVIOS = parseInt(process.env.NPS_MAX_ENVIOS_DIA || '20', 10);

if (!ACCESS_TOKEN) {
    console.warn("⚠️ SHOPIFY_ACCESS_TOKEN ausente — abortando.");
    process.exit(0);
}

function limparTelefone(tel) {
    let l = String(tel || '').replace(/\D/g, '');
    if (!l) return null;
    if (l.startsWith('55')) return l;
    if (l.length === 10 || l.length === 11) return `55${l}`;
    return l;
}

async function buscarPedidosD3() {
    const fim = new Date();
    fim.setDate(fim.getDate() - 3);
    fim.setHours(23, 59, 59);
    const inicio = new Date(fim);
    inicio.setHours(0, 0, 0);

    const url = `https://${SHOP_URL}/admin/api/2024-01/orders.json?status=any&financial_status=paid&created_at_min=${inicio.toISOString()}&created_at_max=${fim.toISOString()}&limit=250`;
    try {
        const r = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN },
            timeout: 15000
        });
        return r.data.orders || [];
    } catch (e) {
        console.error(`❌ Falha Shopify: ${e.response?.data?.errors || e.message}`);
        return [];
    }
}

async function rodar() {
    let solicitados = {};
    if (fs.existsSync(SOLICITADOS_FILE)) {
        try { solicitados = JSON.parse(fs.readFileSync(SOLICITADOS_FILE, 'utf8')); } catch (_) {}
    }

    const pedidos = await buscarPedidosD3();
    console.log(`📋 ${pedidos.length} pedidos pagos em D-3.`);

    let enviados = 0;
    let pulados = 0;
    let falhas = 0;

    for (const ped of pedidos) {
        if (enviados >= MAX_ENVIOS) break;
        if (solicitados[ped.id]) { pulados++; continue; }

        const tel = limparTelefone(ped.customer?.phone || ped.shipping_address?.phone);
        if (!tel) { pulados++; continue; }
        const nome = (ped.customer?.first_name || '').trim() || 'tudo bem';

        const msg = `Oi ${nome}! 🐾\n\nTrês dias atrás você comprou com a gente. Como foi sua experiência? Responda só com a nota:\n\n*1* = ruim\n*2* = abaixo\n*3* = ok\n*4* = boa\n*5* = ótima\n\nIsso ajuda demais a gente a melhorar!`;
        try {
            await whatsappGateway.enviarMensagemTexto(tel, msg, false);
            solicitados[ped.id] = {
                em: new Date().toISOString(),
                phone: tel,
                pedidoId: ped.id
            };
            fs.writeFileSync(SOLICITADOS_FILE, JSON.stringify(solicitados, null, 2), 'utf8');
            enviados++;
            await new Promise(r => setTimeout(r, 8000 + Math.random() * 4000));
        } catch (e) {
            console.error(`   ❌ +${tel}: ${e.message}`);
            falhas++;
        }
    }

    console.log(`[OK] nps_pos_compra.js ${new Date().toISOString()} — enviados: ${enviados}, pulados: ${pulados}, falhas: ${falhas}`);

    if (enviados > 0 && process.env.TELEGRAM_BOT_TOKEN) {
        const chatId = process.env.TELEGRAM_CHAT_ID
            || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
        if (chatId) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    text: `📊 <b>NPS pós-compra (D+3)</b>\n\nEnviados: ${enviados}\nFalhas: ${falhas}`
                });
            } catch (_) {}
        }
    }
}

rodar().catch(err => {
    console.error(`[ERRO] ${err.message}`);
    process.exit(1);
});
