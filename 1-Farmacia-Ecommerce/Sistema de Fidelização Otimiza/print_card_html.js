const puppeteer = require('puppeteer');

async function printCardHTML() {
    console.log('🚀 Iniciando Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log('📡 Acessando a página de busca...');
        await page.goto('https://www.petcaesecia.com.br/busca?busca=Premier', { waitUntil: 'networkidle2' });
        
        console.log('🔍 Obtendo o HTML do primeiro produto...');
        const cardHTML = await page.evaluate(() => {
            const card = document.querySelector('.fbits-item-lista-spot');
            return card ? card.outerHTML : 'Nenhum cartão encontrado!';
        });
        
        console.log('=== HTML DO CARTÃO ===');
        console.log(cardHTML);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await browser.close();
    }
}

printCardHTML();
