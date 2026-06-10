/**
 * 🎨 GERADOR DE INFOGRÁFICOS PINTEREST VIA HEADLESS BROWSER (PUPPETEER)
 * ====================================================================
 * Lê o arquivo 'calendario_posts_pinterest.json' e renderiza um layout 
 * de infográfico de 3 colunas de altíssima qualidade (1000x1500px) contendo
 * tabelas, diagramas de fluxo e conexões, e salva como PNG.
 * 
 * Autor: Antigravity AI
 * Data: 2026-06-08
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const CENTRAL_JSON_PATH = path.join(__dirname, '..', 'Manual-Semanal', 'calendario_posts_pinterest.json');
const FILA_DIR = path.join(__dirname, '..', 'Manual-Semanal', 'Fila-Pinterest');

async function renderAll() {
    console.log('🚀 Iniciando renderizador de infográficos com Puppeteer...');
    
    if (!fs.existsSync(CENTRAL_JSON_PATH)) {
        console.error(`[ERROR] JSON central não encontrado em: ${CENTRAL_JSON_PATH}`);
        return;
    }
    
    const posts = JSON.parse(fs.readFileSync(CENTRAL_JSON_PATH, 'utf-8'));
    console.log(`[OK] Carregados ${posts.length} posts do JSON central.`);
    
    // Iniciar Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1500, deviceScaleFactor: 2 }); // Escala 2x para nitidez ultra
    
    for (let idx = 0; idx < posts.length; idx++) {
        const post = posts[idx];
        const dataSugerida = post.posting_time;
        const diaNome = post.dia_nome;
        const info = post.infographic_data;
        
        // Encontrar a pasta física correspondente
        const prefix = `Post-${String(idx + 1).padStart(2, '0')}`;
        let matchedFolder = null;
        
        if (fs.existsSync(FILA_DIR)) {
            const files = fs.readdirSync(FILA_DIR);
            for (const file of files) {
                if (file.startsWith(prefix)) {
                    matchedFolder = path.join(FILA_DIR, file);
                    break;
                }
            }
        }
        
        if (!matchedFolder) {
            console.warn(`[WARN] Pasta para ${prefix} não encontrada.`);
            continue;
        }
        
        console.log(`\n🎨 Renderizando imagem do post ${prefix}: "${info.header.title}"...`);
        
        // Gerar o HTML dinâmico com base nos dados ricos
        const htmlContent = generateHTML(info, post.whatsapp_link);
        
        // Carregar o conteúdo HTML no navegador (esperando apenas carregar a estrutura básica para evitar timeouts de rede)
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        
        // Tirar screenshot
        const outputPath = path.join(matchedFolder, 'pinterest_pin.png');
        await page.screenshot({
            path: outputPath,
            type: 'png'
        });
        
        console.log(`[OK] Infográfico salvo com sucesso em: ${outputPath}`);
    }
    
    await browser.close();
    console.log('\n✅ Todos os infográficos foram renderizados com perfeição!');
}

function generateHTML(info, whatsappLink) {
    const columnsHTML = info.columns.map(col => {
        let typeClass = col.type; // diagram, table, flowchart, list
        let headerColorClass = col.type; // diagram, table, flowchart, list
        
        // Obter ícone correspondente
        let iconSvg = '';
        if (col.icon === 'check') {
            iconSvg = `<svg class="header-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        } else if (col.icon === 'compare') {
            iconSvg = `<svg class="header-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"/></svg>`;
        } else if (col.icon === 'bulb') {
            iconSvg = `<svg class="header-icon" viewBox="0 0 24 24"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/></svg>`;
        }
        
        let contentHTML = '';
        if (col.type === 'diagram' || col.type === 'list') {
            const nodes = col.content.nodes || col.content.items;
            contentHTML = nodes.map(node => `
                <div class="diagram-item">
                    <span class="diagram-label-badge">${node.label}</span>
                    <div class="diagram-desc">${node.desc || node.description}</div>
                </div>
            `).join('');
        } else if (col.type === 'table') {
            const table = col.content;
            const headersHTML = table.headers.map(h => `<th>${h}</th>`).join('');
            const rowsHTML = table.rows.map(row => {
                const cells = Object.keys(row);
                // O primeiro item (criterio) fica à esquerda
                return `
                    <tr>
                        <td class="table-criteria">${row[cells[0]]}</td>
                        ${cells.slice(1).map(c => `<td>${row[c]}</td>`).join('')}
                    </tr>
                `;
            }).join('');
            
            contentHTML = `
                <table class="rich-table">
                    <thead>
                        <tr>${headersHTML}</tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            `;
        } else if (col.type === 'flowchart') {
            const steps = col.content.steps;
            contentHTML = steps.map((step, sIdx) => `
                <div class="flowchart-node">
                    <div class="flowchart-title">${step.step}</div>
                    <div class="flowchart-options">
                        ${step.options.map(opt => `<span class="flowchart-badge">${opt}</span>`).join('')}
                    </div>
                </div>
                ${sIdx < steps.length - 1 ? '<div class="flowchart-arrow">▼</div>' : ''}
            `).join('');
        }
        
        return `
            <div class="column-card">
                <div class="column-header ${headerColorClass}">
                    ${iconSvg}
                    <span>${col.title}</span>
                </div>
                <div class="column-desc">${col.description}</div>
                <div class="column-content">
                    ${contentHTML}
                </div>
            </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-color: #f0f6f6;
          --brand-dark: #072a2a;
          --brand-green: #2d6a4f;
          --brand-blue: #1d3557;
          --brand-orange: #d68c45;
          --text-dark: #2b2d42;
          --border-color: #d8e2dc;
        }
        
        body {
          margin: 0;
          padding: 0;
          width: 1000px;
          height: 1500px;
          font-family: 'Outfit', sans-serif;
          background-color: var(--bg-color);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 50px 40px;
          background-image: radial-gradient(circle, #cedad4 1.5px, transparent 1.5px);
          background-size: 35px 35px;
          position: relative;
          overflow: hidden;
        }
        
        /* Decorativos nas bordas */
        .decor-svg-left {
          position: absolute;
          bottom: -10px;
          left: -10px;
          width: 200px;
          height: 200px;
          opacity: 0.12;
          fill: var(--brand-green);
          z-index: 1;
        }

        .decor-svg-right {
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 180px;
          height: 180px;
          opacity: 0.12;
          fill: var(--brand-orange);
          z-index: 1;
        }

        .decor-paw {
          position: absolute;
          width: 80px;
          height: 80px;
          opacity: 0.04;
          fill: var(--brand-dark);
          z-index: 1;
        }
        
        /* Cabeçalho */
        .header {
          text-align: center;
          z-index: 2;
          margin-bottom: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .title-box {
          background: white;
          border-radius: 25px;
          padding: 22px 45px;
          box-shadow: 0 10px 25px rgba(7, 42, 42, 0.08);
          border: 1px solid rgba(218, 228, 222, 0.9);
          display: inline-block;
          max-width: 820px;
        }
        
        .title {
          font-family: 'Fredoka', sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: var(--brand-dark);
          margin: 0;
          line-height: 1.25;
        }
        
        .subtitle-row {
          margin-top: 15px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }
        
        .subtitle {
          font-size: 16px;
          font-weight: 700;
          color: #5c677d;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .badge {
          background-color: var(--brand-orange);
          color: white;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          box-shadow: 0 4px 8px rgba(214, 140, 69, 0.2);
        }
        
        .schedule {
          font-size: 14px;
          color: #7f8c8d;
          margin-top: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        /* Colunas */
        .columns-container {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          flex-grow: 1;
          z-index: 2;
          margin-bottom: 25px;
          height: 1050px;
        }
        
        .column-card {
          background: white;
          border-radius: 28px;
          flex: 1;
          box-shadow: 0 12px 30px rgba(7, 42, 42, 0.04);
          border: 1px solid rgba(216, 226, 220, 0.7);
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          max-width: 300px;
        }
        
        .column-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 50px;
          padding: 12px 18px;
          color: white;
          font-weight: 700;
          font-size: 20px;
          margin-bottom: 18px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.06);
        }
        
        .column-header.diagram, .column-header.list { background-color: var(--brand-green); }
        .column-header.table { background-color: var(--brand-blue); }
        .column-header.flowchart { background-color: var(--brand-orange); }
        
        .header-icon {
          width: 22px;
          height: 22px;
          fill: white;
        }

        .column-desc {
          font-size: 13px;
          color: #5c677d;
          text-align: center;
          margin-bottom: 22px;
          line-height: 1.45;
          font-weight: 500;
        }
        
        .column-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          gap: 15px;
        }
        
        /* Diagramas / Listas */
        .diagram-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background-color: #f7faf8;
          border-radius: 16px;
          padding: 12px 15px;
          border-left: 5px solid var(--brand-green);
        }
        
        .diagram-label-badge {
          font-weight: 700;
          font-size: 15px;
          color: var(--brand-green);
        }
        
        .diagram-desc {
          font-size: 13px;
          color: var(--text-dark);
          line-height: 1.45;
        }
        
        /* Tabela */
        .rich-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }
        
        .rich-table th {
          background-color: #f1f5f9;
          color: var(--brand-blue);
          font-weight: 700;
          padding: 10px 5px;
          border-bottom: 2px solid var(--border-color);
          font-size: 12px;
        }
        
        .rich-table td {
          padding: 12px 5px;
          border-bottom: 1px solid #f1f5f9;
          color: var(--text-dark);
          line-height: 1.4;
        }
        
        .rich-table tr:last-child td {
          border-bottom: none;
        }
        
        .table-criteria {
          font-weight: 700;
          color: #334155 !important;
          text-align: left !important;
          background-color: #f8fafc;
          padding-left: 8px !important;
        }
        
        /* Fluxograma */
        .flowchart-node {
          background: #fffbfa;
          border: 1.5px dashed var(--brand-orange);
          border-radius: 18px;
          padding: 14px 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(214, 140, 69, 0.05);
        }
        
        .flowchart-arrow {
          align-self: center;
          color: var(--brand-orange);
          font-weight: 800;
          font-size: 18px;
        }
        
        .flowchart-title {
          font-weight: 800;
          font-size: 14px;
          color: var(--brand-orange);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        
        .flowchart-options {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
        }
        
        .flowchart-badge {
          background: white;
          border: 1px solid #f4a261;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #e76f51;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        
        /* Rodapé */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
          border-top: 1px solid rgba(216, 226, 220, 0.8);
          padding-top: 25px;
        }
        
        .cta-button {
          background-color: #25d366;
          color: white;
          border-radius: 30px;
          padding: 14px 32px;
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.25);
          text-decoration: none;
        }
        
        .cta-icon {
          width: 26px;
          height: 26px;
          fill: white;
        }
        
        .footer-right {
          text-align: right;
        }
        
        .hashtags {
          font-size: 16px;
          font-weight: 700;
          color: var(--brand-green);
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <!-- Decorativos de Fundo (Pegadas e Silhuetas) -->
      <svg class="decor-svg-left" viewBox="0 0 24 24">
        <!-- Prato de comida pet de fundo -->
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      </svg>
      <svg class="decor-svg-right" viewBox="0 0 24 24">
        <!-- Plantinha de fundo -->
        <path d="M12 3c-1.2 0-2.4 1.1-2.4 2.4 0 1.2 1.2 2.4 2.4 2.4s2.4-1.2 2.4-2.4C14.4 4.1 13.2 3 12 3zm0 6c-1.2 0-2.4 1.1-2.4 2.4 0 1.2 1.2 2.4 2.4 2.4s2.4-1.2 2.4-2.4C14.4 10.1 13.2 9 12 9zm0 6c-1.2 0-2.4 1.1-2.4 2.4 0 1.2 1.2 2.4 2.4 2.4s2.4-1.2 2.4-2.4C14.4 16.1 13.2 15 12 15z"/>
      </svg>

      <!-- Pegadas de pet aleatórias -->
      <svg class="decor-paw" style="top: 15%; left: 8%;" viewBox="0 0 24 24"><path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4 1-.5 3-2 3-4 0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5.67-1.5 1.5s1 2.5 1.5 3c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5 0 1 1 2.5 1.5 3c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5zm-11-4c-.83 0-1.5.67-1.5 1.5S5 11.5 5.5 12c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5zm13 0c-.83 0-1.5.67-1.5 1.5 0 1 1 2.5 1.5 3c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5z"/></svg>
      <svg class="decor-paw" style="top: 45%; right: 5%;" viewBox="0 0 24 24"><path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4 1-.5 3-2 3-4 0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5.67-1.5 1.5s1 2.5 1.5 3c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5 0 1 1 2.5 1.5 3c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5zm-11-4c-.83 0-1.5.67-1.5 1.5S5 11.5 5.5 12c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5zm13 0c-.83 0-1.5.67-1.5 1.5 0 1 1 2.5 1.5 3c.5-.5 1.5-2 1.5-3 0-.83-.67-1.5-1.5-1.5z"/></svg>

      <!-- Cabeçalho -->
      <div class="header">
        <div class="title-box">
          <h1 class="title">${info.header.title}</h1>
        </div>
        <div class="subtitle-row">
          <span class="subtitle">${info.header.subtitle}</span>
          <span class="badge">${info.header.category}</span>
        </div>
        <div class="schedule">
          <svg style="width:16px;height:16px;fill:#7f8c8d;" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
          <span>${info.header.schedule}</span>
        </div>
      </div>
      
      <!-- Colunas do Infográfico -->
      <div class="columns-container">
        ${columnsHTML}
      </div>
      
      <!-- Rodapé -->
      <div class="footer">
        <div class="cta-button">
          <!-- WhatsApp Icon -->
          <svg class="cta-icon" viewBox="0 0 24 24">
            <path d="M12.03 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.28 4.9L2.03 22l5.25-1.37c1.4.77 2.99 1.2 4.75 1.2 5.52 0 10-4.48 10-10S17.55 2 12.03 2zm6.75 14.19c-.27.76-1.35 1.39-1.85 1.45-.48.06-.97.12-3.13-.73-2.18-.86-3.83-2.95-4.88-4.4-.1-.15-.85-1.15-.85-2.18 0-1.04.54-1.54.73-1.75.19-.21.49-.33.74-.33.08 0 .16.01.23.01.19.01.46-.04.7.54.26.64.9 2.18.98 2.34.08.16.13.35.03.55-.1.2-.24.32-.38.48-.15.16-.3.33-.43.49-.15.16-.31.34-.13.66.18.3 1.01 1.66 2.16 2.69.95.85 1.75 1.11 2 1.22.25.11.48.08.66-.12.18-.21.79-.92.99-1.23.21-.31.41-.26.7-.15.3.11 1.91.9 2.24 1.06.33.16.54.24.63.38.08.14.08.81-.19 1.57z"/>
          </svg>
          <span>${info.footer.cta_text}</span>
        </div>
        <div class="footer-right">
          <div class="hashtags">${info.footer.hashtags}</div>
        </div>
      </div>
    </body>
    </html>
    `;
}

renderAll().catch(err => {
    console.error('[FATAL] Erro ao executar renderizador de infográficos:', err);
});
