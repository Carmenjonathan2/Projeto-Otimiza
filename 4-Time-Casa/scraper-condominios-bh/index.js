const puppeteer = require('puppeteer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Função para introduzir pausas aleatórias e simular comportamento humano
const randomDelay = async (min = 2000, max = 5000) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
};

async function runScraper() {
    console.log("Iniciando o robô de scraping...");

    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    const detailPage = await browser.newPage(); // Reutiliza uma única página para detalhes
    
    // Configura o user-agent para parecer um navegador comum
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // Termos de busca expandidos para BH e Região Metropolitana
    const queries = [
        "condomínio Buritis BH",
        "condomínio Belvedere BH",
        "condomínio Castelo BH",
        "condomínio Vila da Serra Nova Lima",
        "condomínio Sion BH",
        "condomínio Sagrada Família BH",
        "condomínio Santo Agostinho BH",
        "condomínio Lourdes BH",
        "condomínio Alphaville Lagoa dos Ingleses",
        "condomínio Lagoa Santa",
        "condomínio Contagem",
        "condomínio Betim",
        "administradora de condomínios Belo Horizonte",
        "síndico profissional BH"
    ];

    // Carregar IDs existentes para evitar duplicados
    let existingNames = new Set();
    const mainFile = 'condominios_bh.csv';
    if (require('fs').existsSync(mainFile)) {
        const content = require('fs').readFileSync(mainFile, 'utf8');
        content.split('\n').forEach(line => {
            const name = line.split(',')[0].replace(/"/g, '');
            if (name) existingNames.add(name);
        });
        console.log(`Base carregada: ${existingNames.size} registros já conhecidos.`);
    }

    const csvWriter = createCsvWriter({
        path: mainFile,
        header: [
            { id: 'nome', title: 'NOME' },
            { id: 'telefone', title: 'TELEFONE' },
            { id: 'endereco', title: 'ENDERECO' },
            { id: 'site', title: 'SITE' }
        ],
        append: true
    });
    for (const query of queries) {
        console.log(`\n================================`);
        console.log(`Buscando por: ${query}`);
        console.log(`================================\n`);

        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
            await randomDelay(3000, 6000); 

            await scrollResultsPanel(page);

            const placeLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a.hfpxzc'));
                return links.map(a => ({
                    href: a.href,
                    nome: a.getAttribute('aria-label') || ''
                }));
            });
            
            console.log(`Encontrados ${placeLinks.length} resultados para a busca.`);

            for (let i = 0; i < placeLinks.length; i++) {
                const item = placeLinks[i];
                
                // Pular se já existir na base
                if (existingNames.has(item.nome)) {
                    console.log(`[${i + 1}/${placeLinks.length}] Pulando (já existe): ${item.nome}`);
                    continue;
                }

                console.log(`[${i + 1}/${placeLinks.length}] Coletando: ${item.nome}...`);

                try {
                    await detailPage.goto(item.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await randomDelay(2000, 4000);

                    const data = await extractPlaceData(detailPage);
                    if (data.nome) {
                        await csvWriter.writeRecords([data]);
                        existingNames.add(data.nome); // Adiciona ao Set para evitar duplicar na mesma rodada
                        console.log(`✅ Salvo: ${data.nome}`);
                    }
                    await randomDelay(1000, 2000);
                } catch (error) {
                    console.error(`Erro no link (${item.href}):`, error.message);
                }
            }

        } catch (error) {
            console.error(`Erro na busca por "${query}":`, error.message);
        }
    }

    await browser.close();
    console.log("\n🏁 Extração finalizada com sucesso.");
}

async function scrollResultsPanel(page) {
    try {
        console.log("Rolando a página para carregar todos os resultados...");
        // Espera pelo menos um resultado aparecer
        await page.waitForSelector('a.hfpxzc', { timeout: 15000 });
        
        // Encontra o container que tem o scroll
        const feedSelector = await page.evaluate(() => {
            const firstResult = document.querySelector('a.hfpxzc');
            let parent = firstResult.parentElement;
            while (parent && parent.scrollHeight <= parent.clientHeight) {
                parent = parent.parentElement;
            }
            if (parent) {
                // Adiciona um atributo único para identificarmos ele
                parent.setAttribute('data-scroll-container', 'true');
                return '[data-scroll-container="true"]';
            }
            return 'div[role="feed"]'; // Fallback
        });
        
        let previousHeight = 0;
        let attempts = 0;

        while (attempts < 15) { 
            const currentHeight = await page.evaluate((sel) => {
                const feed = document.querySelector(sel) || document.querySelector('div[role="feed"]');
                if (feed) {
                    feed.scrollBy(0, 2000);
                    return feed.scrollHeight;
                }
                return 0;
            }, feedSelector);

            await randomDelay(2000, 4000);

            if (currentHeight === previousHeight || currentHeight === 0) {
                attempts++;
            } else {
                attempts = 0;
            }
            previousHeight = currentHeight;
            console.log(`   ...rolando (Altura: ${currentHeight})`);
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
