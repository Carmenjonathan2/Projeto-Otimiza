/**
 * Aniversário do PET (não do tutor) — emocional e diferenciado.
 *
 * Funcionamento:
 *   1. Lê planilha de pets em `aniversarios_pet_dados.json` (formato simples).
 *   2. Pra cada pet com data de nascimento = hoje (dia/mês), gera Discount Code
 *      único na Shopify (formato AIKA-{NOMEPET}-2026) com validade 7 dias.
 *   3. Manda WhatsApp pelo gateway (respeita canary/silencioso).
 *   4. Marca em `aniversarios_pet_enviados.json` pra não duplicar no mesmo ano.
 *
 * Formato do `aniversarios_pet_dados.json`:
 * {
 *   "pets": [
 *     { "phone": "5531999999999", "nome_tutor": "Carmen", "nome_pet": "Mel", "data_nasc": "DD/MM" }
 *   ]
 * }
 *
 * Cron sugerido: diário 09:00 BRT (workflow `aniversarios.yml`).
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { DateTime } = require('luxon');
require('dotenv').config();

const whatsappGateway = require('../src/integracoes/whatsapp_gateway');

console.log(`[INICIO] aniversarios_pet.js ${new Date().toISOString()}`);

const DADOS_FILE = path.resolve(__dirname, '../aniversarios_pet_dados.json');
const ENVIADOS_FILE = path.resolve(__dirname, '../aniversarios_pet_enviados.json');
const SHOP_URL = process.env.SHOPIFY_SHOP_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DESCONTO_PCT = parseFloat(process.env.ANIVERSARIO_DESCONTO_PCT || '15');

function carregar(arq, fallback) {
    if (!fs.existsSync(arq)) return fallback;
    try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return fallback; }
}

function salvarEnviados(d) {
    fs.writeFileSync(ENVIADOS_FILE, JSON.stringify(d, null, 2), 'utf8');
}

async function gerarCupomShopify(nomePet, phone) {
    if (!ACCESS_TOKEN || !SHOP_URL) {
        console.log(`[CUPOM] Shopify não configurado — usando código manual.`);
        return { codigo: `AIKA-${nomePet.toUpperCase().replace(/\s+/g, '')}-${new Date().getFullYear()}`, externo: false };
    }
    try {
        // 1. Criar Price Rule
        const ano = new Date().getFullYear();
        const titulo = `Aniversário ${nomePet} ${ano} (${phone.slice(-4)})`;
        const validadeFim = DateTime.now().plus({ days: 7 }).toISO();
        const rule = await axios.post(
            `https://${SHOP_URL}/admin/api/2024-01/price_rules.json`,
            { price_rule: {
                title: titulo,
                target_type: 'line_item',
                target_selection: 'all',
                allocation_method: 'across',
                value_type: 'percentage',
                value: `-${DESCONTO_PCT}`,
                customer_selection: 'all',
                starts_at: DateTime.now().toISO(),
                ends_at: validadeFim,
                usage_limit: 1
            }},
            { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }, timeout: 10000 }
        );
        const ruleId = rule.data.price_rule.id;
        const codigo = `AIKA-${nomePet.toUpperCase().replace(/\s+/g, '')}-${ano}`;
        // 2. Vincular Discount Code à Price Rule
        await axios.post(
            `https://${SHOP_URL}/admin/api/2024-01/price_rules/${ruleId}/discount_codes.json`,
            { discount_code: { code: codigo } },
            { headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }, timeout: 10000 }
        );
        console.log(`✅ [CUPOM] Cupom Shopify criado: ${codigo} (${DESCONTO_PCT}% off, 7d)`);
        return { codigo, externo: true, validade: validadeFim };
    } catch (e) {
        console.error(`❌ [CUPOM] Falha ao criar cupom: ${e.response?.data?.errors || e.message}`);
        return { codigo: `AIKA-${nomePet.toUpperCase().replace(/\s+/g, '')}-${new Date().getFullYear()}`, externo: false };
    }
}

function limparTelefone(tel) {
    let l = String(tel || '').replace(/\D/g, '');
    if (!l) return null;
    if (l.startsWith('55')) return l;
    if (l.length === 10 || l.length === 11) return `55${l}`;
    return l;
}

async function rodar() {
    const dados = carregar(DADOS_FILE, { pets: [] });
    const enviados = carregar(ENVIADOS_FILE, {});
    const hoje = DateTime.now().setZone('America/Sao_Paulo');
    const hojeChave = `${hoje.day}/${hoje.month}`;
    const anoChave = hoje.year;

    const aniversariantes = (dados.pets || []).filter(p => {
        if (!p.data_nasc) return false;
        const [d, m] = p.data_nasc.split('/').map(Number);
        return d === hoje.day && m === hoje.month;
    });

    if (aniversariantes.length === 0) {
        console.log(`ℹ️ Nenhum pet faz aniversário hoje (${hojeChave}).`);
        process.exit(0);
    }

    console.log(`🎂 ${aniversariantes.length} pets fazem aniversário hoje.`);
    let sucessos = 0;
    let pulados = 0;
    let falhas = 0;

    for (const pet of aniversariantes) {
        const phone = limparTelefone(pet.phone);
        if (!phone) { console.warn(`⚠️ Phone inválido: ${pet.phone}`); falhas++; continue; }

        const chave = `${phone}_${pet.nome_pet}_${anoChave}`;
        if (enviados[chave]) {
            console.log(`⏭️ ${pet.nome_pet} (${phone}) já recebeu este ano. Pulando.`);
            pulados++;
            continue;
        }

        const cupom = await gerarCupomShopify(pet.nome_pet, phone);
        const validadeTxt = cupom.validade
            ? DateTime.fromISO(cupom.validade).setZone('America/Sao_Paulo').toFormat("dd 'de' LLLL")
            : '7 dias';
        const msg = `🎂 Hoje é aniversário do *${pet.nome_pet}*! 🐾\n\n` +
            `Pra comemorar, ${pet.nome_tutor || 'tutor'}, fizemos um cupom só pra vocês:\n\n` +
            `*${cupom.codigo}* — ${DESCONTO_PCT}% off na próxima compra (válido até ${validadeTxt}).\n\n` +
            `Parabéns pra ele(a) de toda a equipe Otimiza! 💜`;

        try {
            await whatsappGateway.enviarMensagemTexto(phone, msg, false);
            enviados[chave] = { em: new Date().toISOString(), cupom: cupom.codigo };
            salvarEnviados(enviados);
            sucessos++;
            await new Promise(r => setTimeout(r, 10000));
        } catch (e) {
            console.error(`❌ Falhou pra ${pet.nome_pet}: ${e.message}`);
            falhas++;
        }
    }

    console.log(`[OK] aniversarios_pet.js ${new Date().toISOString()} — sucessos: ${sucessos}, pulados: ${pulados}, falhas: ${falhas}`);

    if (sucessos > 0 && process.env.TELEGRAM_BOT_TOKEN) {
        const chatId = process.env.TELEGRAM_CHAT_ID
            || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
        if (chatId) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    parse_mode: 'HTML',
                    text: `🎂 <b>Aniversários do pet</b>\n\nEnviados: ${sucessos}\nFalhas: ${falhas}\nPulados: ${pulados}`
                });
            } catch (_) {}
        }
    }
}

rodar().catch(err => {
    console.error(`[ERRO] ${err.message}`);
    process.exit(1);
});
