const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Configuração do arquivo CSV onde os dados serão salvos
const csvWriter = createCsvWriter({
    path: 'condominios_bh.csv',
    header: [
        { id: 'nome', title: 'NOME' },
        { id: 'telefone', title: 'TELEFONE' },
        { id: 'endereco', title: 'ENDERECO' },
        { id: 'site', title: 'SITE' }
    ]
});

// Função para introduzir pausas aleatórias e simular comportamento humano
const randomDelay = async (min = 2000, max = 5000) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
};

async function runScraper() {
    console.log("Iniciando o robô de scraping...");

    // Inicia o navegador. 'headless: false' permite ver o que o robô está fazendo.
    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    
    // Configura o user-agent para parecer um navegador comum
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // Termos de busca
    const queries = [
        "administradora de condomínios Belo Horizonte",
        "condomínio residencial Belo Horizonte"
    ];

    let allData = [];

    for (const query of queries) {
        console.log(`\n================================`);
        console.log(`Buscando por: ${query}`);
        console.log(`================================\n`);

        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            await randomDelay(3000, 6000); // Espera a página carregar completamente

            // Função para fazer scroll no painel lateral de resultados e carregar mais itens
            await scrollResultsPanel(page);

            // Coleta os links de todos os lugares listados no painel
            const placeLinks = await page.$$eval('a[href*="/maps/place/"]', links => links.map(a => a.href));
            
            // Remove duplicatas
            const uniqueLinks = [...new Set(placeLinks)];
            console.log(`Encontrados ${uniqueLinks.length} resultados para a busca.`);

            for (let i = 0; i < uniqueLinks.length; i++) {
                const link = uniqueLinks[i];
                console.log(`[${i + 1}/${uniqueLinks.length}] Coletando dados...`);

                try {
                    // Abrir em uma nova aba para não perder a lista original
                    const detailPage = await browser.newPage();
                    await detailPage.goto(link, { waitUntil: 'networkidle2', timeout: 45000 });
                    await randomDelay(1500, 3000);

                    const data = await extractPlaceData(detailPage);
                    if (data.nome) {
                        allData.push(data);
                        console.log(`Sucesso: ${data.nome} | Tel: ${data.telefone}`);
                    }

                    await detailPage.close();
                    await randomDelay(2000, 4000); // Pausa entre cada coleta
                } catch (error) {
                    console.error(`Erro ao processar o link (${link}):`, error.message);
                }
            }

        } catch (error) {
            console.error(`Erro na busca por "${query}":`, error.message);
        }
    }

    // Salvar todos os dados coletados no CSV
    if (allData.length > 0) {
        try {
            await csvWriter.writeRecords(allData);
            console.log(`\nExtração concluída com sucesso! ${allData.length} registros salvos em "condominios_bh.csv".`);
        } catch (error) {
            console.error('Erro ao salvar no arquivo CSV:', error);
        }
    } else {
        console.log('\nNenhum dado foi coletado.');
    }

    await browser.close();
    console.log("Robô finalizado.");
}

async function scrollResultsPanel(page) {
    try {
        console.log("Rolando a página para carregar todos os resultados...");
        // O Google Maps costuma usar role="feed" para a lista de resultados
        await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
        
        let previousHeight = 0;
        let attempts = 0;

        while (attempts < 10) { // Limita o número máximo de scrolls para não ficar infinito
            const currentHeight = await page.evaluate(() => {
                const feed = document.querySelector('div[role="feed"]');
                feed.scrollTo(0, feed.scrollHeight);
                return feed.scrollHeight;
            });

            await randomDelay(2000, 3500);

            if (currentHeight === previousHeight) {
                attempts++;
                // Verifica se apareceu a mensagem de fim da lista
                const isEndOfList = await page.evaluate(() => {
                    return document.body.innerText.includes("Você chegou ao final da lista");
                });
                if (isEndOfList) break;
            } else {
                attempts = 0;
            }
            previousHeight = currentHeight;
        }
        console.log("Rolagem concluída.");
    } catch (e) {
        console.log("Aviso: Não foi possível rolar a lista de resultados. Pode haver poucos itens ou o layout mudou.");
    }
}

async function extractPlaceData(page) {
    return await page.evaluate(() => {
        const data = { nome: '', telefone: 'Não disponível', endereco: 'Não disponível', site: 'Não disponível' };

        // 1. Nome do Local (geralmente num h1)
        const nameEl = document.querySelector('h1');
        if (nameEl) data.nome = nameEl.innerText.trim();

        // 2. Extrair informações dos botões/ícones
        const buttons = Array.from(document.querySelectorAll('button'));
        
        buttons.forEach(btn => {
            const ariaLabel = btn.getAttribute('aria-label') || '';
            
            // Endereço (aria-label começa com "Endereço: " ou contém endereço)
            if (ariaLabel.includes('Endereço: ')) {
                data.endereco = ariaLabel.replace('Endereço: ', '').trim();
            }

            // Telefone (aria-label começa com "Telefone: ")
            if (ariaLabel.includes('Telefone: ')) {
                data.telefone = ariaLabel.replace('Telefone: ', '').trim();
            }
        });

        // 3. Site (ancoras com atributos específicos de site)
        const siteAnchor = document.querySelector('a[data-item-id="authority"]');
        if (siteAnchor) {
            data.site = siteAnchor.href;
        } else {
            // Alternativa: buscar no aria-label "Site:"
            const allLinks = Array.from(document.querySelectorAll('a'));
            const siteLink = allLinks.find(a => (a.getAttribute('aria-label') || '').includes('Website: ') || (a.getAttribute('aria-label') || '').includes('Site: '));
            if (siteLink) data.site = siteLink.href;
        }

        return data;
    });
}

// Inicia a execução mantendo o tratamento de erro global
runScraper().catch(console.error);
