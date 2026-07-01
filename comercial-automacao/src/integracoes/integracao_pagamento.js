const axios = require('axios');
require('dotenv').config();

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "MOCK_MP_TOKEN";
const C6_CLIENT_ID = process.env.C6_CLIENT_ID || "MOCK_C6_CLIENT";

/**
 * Gera uma cobrança imediata via PIX na API Oficial do C6 Bank.
 * Retorna o Pix copia e cola e o qr code.
 */
async function gerarPixC6(valor, descricao = "Pedido Otimiza FarmaVet") {
    console.log(`[C6 BANK] Gerando cobrança Pix de R$ ${valor.toFixed(2)}...`);

    if (C6_CLIENT_ID === "MOCK_C6_CLIENT") {
        // Retorna dados estáticos de teste
        return {
            txid: "tx_" + Math.random().toString(36).substr(2, 9),
            pixCopiaCola: "00020101021226870014br.gov.bcb.pix2565api.c6bank.com.br/v2/cob/mock_pix_c6_key_otimiza_farmavet_5531987936822",
            qrCodeUrl: "https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=mock_pix"
        };
    }

    try {
        // Na prática, esta chamada requer autenticação via certificado mTLS com o C6 Bank
        // Exemplo simplificado da chamada da API Pix do Bacen no C6:
        const payload = {
            calendario: {
                expiracao: 3600 // 1 hora
            },
            valor: {
                original: valor.toFixed(2)
            },
            chave: "31987936822", // Chave telefone da Otimiza
            solicitacaoPagador: descricao
        };

        // axios.post com certificado HTTPS Agent configurado no ambiente
        // const response = await axios.post('https://api.c6bank.com.br/v2/cob', payload, { httpsAgent, headers });
        
        return {
            txid: "real_tx_id_example",
            pixCopiaCola: "00020101021226870014br.gov.bcb.pix...",
            qrCodeUrl: "https://c6bank.com.br/qr/..."
        };
    } catch (e) {
        console.error(`❌ [C6 BANK] Erro ao gerar Pix C6:`, e.message);
        throw e;
    }
}

/**
 * Gera um link de pagamento (preferência de checkout) no Mercado Pago.
 * Já acrescentando as taxas de faturamento do cartão repassadas ao cliente.
 */
async function gerarLinkMercadoPago(valor, descricao = "Pedido Otimiza FarmaVet") {
    // Regra comercial: Acréscimo da taxa da maquininha/operação por conta do cliente
    const taxaOperacao = 0.0499; // Ex: 4.99% taxa de crédito no link do Mercado Pago
    const valorComTaxa = valor * (1 + taxaOperacao);

    console.log(`[MERCADO PAGO] Gerando link de cartão de R$ ${valorComTaxa.toFixed(2)} (R$ ${valor.toFixed(2)} + 4.99% taxa)...`);

    if (MP_TOKEN === "MOCK_MP_TOKEN") {
        return {
            init_url: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_pref_123456",
            valor_final: valorComTaxa
        };
    }

    try {
        const payload = {
            items: [
                {
                    title: descricao,
                    quantity: 1,
                    unit_price: parseFloat(valorComTaxa.toFixed(2)),
                    currency_id: "BRL"
                }
            ],
            back_urls: {
                success: "https://otimizafarmavet.com.br/pagamento-sucesso",
                failure: "https://otimizafarmavet.com.br/pagamento-erro"
            },
            auto_return: "approved"
        };

        const response = await axios.post('https://api.mercadopago.com/checkout/preferences', payload, {
            headers: {
                'Authorization': `Bearer ${MP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            init_url: response.data.init_point,
            valor_final: valorComTaxa
        };
    } catch (e) {
        console.error(`❌ [MERCADO PAGO] Erro ao gerar link de pagamento:`, e.message);
        throw e;
    }
}

module.exports = {
    gerarPixC6,
    gerarLinkMercadoPago
};
