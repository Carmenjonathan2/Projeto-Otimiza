const { Client } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting screenshot diagnostic...");

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    },
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.join(__dirname, 'perfil_aika'),
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

client.on('loading_screen', (percent, message) => {
    console.log(`Loading screen: ${percent}% - ${message}`);
});

client.on('qr', () => {
    console.log("QR Code event fired!");
});

client.on('ready', () => {
    console.log("Ready event fired!");
});

async function run() {
    try {
        console.log("Initializing client...");
        client.initialize();
        
        console.log("Waiting 20 seconds for page to load...");
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        console.log("Taking screenshot...");
        if (client.pupPage) {
            await client.pupPage.screenshot({ path: path.join(__dirname, 'whatsapp_screenshot.png') });
            console.log("Screenshot saved to whatsapp_screenshot.png");
            
            const title = await client.pupPage.title();
            console.log("Page title:", title);
            
            const content = await client.pupPage.evaluate(() => document.body.innerText);
            console.log("First 500 chars of body text:\n", content.substring(0, 500));
        } else {
            console.log("Error: pupPage is not available.");
        }
    } catch (err) {
        console.error("Error during screenshot diagnostic:", err);
    } finally {
        console.log("Destroying client...");
        await client.destroy();
        console.log("Done.");
        process.exit(0);
    }
}

run();
