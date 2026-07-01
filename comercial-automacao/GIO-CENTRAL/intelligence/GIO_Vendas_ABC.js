const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================
// 1. CONFIGURAÇÕES GIO (VENDAS)
// ============================================
const USER_DATA_DIR = path.join(__dirname, '..', '..', '..', '1-Farmacia-Ecommerce', 'Sistema de Fidelização Otimiza', 'browser_data');
const URL_VENDAS = 'https://app.gestaoclick.com.br/vendas_produtos';
const ARQUIVO_DADOS = path.join(__dirname, '..', 'data', 'dados_vendas_gio.json');
const RELATORIO_ABC = path.join(__dirname, '..', 'data', 'curva_abc_vendas.md');

async function iniciarGIOVendas() {
    console.log('🧠 GIO Iniciado: Módulo de Inteligência Comercial (Vendas)');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        userDataDir: USER_DATA_DIR, 
        args: ['--start-maximized', '--no-sandbox'] 
    });

    const page = await browser.newPage();

    try {
        console.log('📡 Acessando listagem de vendas...');
        await page.goto(URL_VENDAS, { waitUntil: 'networkidle2' });

        console.log('\n-----------------------------------------------------------');
        console.log('📊 MODO GIO: AGUARDANDO FILTRO DE PERÍODO');
        console.log('1. Selecione o período que deseja analisar (Semanal ou Mensal).');
        console.log('2. Clique em "Filtrar".');
        console.log('3. A extração e o cálculo da Curva ABC iniciarão automaticamente.');
        console.log('-----------------------------------------------------------\n');

        // Espera o usuário aplicar o filtro (esperamos pela tabela)
        await page.waitForSelector('table.b-table tbody tr', { timeout: 0 });
        console.log('✅ Tabela detectada. Iniciando leitura de páginas...');

        let todasVendas = [];
        let temProxima = true;
        let p = 1;

        while(temProxima) {
            console.log(`🔍 Lendo página ${p}...`);
            await page.waitForSelector('table.b-table tbody tr', { timeout: 10000 }).catch(() => {});

            const dadosPagina = await page.evaluate(() => {
                const trs = Array.from(document.querySelectorAll('table.b-table tbody tr'));
                return trs.map(tr => {
                    const cols = tr.querySelectorAll('td');
                    if(cols.length < 5) return null;
                    return {
                        cliente: cols[1]?.innerText.trim(),
                        data: cols[2]?.innerText.trim(),
                        valor: parseFloat(cols[4]?.innerText.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
                    };
                }).filter(v => v !== null);
            });

            todasVendas.push(...dadosPagina);

            const btnProximo = await page.$('button.page-link[aria-label="Go to next page"]');
            const isDisabled = await page.evaluate(btn => btn ? (btn.disabled || btn.classList.contains('disabled')) : true, btnProximo);

            if (btnProximo && !isDisabled && p < 20) {
                await btnProximo.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
                p++;
            } else {
                temProxima = false;
            }
        }

        console.log(`\n✅ Extração concluída: ${todasVendas.length} vendas capturadas.`);
        
        // 2. ANÁLISE GIO (CURVA ABC)
        processarCurvaABC(todasVendas);

    } catch (err) {
        console.error('❌ Erro no GIO:', err);
    }
}

function processarCurvaABC(vendas) {
    console.log('📈 Calculando Curva ABC e Inteligência de Vendas...');

    // Agrupar por Cliente
    const performanceClientes = {};
    let faturamentoTotal = 0;

    vendas.forEach(v => {
        if (!performanceClientes[v.cliente]) performanceClientes[v.cliente] = 0;
        performanceClientes[v.cliente] += v.valor;
        faturamentoTotal += v.valor;
    });

    // Transformar em array e ordenar por valor (decrescente)
    const rankingClientes = Object.entries(performanceClientes)
        .map(([nome, total]) => ({ nome, total, percentual: (total / faturamentoTotal) * 100 }))
        .sort((a, b) => b.total - a.total);

    // Calcular Classes ABC
    let acumulado = 0;
    const relatorioFinal = rankingClientes.map(c => {
        acumulado += c.percentual;
        let classe = 'C';
        if (acumulado <= 70) classe = 'A';
        else if (acumulado <= 90) classe = 'B';
        
        return { ...c, classe, acumulado: acumulado.toFixed(2) };
    });

    // Gerar Relatório Markdown
    let md = `# 🧠 Relatório de Inteligência GIO - Curva ABC\n`;
    md += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
    md += `## 💰 Faturamento Total Analisado: R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    
    md += `### 🏆 Top 10 Clientes (Ranking A)\n`;
    md += `| Cliente | Total Gasto | % Faturamento | Classe |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    
    relatorioFinal.slice(0, 10).forEach(c => {
        md += `| ${c.nome} | R$ ${c.total.toLocaleString('pt-BR')} | ${c.percentual.toFixed(2)}% | **${c.classe}** |\n`;
    });

    md += `\n> [!TIP]\n> O GIO identificou que os clientes de **Classe A** representam o núcleo do seu faturamento. Considere ações de fidelidade exclusivas para estes contatos.\n`;

    fs.writeFileSync(RELATORIO_ABC, md);
    fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(relatorioFinal, null, 2));

    console.log(`\n🎉 Relatório GIO gerado com sucesso em: ${RELATORIO_ABC}`);
    console.log('Dica: Abra o arquivo .md no VS Code para ver o relatório formatado.');
}

iniciarGIOVendas();
