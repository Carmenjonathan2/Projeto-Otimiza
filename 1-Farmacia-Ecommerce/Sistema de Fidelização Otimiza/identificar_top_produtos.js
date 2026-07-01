const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN;
const BASE_URL = "https://api.gestaoclick.com";

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

async function identificarTopProdutos() {
    console.log('[INICIO] identificar_top_produtos.js ' + new Date().toISOString());
    
    if (!ACCESS_TOKEN || !SECRET_TOKEN) {
        console.error('[ERRO] identificar_top_produtos.js - Credenciais do GestãoClick não encontradas no .env');
        process.exit(1);
    }

    try {
        console.log('📡 Buscando últimas 100 vendas do GestãoClick...');
        const response = await axios.get(`${BASE_URL}/vendas?limit=100`, { headers });
        const vendas = response.data && response.data.data ? response.data.data : [];
        
        const productRevenue = {};
        let totalRevenue = 0;

        vendas.forEach(venda => {
            const produtos = venda.produtos || [];
            produtos.forEach(pObj => {
                const prod = pObj.produto;
                if (prod && prod.nome_produto) {
                    const nome = prod.nome_produto.trim();
                    const totalProd = parseFloat(prod.valor_total) || 0;
                    
                    if (!productRevenue[nome]) {
                        productRevenue[nome] = 0;
                    }
                    productRevenue[nome] += totalProd;
                    totalRevenue += totalProd;
                }
            });
        });

        const sortedProducts = Object.entries(productRevenue)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a, b) => b.revenue - a.revenue);

        console.log('\n========================================================================');
        console.log(`📊 INTEGRAÇÃO GESTÃOCLICK: CURVA DE PRODUTOS`);
        console.log(`Faturamento Total Analisado (últimas 100 vendas): R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log('========================================================================');
        console.log('🏆 TOP 3 PRODUTOS QUE SUSTENTAM O FATURAMENTO:');
        sortedProducts.slice(0, 3).forEach((prod, index) => {
            const pct = totalRevenue > 0 ? (prod.revenue / totalRevenue * 100).toFixed(2) : 0;
            console.log(`${index + 1}º: ${prod.name} - R$ ${prod.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`);
        });
        console.log('========================================================================\n');

        console.log('[OK] identificar_top_produtos.js ' + new Date().toISOString() + ' Execução concluída com sucesso.');
    } catch (err) {
        console.error('[ERRO] identificar_top_produtos.js - Erro ao chamar GestãoClick API:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

identificarTopProdutos();
