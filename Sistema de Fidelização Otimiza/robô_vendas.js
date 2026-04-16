const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================
// 1. CONFIGURAÇÕES PRINCIPAIS
// ============================================
const EMAIL = 'carmenmsdcarvalho@gmail.com'; 
const SENHA = 'CEO1520!Cc';
const URL_LOGIN = 'https://erp.gestaoclick.com.br/login';
const URL_VENDAS = 'https://app.gestaoclick.com.br/vendas_produtos';
const USER_DATA_DIR = path.join(__dirname, 'browser_data');
const ARQUIVO_SAIDA = path.join(__dirname, 'historico_extraido_gestaoclick.json');
const MAX_CONCURRENT_PAGES = 3; // Extração paralela para triplicar a velocidade

async function iniciarScraping() {
    console.log('🚀 Iniciando o Robô Otimiza GIO v2.0...');
    
    // Criamos a pasta de cookies se não existir
    if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });

    const browser = await puppeteer.launch({ 
        headless: false, // Mantemos visível para supervisão inicial
        defaultViewport: null,
        userDataDir: USER_DATA_DIR, // PERSISTÊNCIA DE SESSÃO
        args: ['--start-maximized', '--no-sandbox'] 
    });

    const page = await browser.newPage();

    try {
        console.log('📡 Verificando estado da sessão...');
        await page.goto(URL_VENDAS, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Se redirecionar para login, precisamos logar
        if (page.url().includes('/login') || (await page.$('#email'))) {
            console.log('🔑 Sessão expirada ou não iniciada. Efetuando login...');
            await page.waitForSelector('#email', { visible: true, timeout: 10000 });
            await page.type('#email', EMAIL, { delay: 50 }); 
            await page.type('#senha', SENHA, { delay: 50 });
            
            console.log('🔘 Clicando no botão de entrar...');
            await page.click('button[type="submit"]');

            // Em vez de waitForNavigation, esperamos por um elemento dopainel ou erro
            console.log('⏳ Aguardando redirecionamento para o dashboard...');
            try {
                await page.waitForSelector('.sidebar-menu, .wrapper, .logo, .navbar', { timeout: 15000 });
                console.log('✅ Login realizado (redirecionado para o dashboard).');
            } catch (e) {
                if (page.url().includes('/login')) {
                    console.log('⚠️ Parado na tela de login. Pode haver um ReCaptcha ou erro de credenciais.');
                    console.log('👉 Por favor, resolva o desafio no navegador se necessário.');
                    // Espera o usuário resolver e chegar na página de vendas
                    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 0 });
                }
            }
        } else {
            console.log('✅ Sessão recuperada com sucesso!');
        }

        // Garante que estamos na página de vendas antes de prosseguir
        if (!page.url().includes('vendas_produtos')) {
            console.log('📂 Navegando para a página de vendas...');
            await page.goto(URL_VENDAS, { waitUntil: 'networkidle2' });
        }

        console.log('\n-----------------------------------------------------------');
        console.log('⏳ AGUARDANDO FILTROS NO GESTÃO CLICK');
        console.log('1. No navegador aberto, aplique os filtros desejados.');
        console.log('2. Clique em "Filtrar".');
        console.log('3. Assim que a tabela carregar, a extração iniciará.');
        console.log('-----------------------------------------------------------\n');

        
        // Espera a tabela de vendas aparecer (indicando que o filtro foi aplicado ou a página carregou)
        await page.waitForSelector('table.b-table tbody tr', { timeout: 0 });

        let historico = [];
        let temProximaPagina = true;
        let paginaAtual = 1;

        while (temProximaPagina) {
            console.log(`\n📄 Lendo página ${paginaAtual}...`);
            await page.waitForSelector('table.b-table tbody tr', { timeout: 15000 }).catch(() => {});

            // Pegamos os links da página atual
            const linksVendas = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('table.b-table tbody tr'));
                return rows.map(r => {
                    const btn = r.querySelector('a[title="Visualizar"]') || 
                                r.querySelector('.glyphicon-search')?.parentElement || 
                                r.querySelector('a[href*="/visualizar/"]');
                    const cols = r.querySelectorAll('td');
                    return {
                        url: btn ? btn.href : null,
                        infoBasica: {
                            cliente: cols[1] ? cols[1].innerText.trim() : 'N/A',
                            data: cols[2] ? cols[2].innerText.trim() : 'N/A',
                            valor: cols[4] ? cols[4].innerText.trim() : 'N/A'
                        }
                    };
                }).filter(l => l.url);
            });

            console.log(`🔍 Encontrados ${linksVendas.length} links nesta tela.`);

            // Processamento em lotes (concorrência)
            for (let i = 0; i < linksVendas.length; i += MAX_CONCURRENT_PAGES) {
                const lote = linksVendas.slice(i, i + MAX_CONCURRENT_PAGES);
                
                await Promise.all(lote.map(async (venda, idxLote) => {
                    const iAbs = i + idxLote + 1;
                    console.log(`   [${iAbs}/${linksVendas.length}] Extraindo: ${venda.infoBasica.cliente}...`);
                    
                    const vendaTab = await browser.newPage();
                    try {
                        await vendaTab.goto(venda.url, { waitUntil: 'networkidle2', timeout: 30000 });

                        // Clica na aba de Produtos (usando seletores mais flexíveis)
                        await vendaTab.evaluate(() => {
                            const targets = Array.from(document.querySelectorAll('.nav-tabs a, .nav-item a, button, .nav-link'));
                            const alvo = targets.find(el => {
                                const txt = (el.innerText || "").toLowerCase();
                                return txt.includes('produtos') || txt.includes('itens') || txt.includes('detalhes');
                            });
                            if (alvo) alvo.click();
                        });

                        await new Promise(r => setTimeout(r, 1500)); 

                        const produtos = await vendaTab.evaluate(() => {
                            const itens = [];
                            const content = document.querySelector('.tab-content, .card-body, #app');
                            if (content) {
                                const textNodes = Array.from(content.querySelectorAll('td, .product-name, .item-title'));
                                // Lógica robusta: pegamos o que parece ser nome de produto se a tabela for confusa
                                const tables = content.querySelectorAll('table');
                                for (const table of tables) {
                                    if (table.innerText.toLowerCase().includes('produto')) {
                                        const trs = Array.from(table.querySelectorAll('tr'));
                                        trs.forEach(tr => {
                                            const cells = tr.querySelectorAll('td');
                                            if (cells.length > 0 && !cells[0].innerText.includes('Nenhum')) {
                                                itens.push(cells[0].innerText.trim());
                                            }
                                        });
                                    }
                                }
                            }
                            return [...new Set(itens)].filter(it => it.length > 2); // Unifica e limpa
                        });

                        historico.push({ ...venda.infoBasica, produtos });
                    } catch (err) {
                        console.log(`      ❌ Erro na venda ${venda.infoBasica.cliente}: ${err.message}`);
                    } finally {
                        await vendaTab.close();
                    }
                }));

                // Salva parcial para evitar perda de dados
                fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(historico, null, 2), 'utf-8');
            }

            // Verifica paginação
            const nxt = await page.$('button.page-link[aria-label="Go to next page"], .pagination .active + li a');
            const canNext = await page.evaluate(b => b && !b.getAttribute('disabled') && !b.classList.contains('disabled'), nxt);

            if (canNext && paginaAtual < 50) { // Limite de 50 páginas por segurança
                console.log(`➡️ Indo para página ${paginaAtual + 1}...`);
                await nxt.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
                paginaAtual++;
            } else {
                temProximaPagina = false;
            }
        }

        console.log(`\n🎉 SUCESSO! ${historico.length} vendas consolidadas em: ${ARQUIVO_SAIDA}`);

    } catch (error) {
        console.error('❌ Erro durante a execução:', error);
    } finally {
        // browser.close(); // Comentado para você ver o resultado final antes de fechar
    }
}

iniciarScraping();

