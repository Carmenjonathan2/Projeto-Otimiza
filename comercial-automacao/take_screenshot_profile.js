const { Client } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting profile session diagnostic...");

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
    console.log(`[LOADING] ${percent}% - ${message}`);
});

client.on('qr', () => {
    console.log("[EVENT] QR Code event fired! Session is NOT connected!");
});

client.on('ready', () => {
    console.log("[EVENT] Ready event fired! Session IS connected!");
});

client.on('auth_failure', (msg) => {
    console.log("[EVENT] Auth failure:", msg);
});

async function run() {
    try {
        console.log("Initializing client...");
        client.initialize();
        
        console.log("Waiting 60 seconds to allow WhatsApp Web to fully load...");
        for (let i = 1; i <= 6; i++) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            console.log(`... elapsed ${i * 10} seconds`);
            if (client.pupPage) {
                try {
                    const title = await client.pupPage.title();
                    console.log(`   Current page title at ${i*10}s:`, title);
                } catch (e) {
                    console.log(`   Failed to get title at ${i*10}s:`, e.message);
                }
            }
        }
        
        console.log("Taking screenshot...");
        if (client.pupPage) {
            await client.pupPage.screenshot({ path: path.join(__dirname, 'whatsapp_screenshot_profile.png') });
            console.log("Screenshot saved to whatsapp_screenshot_profile.png");
            
            const title = await client.pupPage.title();
            console.log("Final page title:", title);
            
            const content = await client.pupPage.evaluate(() => {
                return document.body ? document.body.innerText : 'null body';
            });
            console.log("Final body text preview:\n", content.substring(0, 500));
        } else {
            console.log("Error: pupPage is not available.");
        }
    } catch (err) {
        console.error("Error during profile diagnostic:", err);
    } finally {
        console.log("Destroying client...");
        try {
            await client.destroy();
        } catch (e) {
            console.log("Ignored error during destroy:", e.message);
        }
        console.log("Done.");
        process.exit(0);
    }
}

run();
