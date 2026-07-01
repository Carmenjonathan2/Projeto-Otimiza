const puppeteer = require('puppeteer');

async function testSearch() {
    console.log('🚀 Iniciando Puppeteer...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log('📡 Acessando a página de busca do Pet Cães e Cia para "Premier"...');
        await page.goto('https://www.petcaesecia.com.br/busca?busca=Premier', { waitUntil: 'networkidle2', timeout: 45000 });
        
        console.log('🔍 Analisando links de produto e seus pais...');
        const analysis = await page.evaluate(() => {
            const productLinks = Array.from(document.querySelectorAll('a[href*="/produto/"]'));
            
            // Vamos analisar os pais desses links para encontrar as classes dos cards reais de produto
            const parentClasses = new Set();
            const productDetails = [];
            
            productLinks.forEach(link => {
                let parent = link.parentElement;
                // Sobe até achar um pai razoável que contenha R$ (preço) ou tenha uma classe de produto
                let foundCard = null;
                for (let i = 0; i < 5; i++) {
                    if (parent) {
                        const classList = Array.from(parent.classList);
                        if (classList.some(c => c.toLowerCase().includes('prod') || c.toLowerCase().includes('item') || c.toLowerCase().includes('card') || c.toLowerCase().includes('vitrine'))) {
                            foundCard = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
                
                // Se não achou por classe, pega o pai direto de nível 2 ou 3 que tenha preço
                if (!foundCard && link.parentElement) {
                    let p = link.parentElement;
                    for (let i = 0; i < 3; i++) {
                        if (p && p.innerText.includes('R$')) {
                            foundCard = p;
                            break;
                        }
                        p = p.parentElement;
                    }
                }

                if (foundCard) {
                    Array.from(foundCard.classList).forEach(c => parentClasses.add(c));
                    
                    const priceRegex = /R\$\s*\d+[\.,]\d+/g;
                    const prices = foundCard.innerText.match(priceRegex) || [];
                    
                    // Extrai o título e link
                    const title = link.innerText.trim();
                    const href = link.href;
                    
                    if (title && href && prices.length > 0) {
                        productDetails.push({
                            title,
                            href,
                            prices,
                            parentTagName: foundCard.tagName,
                            parentClass: foundCard.className
                        });
                    }
                }
            });

            // Remove duplicatas por href
            const uniqueProducts = [];
            const seenHrefs = new Set();
            productDetails.forEach(p => {
                if (!seenHrefs.has(p.href)) {
                    seenHrefs.add(p.href);
                    uniqueProducts.push(p);
                }
            });

            return {
                parentClasses: Array.from(parentClasses),
                totalUniqueProducts: uniqueProducts.length,
                samples: uniqueProducts.slice(0, 15)
            };
        });

        console.log('--- ANÁLISE DE PRODUTOS REAIS ---');
        console.log('Classes de pais detectadas:', analysis.parentClasses);
        console.log('Total de produtos válidos com preço:', analysis.totalUniqueProducts);
        console.log('Amostras:', JSON.stringify(analysis.samples, null, 2));

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await browser.close();
    }
}

testSearch();
