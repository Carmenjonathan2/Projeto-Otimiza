const axios = require('axios');
const fs = require('fs');
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

// Configurable limits
const MAX_PAGES = 15; // Fetches up to 1500 sales
const SALES_PER_PAGE = 100;

async function runAnalysis() {
    console.log(`🚀 [ANALISE] Iniciando extração e análise de vendas do GestãoClick...`);
    
    if (!ACCESS_TOKEN || !SECRET_TOKEN) {
        console.error('❌ [ERRO] Credenciais do GestãoClick não encontradas no arquivo .env.');
        process.exit(1);
    }

    let allSales = [];
    let page = 1;
    let keepFetching = true;

    while (keepFetching && page <= MAX_PAGES) {
        console.log(`📡 Buscando página ${page} de vendas (limite ${SALES_PER_PAGE})...`);
        try {
            const response = await axios.get(`${BASE_URL}/vendas?limit=${SALES_PER_PAGE}&page=${page}`, { headers });
            const salesPage = response.data && response.data.data ? response.data.data : [];
            
            if (salesPage.length === 0) {
                console.log(`ℹ️ Página ${page} vazia. Fim da paginação.`);
                keepFetching = false;
                break;
            }

            allSales.push(...salesPage);
            console.log(`✅ Adicionadas ${salesPage.length} vendas da página ${page}. (Total acumulado: ${allSales.length})`);
            
            if (salesPage.length < SALES_PER_PAGE) {
                console.log(`ℹ️ Página ${page} retornou menos registros que o limite (${salesPage.length} < ${SALES_PER_PAGE}). Fim da paginação.`);
                keepFetching = false;
                break;
            }

            page++;
            // Small sleep to avoid hitting API rate limits too hard
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
            console.error(`❌ [ERRO] Falha ao buscar página ${page}:`, err.message);
            keepFetching = false;
        }
    }

    if (allSales.length === 0) {
        console.error('❌ [ERRO] Nenhuma venda pôde ser recuperada da API do GestãoClick.');
        process.exit(1);
    }

    // Filter sales to exclude cancelled ones
    const activeSales = allSales.filter(v => {
        const sit = (v.nome_situacao || '').toLowerCase();
        return !sit.includes('cancelad') && !sit.includes('excluid');
    });

    console.log(`📊 Total de vendas recuperadas: ${allSales.length}`);
    console.log(`🟢 Vendas ativas consideradas para análise: ${activeSales.length}`);

    // Date range of the analysis
    let oldestDate = null;
    let newestDate = null;
    activeSales.forEach(v => {
        if (v.data) {
            if (!oldestDate || v.data < oldestDate) oldestDate = v.data;
            if (!newestDate || v.data > newestDate) newestDate = v.data;
        }
    });

    // Process products
    const productStats = {};
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalQuantity = 0;

    activeSales.forEach(venda => {
        const produtos = venda.produtos || [];
        produtos.forEach(pObj => {
            const prod = pObj.produto;
            if (prod && prod.nome_produto) {
                const id = prod.produto_id;
                const nome = prod.nome_produto.trim();
                const qtd = parseFloat(prod.quantidade) || 0;
                const valorVendaUnitario = parseFloat(prod.valor_venda) || 0;
                const valorCustoUnitario = parseFloat(prod.valor_custo) || 0;
                const valorTotalProd = parseFloat(prod.valor_total) || 0;
                
                // Calculate cost and profit for this line item
                const custoTotalProd = valorCustoUnitario * qtd;
                const lucroTotalProd = valorTotalProd - custoTotalProd;

                if (!productStats[id]) {
                    productStats[id] = {
                        id,
                        nome,
                        quantidade: 0,
                        faturamento: 0,
                        custo: 0,
                        lucro: 0,
                        transacoes: 0
                    };
                }

                productStats[id].quantidade += qtd;
                productStats[id].faturamento += valorTotalProd;
                productStats[id].custo += custoTotalProd;
                productStats[id].lucro += lucroTotalProd;
                productStats[id].transacoes += 1;

                totalRevenue += valorTotalProd;
                totalCost += custoTotalProd;
                totalProfit += lucroTotalProd;
                totalQuantity += qtd;
            }
        });
    });

    const productsList = Object.values(productStats);

    // Calculate Curva ABC by Revenue (Faturamento)
    const sortedByRevenue = [...productsList].sort((a, b) => b.faturamento - a.faturamento);
    let cumulativeRevenue = 0;
    sortedByRevenue.forEach(p => {
        cumulativeRevenue += p.faturamento;
        p.pctRevenue = totalRevenue > 0 ? (p.faturamento / totalRevenue) * 100 : 0;
        p.cumulativePctRevenue = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
        
        if (p.cumulativePctRevenue <= 70.01) {
            p.classeRevenue = 'A';
        } else if (p.cumulativePctRevenue <= 90.01) {
            p.classeRevenue = 'B';
        } else {
            p.classeRevenue = 'C';
        }
    });

    // Calculate Curva ABC by Gross Profit (Lucro)
    const sortedByProfit = [...productsList].sort((a, b) => b.lucro - a.lucro);
    let cumulativeProfit = 0;
    sortedByProfit.forEach(p => {
        cumulativeProfit += p.lucro;
        p.pctProfit = totalProfit > 0 ? (p.lucro / totalProfit) * 100 : 0;
        p.cumulativePctProfit = totalProfit > 0 ? (cumulativeProfit / totalProfit) * 100 : 0;

        if (p.cumulativePctProfit <= 70.01) {
            p.classeProfit = 'A';
        } else if (p.cumulativePctProfit <= 90.01) {
            p.classeProfit = 'B';
        } else {
            p.classeProfit = 'C';
        }
    });

    // Sort by Quantity (Volume)
    const sortedByQuantity = [...productsList].sort((a, b) => b.quantidade - a.quantidade);

    // Build the Markdown Report
    let md = `# 📊 Relatório GIO - Análise Curva ABC de Produtos\n\n`;
    md += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n`;
    md += `*Período analisado: ${oldestDate ? oldestDate.split('-').reverse().join('/') : 'N/A'} a ${newestDate ? newestDate.split('-').reverse().join('/') : 'N/A'}*\n`;
    md += `*Total de vendas consideradas: ${activeSales.length} transações*\n\n`;

    md += `## 💰 Resumo Financeiro Geral\n`;
    md += `| Métrica | Valor | % sobre Vendas |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| **Faturamento Total (Receita Bruta)** | R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 100.00% |\n`;
    md += `| **Custo das Mercadorias Vendidas (CMV)** | R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ${(totalRevenue > 0 ? (totalCost / totalRevenue * 100) : 0).toFixed(2)}% |\n`;
    md += `| **Lucro Bruto (Margem de Contribuição)** | R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | ${(totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0).toFixed(2)}% |\n`;
    md += `| **Volume Total de Itens Vendidos** | ${totalQuantity.toLocaleString('pt-BR')} un | - |\n\n`;

    md += `## 🏆 Curva ABC por Faturamento (Os que mais faturam)\n`;
    md += `*Esta curva mostra quais produtos trazem mais receita bruta para a empresa. A **Classe A** representa os primeiros 70% de todo o faturamento.*\n\n`;
    md += `| Rank | Produto | Classe | Qtd Vendida | Faturamento | % Part. | % Acum. | Preço Médio | Custo Médio | Margem Unit. % |\n`;
    md += `| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- | :--- | :---: |\n`;

    sortedByRevenue.slice(0, 30).forEach((p, idx) => {
        const precoMedio = p.quantidade > 0 ? (p.faturamento / p.quantidade) : 0;
        const custoMedio = p.quantidade > 0 ? (p.custo / p.quantidade) : 0;
        const margemPct = precoMedio > 0 ? ((precoMedio - custoMedio) / precoMedio * 100) : 0;

        md += `| ${idx + 1} | ${p.nome} | **${p.classeRevenue}** | ${p.quantidade.toFixed(0)} | R$ ${p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${p.pctRevenue.toFixed(2)}% | ${p.cumulativePctRevenue.toFixed(2)}% | R$ ${precoMedio.toFixed(2)} | R$ ${custoMedio.toFixed(2)} | ${margemPct.toFixed(1)}% |\n`;
    });

    md += `\n*(Exibindo os top 30 produtos ordenados por faturamento)*\n\n`;

    md += `## 📈 Curva ABC por Margem de Lucro Bruto (Os que mais lucram)\n`;
    md += `*Esta curva mostra os produtos que geram o maior lucro bruto (faturamento - CMV). Muitas vezes, um produto Classe B ou C de faturamento pode ser Classe A de lucro por ter margens muito mais altas.*\n\n`;
    md += `| Rank | Produto | Classe Lucro | Lucro Bruto | Faturamento | Margem Bruta % | Qtd | % Part. Lucro | % Acum. Lucro |\n`;
    md += `| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: | :---: |\n`;

    sortedByProfit.slice(0, 20).forEach((p, idx) => {
        const margemBrutaPct = p.faturamento > 0 ? (p.lucro / p.faturamento * 100) : 0;
        md += `| ${idx + 1} | ${p.nome} | **${p.classeProfit}** | R$ ${p.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | R$ ${p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${margemBrutaPct.toFixed(1)}% | ${p.quantidade.toFixed(0)} | ${p.pctProfit.toFixed(2)}% | ${p.cumulativePctProfit.toFixed(2)}% |\n`;
    });

    md += `\n*(Exibindo os top 20 produtos ordenados por lucro bruto)*\n\n`;

    md += `## 📦 Top 20 por Volume de Vendas (Os mais populares)\n`;
    md += `*Produtos com maior giro físico. Essenciais para entender atração de clientes e giro de estoque.*\n\n`;
    md += `| Rank | Produto | Qtd Vendida | Faturamento | % Faturamento | Transações (Frequência) |\n`;
    md += `| :--- | :--- | :--- | :--- | :---: | :---: |\n`;

    sortedByQuantity.slice(0, 20).forEach((p, idx) => {
        md += `| ${idx + 1} | ${p.nome} | ${p.quantidade.toFixed(0)} | R$ ${p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | ${(p.faturamento / totalRevenue * 100).toFixed(2)}% | ${p.transacoes} |\n`;
    });

    md += `\n## 💡 Insights Estratégicos GIO\n\n`;

    // Calculate core stats for insights
    const classeARevenueProds = sortedByRevenue.filter(p => p.classeRevenue === 'A');
    const classeBRevenueProds = sortedByRevenue.filter(p => p.classeRevenue === 'B');
    const pctProdsASustentam = (classeARevenueProds.length / productsList.length * 100).toFixed(1);

    md += `### 1. Concentração do Faturamento (Princípio de Pareto)\n`;
    md += `- **Classe A (${classeARevenueProds.length} produtos)**: Sustentam **70%** do faturamento bruto, representando apenas **${pctProdsASustentam}%** do catálogo vendido (${productsList.length} itens no total).\n`;
    md += `- **Dependência Operacional**: O faturamento depende criticamente do topo do ranking, em especial de produtos como **${sortedByRevenue[0]?.nome || 'N/A'}**, **${sortedByRevenue[1]?.nome || 'N/A'}** e **${sortedByRevenue[2]?.nome || 'N/A'}**.\n\n`;

    md += `### 2. Eficiência de Margem vs Faturamento\n`;
    // Find products that have high margin shift
    const highMarginDivergents = sortedByProfit.slice(0, 10).filter(p => p.classeRevenue !== 'A');
    if (highMarginDivergents.length > 0) {
        md += `- **Heróis Escondidos (Alta margem, menor faturamento)**: Os seguintes produtos são **Classe A em Lucro Bruto**, mas não estão na Classe A de faturamento. Eles devem ser promovidos, pois trazem excelente margem para cada real faturado:\n`;
        highMarginDivergents.forEach(p => {
            const marginPct = p.faturamento > 0 ? (p.lucro / p.faturamento * 100).toFixed(1) : 0;
            md += `  - **${p.nome}**: Lucro de R$ ${p.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Margem Bruta de **${marginPct}%**).\n`;
        });
        md += `\n`;
    }

    // Write file
    const outputPathArg = process.argv[2];
    const defaultOutputPath = path.join(__dirname, '..', 'relatorio_curva_abc_produtos.md');
    const finalOutputPath = outputPathArg || defaultOutputPath;
    
    fs.writeFileSync(finalOutputPath, md, 'utf-8');
    
    console.log(`\n🎉 [CONCLUIDO] Análise executada com sucesso!`);
    console.log(`📄 Relatório markdown gerado em: ${finalOutputPath}`);
    
    // Print quick summary in console
    console.log('\n======================================================');
    console.log(`📊 RESUMO COMERCIAL (${activeSales.length} Vendas)`);
    console.log(`Faturamento Total: R$ ${totalRevenue.toLocaleString('pt-BR')}`);
    console.log(`Lucro Bruto Total: R$ ${totalProfit.toLocaleString('pt-BR')} (${(totalProfit/totalRevenue*100).toFixed(1)}% de margem)`);
    console.log('------------------------------------------------------');
    console.log('🏆 TOP 5 PRODUTOS EM FATURAMENTO:');
    sortedByRevenue.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}º: ${p.nome} - R$ ${p.faturamento.toLocaleString('pt-BR')} (${p.pctRevenue.toFixed(1)}%)`);
    });
    console.log('======================================================\n');
}

runAnalysis().catch(err => {
    console.error('❌ Falha na execução da análise:', err);
    process.exit(1);
});
