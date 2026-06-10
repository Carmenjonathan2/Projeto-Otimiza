const { execSync } = require('child_process');
const path = require('path');

console.log('========================================================================');
console.log('🔄 INICIANDO ROTINA INTEGRADA: GESTÃO CLICK ➡️ SHOPIFY');
console.log('========================================================================');

try {
    // Passo 1: Extração do Estoque via Puppeteer (Semi-automatizado devido ao login/filtros)
    console.log('\n🤖 [1/3] PASSO 1: Rodando o Robô de Estoque Gestão Click...');
    execSync('node "' + path.join(__dirname, 'robô_estoque.js') + '"', { stdio: 'inherit' });

    // Passo 2: Limpeza e Processamento dos Dados
    console.log('\n🧹 [2/3] PASSO 2: Limpando e formatando os dados extraídos...');
    execSync('node "' + path.join(__dirname, 'clean_estoque.js') + '"', { stdio: 'inherit' });

    // Passo 3: Sincronização Real com Shopify (Modo LIVE com travas de segurança ativas)
    console.log('\n⚡ [3/3] PASSO 3: Sincronizando preços com o Shopify (Modo LIVE)...');
    execSync('node "' + path.join(__dirname, 'atualizar_precos_shopify.js') + '" --live', { stdio: 'inherit' });

    console.log('\n========================================================================');
    console.log('🎉 ROTINA FINALIZADA COM SUCESSO!');
    console.log('Todos os preços compatíveis foram atualizados no Shopify com segurança.');
    console.log('========================================================================\n');

} catch (error) {
    console.log('\n========================================================================');
    console.error('❌ OCORREU UM ERRO DURANTE A ROTINA:', error.message);
    console.log('========================================================================\n');
}
