const axios = require('axios');
require('dotenv').config();

const SHOP_URL = process.env.SHOPIFY_SHOP_URL || "otimizafarmavet.myshopify.com";
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "MOCK_SHOPIFY_TOKEN";

const headers = {
    'X-Shopify-Access-Token': ACCESS_TOKEN,
    'Content-Type': 'application/json'
};

// Dados Mockados de Fallback (para produtos com estoque físico próprio)
const MOCK_DATA = {
    "librela 15mg": { quantidade: 8, preco: 380.00 },
    "cytopoint": { quantidade: 5, preco: 450.00 },
    "simparic 10mg": { quantidade: 14, preco: 104.50 },
    "metilforan": { quantidade: 12, preco: 180.00 }
};

// Produtos disponíveis via PEDIDO ESPECIAL ao fornecedor
// A Otimiza NÃO mantém estoque físico desses produtos — fazemos o pedido ao fornecedor assim que o cliente confirma.
// Para o bot e o cliente, esses produtos aparecem sempre como DISPONÍVEIS (com prazo de entrega informado).
const PRODUTOS_PEDIDO_ESPECIAL = {
    "librela":      { preco: 380.00, prazo: "1 a 2 dias úteis" },
    "librela 15mg": { preco: 380.00, prazo: "1 a 2 dias úteis" },
    "cytopoint":    { preco: 450.00, prazo: "1 a 2 dias úteis" },
    "cytopoint 15mg": { preco: 450.00, prazo: "1 a 2 dias úteis" },
    "cytopoint 30mg": { preco: 580.00, prazo: "1 a 2 dias úteis" },
};

const fs = require('fs');
const path = require('path');

/**
 * Consulta a disponibilidade e o preço de um produto.
 * Para produtos de PEDIDO ESPECIAL, retorna disponível via fornecedor (sem mostrar "estoque zerado").
 * Para produtos próprios, consulta o arquivo local do GestãoClick com fallback para MOCK_DATA.
 */
async function consultarEstoque(nomeProduto) {
    console.log(`[PRODUTOS] Consultando disponibilidade para: "${nomeProduto}"...`);

    // Verificar primeiro se é produto de PEDIDO ESPECIAL (sem estoque físico próprio)
    const nomeLower = nomeProduto.toLowerCase();
    const chaveEspecial = Object.keys(PRODUTOS_PEDIDO_ESPECIAL).find(k => nomeLower.includes(k) || k.includes(nomeLower));
    if (chaveEspecial) {
        const infoEspecial = PRODUTOS_PEDIDO_ESPECIAL[chaveEspecial];
        console.log(`📦 [PRODUTOS] '${nomeProduto}' é PEDIDO ESPECIAL. Prazo: ${infoEspecial.prazo} | Preço: R$ ${infoEspecial.preco}`);
        return {
            quantidade: 999,                 // sentinel: sempre disponível via fornecedor
            preco: infoEspecial.preco,
            tipo: 'pedido_especial',
            prazo: infoEspecial.prazo
        };
    }

    // Para produtos com estoque físico próprio: consulta o arquivo local do GestãoClick
    try {
        const filePath = path.resolve(__dirname, '../../../1-Farmacia-Ecommerce/Sistema de Fidelização Otimiza/estoque_limpo_gestaoclick.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const term = nomeProduto.toLowerCase();
            
            // Buscar correspondência exata ou parcial no nome
            const match = data.find(p => p.Nome && p.Nome.toLowerCase().includes(term));
            if (match) {
                // Formatar valores numéricos do GestãoClick (ex: "65,85" -> 65.85)
                const preco = parseFloat(match.Valor.replace(/\./g, '').replace(',', '.'));
                const quantidade = parseFloat(match.Estoque.replace(/\./g, '').replace(',', '.'));
                
                console.log(`🎯 [PRODUTOS] Produto localizado no GestãoClick: "${match.Nome}" | Preço: R$ ${preco} | Estoque: ${quantidade}`);
                return {
                    quantidade: isNaN(quantidade) ? 0 : quantidade,
                    preco: isNaN(preco) ? 0.00 : preco
                };
            }
        }
    } catch (e) {
        console.warn(`⚠️ [PRODUTOS] Erro ao ler estoque local do GestãoClick (${e.message}). Ativando fallback.`);
    }

    // Fallback padrão se não encontrar ou arquivo falhar
    const key = nomeProduto.toLowerCase();
    return MOCK_DATA[key] || { quantidade: 0, preco: 0.00 };
}

/**
 * Cria um Pedido Rascunho (Draft Order) na Shopify para separar os produtos.
 */
async function criarPedidoRascunho(cliente, itens) {
    console.log(`[SHOPIFY] Criando pedido rascunho para ${cliente.nome}...`);

    if (ACCESS_TOKEN === "MOCK_SHOPIFY_TOKEN") {
        return {
            id: "draft_123456",
            invoice_url: "https://checkout.shopify.com/draft/invoice",
            total_price: 350.00
        };
    }

    try {
        const lineItems = itens.map(i => ({
            title: i.nome,
            price: i.preco,
            quantity: i.quantidade
        }));

        const payload = {
            draft_order: {
                line_items: lineItems,
                customer: {
                    first_name: cliente.nome,
                    phone: cliente.telefone
                },
                shipping_address: {
                    first_name: cliente.nome,
                    address1: cliente.endereco,
                    zip: cliente.cep
                }
            }
        };

        const response = await axios.post(`https://${SHOP_URL}/admin/api/2024-01/draft_orders.json`, payload, { headers });
        return {
            id: response.data.draft_order.id,
            invoice_url: response.data.draft_order.invoice_url,
            total_price: parseFloat(response.data.draft_order.total_price)
        };
    } catch (e) {
        console.warn(`⚠️ [SHOPIFY] Erro ao criar rascunho de pedido (${e.message}). Ativando fallback de teste.`);
        return {
            id: "draft_fallback_123",
            invoice_url: "https://checkout.shopify.com/draft/invoice_fallback",
            total_price: itens.reduce((acc, i) => acc + (i.preco * i.quantidade), 0)
        };
    }
}

module.exports = {
    consultarEstoque,
    criarPedidoRascunho
};
