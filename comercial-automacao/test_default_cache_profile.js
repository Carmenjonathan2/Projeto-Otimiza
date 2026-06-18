const { Client } = require('whatsapp-web.js');
const path = require('path');

console.log("Starting default cache profile session diagnostic...");

const client = new Client({
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

async function run() {
    try {
        console.log("Initializing client...");
        client.initialize();
        
        console.log("Waiting 30 seconds for session to load...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        console.log("Taking screenshot...");
        if (client.pupPage) {
            await client.pupPage.screenshot({ path: path.join(__dirname, 'whatsapp_screenshot_default_profile.png') });
            console.log("Screenshot saved to whatsapp_screenshot_default_profile.png");
            
            const title = await client.pupPage.title();
            console.log("Page title:", title);
        } else {
            console.log("Error: pupPage is not available.");
        }
    } catch (err) {
        console.error("Error during default cache diagnostic:", err);
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
