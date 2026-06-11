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
 * Busca um produto no JSON local do GestãoClick por nome.
 * Suporta a convenção de produto duplicado para precificação B2B vs B2C:
 *
 *   Convenção no GestãoClick (definida com o Kyenner):
 *   - Versão B2C (tutor):       "Librela 15mg tutor"  ou  "Librela 15mg preço para tutor"
 *   - Versão B2B (veterinário): "Librela 15mg veterinário"  ou  "Librela 15mg preço para veterinário"
 *
 * Se não achar a variante específica, cai no nome genérico (sem sufixo).
 */
function buscarNoProdutosGC(data, nomeProduto, tipoCliente = 'B2C') {
    const term = nomeProduto.toLowerCase().trim();

    if (tipoCliente === 'B2B') {
        // Tentar sufixos B2B em ordem de prioridade (convenção Kyenner → alternativas)
        const sufixosB2B = [
            ' preço para veterinário',
            ' preço veterinário',
            ' para veterinário',
            ' veterinário',
            ' veterinario',
            ' vet',
            ' b2b',
            ' atacado'
        ];
        for (const sufixo of sufixosB2B) {
            const matchB2B = data.find(p =>
                p.Nome && p.Nome.toLowerCase().includes(term + sufixo)
            );
            if (matchB2B) {
                console.log(`🏷️ [PRODUTOS] Variante B2B encontrada: "${matchB2B.Nome}"`);
                return matchB2B;
            }
        }
    } else {
        // Tentar sufixos B2C em ordem de prioridade
        const sufixosB2C = [
            ' preço para tutor',
            ' preço tutor',
            ' para tutor',
            ' tutor'
        ];
        for (const sufixo of sufixosB2C) {
            const matchB2C = data.find(p =>
                p.Nome && p.Nome.toLowerCase().includes(term + sufixo)
            );
            if (matchB2C) {
                console.log(`🏷️ [PRODUTOS] Variante B2C (tutor) encontrada: "${matchB2C.Nome}"`);
                return matchB2C;
            }
        }
    }

    // Fallback: nome genérico sem sufixo
    return data.find(p => p.Nome && p.Nome.toLowerCase().includes(term)) || null;
}


/**
 * Consulta a disponibilidade e o preço de um produto.
 * Suporta precificação diferenciada B2B vs B2C via produto duplicado no GestãoClick.
 * Para PEDIDO ESPECIAL (Librela, Cytopoint): tenta GestãoClick primeiro, fallback no mapa fixo.
 * Para estoque próprio: consulta GestãoClick com consciência de tipo de cliente.
 *
 * @param {string} nomeProduto - Nome do produto a consultar
 * @param {string} tipoCliente - "B2B" (veterinário) ou "B2C" (tutor). Default: "B2C"
 */
async function consultarEstoque(nomeProduto, tipoCliente = 'B2C') {
    console.log(`[PRODUTOS] Consultando "${nomeProduto}" para ${tipoCliente}...`);

    const nomeLower = nomeProduto.toLowerCase();

    // ─── Passo 1: Verificar se é PEDIDO ESPECIAL ──────────────────────────
    const chaveEspecial = Object.keys(PRODUTOS_PEDIDO_ESPECIAL).find(
        k => nomeLower.includes(k) || k.includes(nomeLower)
    );

    if (chaveEspecial) {
        const infoEspecial = PRODUTOS_PEDIDO_ESPECIAL[chaveEspecial];

        // Tentar buscar preço atualizado no GestãoClick antes de usar o valor fixo
        try {
            const filePath = path.resolve(__dirname, '../../../1-Farmacia-Ecommerce/Sistema de Fidelização Otimiza/estoque_limpo_gestaoclick.json');
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const match = buscarNoProdutosGC(data, nomeProduto, tipoCliente);
                if (match) {
                    const precoGC = parseFloat(match.Valor.replace(/\./g, '').replace(',', '.'));
                    if (!isNaN(precoGC) && precoGC > 0) {
                        console.log(`📦 [PRODUTOS] '${nomeProduto}' é PEDIDO ESPECIAL. Preço GestãoClick (${tipoCliente}): R$ ${precoGC} | Prazo: ${infoEspecial.prazo}`);
                        return { quantidade: 999, preco: precoGC, tipo: 'pedido_especial', prazo: infoEspecial.prazo };
                    }
                }
            }
        } catch (e) { /* silencioso: usa fallback abaixo */ }

        // Fallback: valor fixo do mapa
        console.log(`📦 [PRODUTOS] '${nomeProduto}' é PEDIDO ESPECIAL (preço fixo). Prazo: ${infoEspecial.prazo} | Preço: R$ ${infoEspecial.preco}`);
        return { quantidade: 999, preco: infoEspecial.preco, tipo: 'pedido_especial', prazo: infoEspecial.prazo };
    }

    // ─── Passo 2: Produto com estoque físico → GestãoClick ────────────────
    try {
        const filePath = path.resolve(__dirname, '../../../1-Farmacia-Ecommerce/Sistema de Fidelização Otimiza/estoque_limpo_gestaoclick.json');
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const match = buscarNoProdutosGC(data, nomeProduto, tipoCliente);

            if (match) {
                const preco    = parseFloat(match.Valor.replace(/\./g, '').replace(',', '.'));
                const quantidade = parseFloat(match.Estoque.replace(/\./g, '').replace(',', '.'));
                console.log(`🎯 [PRODUTOS] GestãoClick: "${match.Nome}" | R$ ${preco} | ${quantidade} un`);
                return {
                    quantidade: isNaN(quantidade) ? 0 : quantidade,
                    preco:      isNaN(preco)       ? 0.00 : preco
                };
            }
        }
    } catch (e) {
        console.warn(`⚠️ [PRODUTOS] Erro ao ler GestãoClick (${e.message}). Ativando fallback.`);
    }

    // ─── Passo 3: Fallback MOCK (desenvolvimento/testes) ──────────────────
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
