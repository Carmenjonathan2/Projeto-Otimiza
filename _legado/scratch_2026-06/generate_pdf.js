const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
    console.log("🚀 Iniciando conversão de HTML para PDF via Puppeteer...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Caminhos absolutos
    const htmlPath = 'file:///' + path.resolve('c:/Users/jonat/OneDrive/Desktop/kyener emprego/curriculo_comercial.html').replace(/\\/g, '/');
    const pdfPath = path.resolve('c:/Users/jonat/OneDrive/Desktop/kyener emprego/Kyenner_Curriculo_Comercial.pdf');
    
    console.log(`🔗 Carregando HTML: ${htmlPath}`);
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });
    
    console.log("📄 Gerando PDF...");
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0.4in',
            right: '0.4in',
            bottom: '0.4in',
            left: '0.4in'
        }
    });
    
    console.log(`✅ PDF salvo com sucesso em: ${pdfPath}`);
    await browser.close();
}

run().catch(err => {
    console.error("❌ Erro ao gerar PDF:", err);
    process.exit(1);
});
