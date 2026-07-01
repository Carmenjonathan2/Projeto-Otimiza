const { Client } = require('whatsapp-web.js');
const path = require('path');

console.log("Checking WhatsApp session info for perfil_aika (without version pin)...");
const client = new Client({
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: 'c:/Users/jonat/OneDrive/Desktop/Otimiza/perfil_aika',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', () => {
    const info = client.info;
    console.log("✅ CONNECTED!");
    console.log("Phone number:", info.wid.user);
    console.log("Pushname:", info.pushname);
    client.destroy();
    process.exit(0);
});

client.on('qr', () => {
    console.log("⚠️ QR Code requested (no active session found).");
    client.destroy();
    process.exit(0);
});

client.on('auth_failure', (msg) => {
    console.log("❌ Auth failure:", msg);
    client.destroy();
    process.exit(0);
});

client.initialize();
