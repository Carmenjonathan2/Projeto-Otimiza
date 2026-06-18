const { Client } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting fresh session diagnostic...");

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    },
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        // No userDataDir to test if fresh Chrome works!
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

client.on('qr', () => {
    console.log("QR Code event fired!");
});

async function run() {
    try {
        console.log("Initializing client...");
        client.initialize();
        
        console.log("Waiting 20 seconds for page to load...");
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        console.log("Taking screenshot...");
        if (client.pupPage) {
            await client.pupPage.screenshot({ path: path.join(__dirname, 'whatsapp_screenshot_fresh.png') });
            console.log("Screenshot saved to whatsapp_screenshot_fresh.png");
            
            const title = await client.pupPage.title();
            console.log("Page title:", title);
        } else {
            console.log("Error: pupPage is not available.");
        }
    } catch (err) {
        console.error("Error during fresh diagnostic:", err);
    } finally {
        console.log("Destroying client...");
        await client.destroy();
        console.log("Done.");
        process.exit(0);
    }
}

run();
