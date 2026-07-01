const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

puppeteer.use(StealthPlugin());

async function run() {
    console.log("Starting google diagnostic...");
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox'
        ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    const url = 'https://www.google.com/search?q=vagas+belo+horizonte';
    console.log("Navigating to: " + url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log("Title: " + title);
    
    const screenshotPath = path.resolve('c:/Users/jonat/OneDrive/Desktop/kyener emprego/google_diag.png');
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved to: " + screenshotPath);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Body text length: " + bodyText.length);
    console.log("First 400 chars of body text:\n" + bodyText.substring(0, 400));
    
    await browser.close();
}

run().catch(err => {
    console.error("Error:", err);
});
