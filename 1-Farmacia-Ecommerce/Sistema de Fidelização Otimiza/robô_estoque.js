const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ============================================
// 1. CONFIGURAÇÕES PRINCIPAIS
// ============================================
const EMAIL = 'carmenmsdcarvalho@gmail.com'; 
const SENHA = 'CEO1520!Cc';
const URL_LOGIN = 'https://erp.gestaoclick.com.br/login';
const URL_PRODUTOS = 'https://app.gestaoclick.com.br/produtos'; // Tela padrão de produtos
const USER_DATA_DIR = path.join(__dirname, 'browser_data');
const ARQUIVO_SAIDA_JSON = path.join(__dirname, 'estoque_extraido_gestaoclick.json');
const ARQUIVO_SAIDA_XLSX = path.join(__dirname, 'estoque_extraido_gestaoclick.xlsx');

async function iniciarScraping() {
    console.log('🚀 Iniciando o Robô de Estoque Otimiza...');
    
    if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });

    const browser = await puppeteer.launch({ 
        headless: false, // Visível para monitoramento e login
        defaultViewport: null,
        userDataDir: USER_DATA_DIR,
        args: ['--start-maximized', '--no-sandbox'] 
    });

    const page = await browser.newPage();

    try {
        console.log('📡 Verificando estado da sessão...');
        await page.goto(URL_PRODUTOS, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Login se necessário
        if (page.url().includes('/login') || (await page.$('#email'))) {
            console.log('🔑 Sessão expirada ou não iniciada. Efetuando login...');
            await page.waitForSelector('#email', { visible: true, timeout: 10000 });
            await page.type('#email', EMAIL, { delay: 50 }); 
            await page.type('#senha', SENHA, { delay: 50 });
            
            console.log('🔘 Clicando no botão de entrar...');
            await page.click('button[type="submit"]');

            console.log('⏳ Aguardando redirecionamento...');
            try {
                await page.waitForSelector('.sidebar-menu, .wrapper, .logo, .navbar', { timeout: 15000 });
                console.log('✅ Login realizado.');
            } catch (e) {
                if (page.url().includes('/login')) {
                    console.log('⚠️ ReCaptcha ou erro. Por favor, resolva no navegador se necessário.');
                    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 0 });
                }
            }
        } else {
            console.log('✅ Sessão recuperada com sucesso!');
        }

        // Vai para a tela de produtos se não estiver nela
        if (!page.url().includes('produtos') && !page.url().includes('controle_estoques')) {
            console.log('📂 Navegando para a página de produtos...');
            await page.goto(URL_PRODUTOS, { waitUntil: 'networkidle2' });
        }

        console.log('\n-----------------------------------------------------------');
        console.log('⏳ AGUARDANDO FILTROS NO GESTÃO CLICK');
        console.log('1. No navegador aberto, acesse a tela exata de produtos ou estoque.');
        console.log('2. Aplique os filtros necessários (ex: produtos ativos, estoque > 0).');
        console.log('3. Clique em "Filtrar".');
        console.log('4. Assim que a tabela carregar, a extração iniciará automaticamente.');
        console.log('-----------------------------------------------------------\n');

        // Espera a tabela carregar
        await page.waitForSelector('table.b-table tbody tr', { timeout: 0 });

        let estoqueCompleto = [];
        let temProximaPagina = true;
        let paginaAtual = 1;

        // Identifica os cabeçalhos da tabela dinamicamente para mapear os dados corretamente
        const colHeaders = await page.evaluate(() => {
            const ths = Array.from(document.querySelectorAll('table.b-table thead th'));
            return ths.map(th => th.innerText.trim()).filter(h => h.length > 0);
        });

        console.log('📊 Colunas detectadas na tabela:', colHeaders.join(' | '));

        while (temProximaPagina) {
            console.log(`\n📄 Lendo página ${paginaAtual}...`);
            await page.waitForSelector('table.b-table tbody tr', { timeout: 15000 }).catch(() => {});

            // Extrai as linhas da página atual
            const dadosPagina = await page.evaluate((headers) => {
                const rows = Array.from(document.querySelectorAll('table.b-table tbody tr'));
                return rows.map(r => {
                    const cols = Array.from(r.querySelectorAll('td'));
                    const item = {};
                    
                    // Mapeia cada coluna para o cabeçalho correspondente
                    cols.forEach((col, idx) => {
                        const headerName = headers[idx] || `Coluna_${idx + 1}`;
                        
                        // Ignora colunas vazias ou de ações do sistema
                        if (headerName.toLowerCase() !== 'ações' && headerName !== '') {
                            item[headerName] = col.innerText.trim();
                        }
                    });
                    
                    return item;
                }).filter(i => Object.keys(i).length > 0);
            }, colHeaders);

            console.log(`✨ Extraídos ${dadosPagina.length} itens desta página.`);
            estoqueCompleto = estoqueCompleto.concat(dadosPagina);

            // Salva o JSON parcial para segurança
            fs.writeFileSync(ARQUIVO_SAIDA_JSON, JSON.stringify(estoqueCompleto, null, 2), 'utf-8');

            // Verifica paginação
            const nxt = await page.$('button.page-link[aria-label="Go to next page"], .pagination .active + li a');
            const canNext = await page.evaluate(b => b && !b.getAttribute('disabled') && !b.classList.contains('disabled'), nxt);

            if (canNext && paginaAtual < 100) { // Limite preventivo de 100 páginas
                console.log(`➡️ Avançando para a página ${paginaAtual + 1}...`);
                await nxt.click();
                
                // Espera um pequeno delay para a tabela atualizar
                await new Promise(r => setTimeout(r, 2000));
                paginaAtual++;
            } else {
                temProximaPagina = false;
            }
        }

        console.log(`\n🎉 Extração concluída! Total de produtos catalogados: ${estoqueCompleto.length}`);

        // Conversão e exportação para Excel (.xlsx) de forma nativa e limpa
        console.log('💾 Salvando arquivos de saída...');
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(estoqueCompleto);
        XLSX.utils.book_append_sheet(wb, ws, "Estoque GestãoClick");
        XLSX.writeFile(wb, ARQUIVO_SAIDA_XLSX);

        console.log(`✔️ Arquivo JSON salvo em: ${ARQUIVO_SAIDA_JSON}`);
        console.log(`✔️ Planilha Excel (.xlsx) salva em: ${ARQUIVO_SAIDA_XLSX}`);

    } catch (error) {
        console.error('❌ Erro durante o processo:', error);
    } finally {
        console.log('\nProcesso encerrado. Você já pode fechar o navegador.');
    }
}

iniciarScraping();
