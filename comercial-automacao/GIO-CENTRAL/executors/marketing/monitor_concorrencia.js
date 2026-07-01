const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PRODUTOS_ALVO = ["NexGard", "Bravecto", "Simparic"];
const OUTPUT_FILE = path.join(__dirname, '..', '..', '..', 'concorrencia_precos.json');

async function monitorarPetz(page, termo) {
    try {
        await page.goto(`https://www.petz.com.br/busca?q=${termo}`, { waitUntil: 'networkidle2' });
        const data = await page.evaluate(() => {
            const firstProduct = document.querySelector('.product-item');
            if (!firstProduct) return null;
            const nome = firstProduct.querySelector('.product-title')?.innerText;
            const preco = firstProduct.querySelector('.current-price')?.innerText;
            return { nome, preco, loja: 'Petz' };
        });
        return data;
    } catch (e) { return null; }
}

async function monitorarCobasi(page, termo) {
    try {
        await page.goto(`https://www.cobasi.com.br/busca?q=${termo}`, { waitUntil: 'networkidle2' });
        const data = await page.evaluate(() => {
            const firstProduct = document.querySelector('.card-product');
            if (!firstProduct) return null;
            const nome = firstProduct.querySelector('.card-product-title')?.innerText;
            const preco = firstProduct.querySelector('.card-product-price')?.innerText;
            return { nome, preco, loja: 'Cobasi' };
        });
        return data;
    } catch (e) { return null; }
}

async function run() {
    console.log(`[INICIO] monitor_concorrencia.js ${new Date().toISOString()}`);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const resultados = [];

    for (const produto of PRODUTOS_ALVO) {
        console.log(`🔎 Pesquisando: ${produto}...`);
        const p = await monitorarPetz(page, produto);
        const c = await monitorarCobasi(page, produto);
        if (p) resultados.push(p);
        if (c) resultados.push(c);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultados, null, 2));
    await browser.close();
    console.log(`[OK] monitor_concorrencia.js ${new Date().toISOString()} — Preços atualizados.`);
}

run();
