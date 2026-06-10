const express = require('express');
const bodyParser = require('body-parser');
const snc = require('../0-Central-SNC/src/snc/snc_core');
const aika = require('../0-Central-SNC/src/personas/aika/aika_ltv');

const app = express();
app.use(bodyParser.json());

// ============================================
// OTIMIZA FARMAVET - WEBHOOKS SHOPIFY
// ============================================

app.post('/webhook/carrinho-abandonado', (req, res) => {
    const carrinho = req.body;
    console.log(`[SHOPIFY] Carrinho abandonado recebido: ${carrinho.id}`);

    // Em vez de focar em desconto (frieza), usamos a Aika para acolher (SNC)
    const telefone = carrinho.customer?.phone || carrinho.shipping_address?.phone;
    if (telefone) {
        // Dispara mensagem através do módulo da Aika, que passa pelo SNC
        // Exemplo: aika.dispararRecuperacaoCarrinho(carrinho.customer.first_name, telefone);
        snc.log(`Gatilho de carrinho abandonado ativado para o cliente ${carrinho.customer?.first_name}`);
    }

    res.status(200).send('OK');
});

app.post('/webhook/pedido-pago', (req, res) => {
    const pedido = req.body;
    console.log(`[SHOPIFY] Pedido pago recebido: ${pedido.id}`);

    // Verifica se há itens de uso contínuo (Chronics Case)
    const itensContinuos = pedido.line_items.filter(i => i.name.toLowerCase().includes('cytopoint') || i.name.toLowerCase().includes('librela'));
    
    if (itensContinuos.length > 0) {
        snc.log(`Item de uso contínuo detectado. Agendando Recompra (LTV) para o pedido ${pedido.id}.`);
        // Registra na base de dados para o comando_central engatilhar no 25º dia
    }

    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Webhooks Shopify (SNC Ativo) rodando na porta ${PORT}`);
});
