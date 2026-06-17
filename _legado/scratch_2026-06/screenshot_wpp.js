const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.resolve(__dirname, '../perfil_aika'),
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    });

    const page = await browser.newPage();
    console.log("Navigating to web.whatsapp.com...");
    try {
        await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 60000 });
        console.log("Navigation complete. Waiting 10 seconds...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log("Current URL:", page.url());
        
        const screenshotPath = path.resolve(__dirname, 'wpp_screenshot.png');
        await page.screenshot({ path: screenshotPath });
        console.log("Screenshot saved to:", screenshotPath);
    } catch (err) {
        console.error("Error during navigation/screenshot:", err);
    } finally {
        await browser.close();
        console.log("Browser closed.");
    }
}

run().catch(console.error);
