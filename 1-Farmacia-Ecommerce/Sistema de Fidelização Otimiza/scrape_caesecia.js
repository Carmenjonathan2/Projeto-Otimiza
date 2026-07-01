const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SAIDA_JSON = path.join(__dirname, 'estoque_caesecia.json');

async function scrapeCaesECia() {
    console.log('========================================================================');
    console.log('🚀 INICIANDO CRAWLER DE PREÇOS: PET CÃES E CIA');
    console.log('========================================================================');

    const marcas = ['Premier', 'Quatree', 'Golden'];
    let todosProdutos = [];

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // Define user agent realista para evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        for (const marca of marcas) {
            console.log(`\n🔍 Buscando produtos da marca: [${marca.toUpperCase()}]...`);
            let pagina = 1;
            let temMaisPaginas = true;

            while (temMaisPaginas) {
                const url = `https://www.petcaesecia.com.br/busca?busca=${encodeURIComponent(marca)}&pagina=${pagina}`;
                console.log(`📡 Lendo página ${pagina}: ${url}`);

                try {
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
                } catch (err) {
                    console.error(`⚠️ Timeout ao acessar página ${pagina}. Tentando prosseguir...`);
                }

                // Extrai os produtos da página atual
                const produtosPagina = await page.evaluate(() => {
                    const cards = Array.from(document.querySelectorAll('.fbits-item-lista-spot'));
                    const data = [];

                    cards.forEach(card => {
                        const linkEl = card.querySelector('a.spot-parte-dois') || card.querySelector('a[href*="/produto/"]');
                        if (!linkEl) return;

                        const urlProduto = linkEl.href;
                        const titleEl = card.querySelector('.spotTitle');
                        const titulo = titleEl ? titleEl.innerText.trim() : '';

                        if (!titulo) return;

                        // Pega o conteúdo de preços da área de conteúdo (evitando o botão de Favorito)
                        const conteudoEl = card.querySelector('.fbits-spot-conteudo');
                        const textContent = conteudoEl ? conteudoEl.innerText.trim() : '';

                        // Encontra todas as ocorrências de preços
                        const priceRegex = /R\$\s*\d+(?:[\.,]\d+)?/g;
                        const matchPrecos = textContent.match(priceRegex) || [];

                        // Limpa e normaliza os preços para float
                        const valoresNumericos = matchPrecos.map(p => {
                            const numStr = p.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                            return parseFloat(numStr);
                        });

                        if (valoresNumericos.length > 0) {
                            // O maior preço costuma ser o "Preço De" (original)
                            // O menor preço costuma ser o "Preço Por" ou à vista/assinatura
                            const precoMax = Math.max(...valoresNumericos);
                            const precoMin = Math.min(...valoresNumericos);

                            data.push({
                                titulo: titulo,
                                link: urlProduto,
                                preco_original: precoMax,
                                preco_concorrente: precoMin,
                                todos_precos: matchPrecos
                            });
                        }
                    });

                    // Verifica se existe o botão de próxima página
                    // Geralmente há um link de paginação ativo com número maior ou indicador de próximo
                    return {
                        produtos: data
                    };
                });

                console.log(`✨ Encontrados ${produtosPagina.produtos.length} produtos nesta página.`);

                if (produtosPagina.produtos.length === 0) {
                    temMaisPaginas = false;
                } else {
                    // Adiciona os produtos
                    todosProdutos = todosProdutos.concat(produtosPagina.produtos);

                    // Delicadeza contra bloqueios (delay de 1 segundo)
                    await new Promise(r => setTimeout(r, 1000));
                    pagina++;
                    
                    // Limite de segurança de páginas por marca
                    if (pagina > 15) {
                        temMaisPaginas = false;
                    }
                }
            }
        }

        // Remove produtos duplicados por link
        const seenLinks = new Set();
        const produtosUnicos = [];
        todosProdutos.forEach(p => {
            if (!seenLinks.has(p.link)) {
                seenLinks.add(p.link);
                produtosUnicos.push(p);
            }
        });

        console.log(`\n🎉 Scraping finalizado!`);
        console.log(`📦 Total de produtos únicos extraídos: ${produtosUnicos.length}`);

        // Salva os dados concorrentes no arquivo JSON
        fs.writeFileSync(SAIDA_JSON, JSON.stringify(produtosUnicos, null, 2), 'utf-8');
        console.log(`💾 Banco de preços da Cães e Cia salvo em: "${SAIDA_JSON}"`);

    } catch (error) {
        console.error('❌ Erro durante o scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeCaesECia();
