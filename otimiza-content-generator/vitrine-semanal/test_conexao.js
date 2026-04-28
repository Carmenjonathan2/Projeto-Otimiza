// Teste rápido: valida o token Shopify e mostra um resumo do catálogo.
// Uso (na raiz do repo): node otimiza-content-generator/vitrine-semanal/test_conexao.js

const { listarProdutos, listarColecoes, rankearMaisVendidos } = require('./shopify_client');

(async () => {
    console.log('🔌 Testando conexão com Shopify Admin API...\n');

    try {
        const produtos = await listarProdutos();
        console.log(`✅ ${produtos.length} produtos ativos no catálogo`);

        const comEstoque = produtos.filter(p => p.variants.some(v => v.inventory_quantity > 0));
        console.log(`   • ${comEstoque.length} com estoque > 0`);

        const semImagem = produtos.filter(p => !p.image);
        console.log(`   • ${semImagem.length} SEM imagem (não entram na vitrine)`);

        const colecoes = await listarColecoes();
        console.log(`\n📚 ${colecoes.length} coleções configuradas:`);
        colecoes.slice(0, 10).forEach(c => console.log(`   • ${c.title} (${c.handle})`));
        if (colecoes.length > 10) console.log(`   ... e mais ${colecoes.length - 10}`);

        console.log('\n🏆 Top 10 mais vendidos (últimos 90 dias):');
        const top = await rankearMaisVendidos(90);
        top.slice(0, 10).forEach((p, i) => {
            console.log(`   ${(i+1).toString().padStart(2)}. ${p.titulo.padEnd(45).slice(0,45)} | ${p.qtd}un | R$ ${p.receita.toFixed(2)}`);
        });

        console.log('\n✅ Tudo certo! Pronto pra rodar o gerador de vitrine.');
    } catch (err) {
        if (err.response) {
            console.error(`❌ Erro Shopify ${err.response.status}: ${JSON.stringify(err.response.data)}`);
            if (err.response.status === 401) console.error('   → Token inválido ou expirado.');
            if (err.response.status === 403) console.error('   → Token sem permissões (escopos: read_products, read_orders, read_inventory, read_discounts, write_price_rules).');
            if (err.response.status === 404) console.error('   → SHOPIFY_STORE incorreto. Use o domínio interno: NOMELOJA.myshopify.com');
        } else {
            console.error('❌ Erro:', err.message);
        }
        process.exit(1);
    }
})();
