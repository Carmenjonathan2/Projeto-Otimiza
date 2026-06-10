const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting Native Status Test...");

const client = new Client({
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.join(__dirname, '../4-Time-Casa/perfil_aika'),
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

client.on('ready', async () => {
    console.log("✅ Client is ready!");
    
    try {
        console.log("Step 1: Sending Text Status...");
        const textMsg = await client.sendMessage('status@broadcast', 'Teste de automação status texto natively');
        console.log("✅ Text Status sent! Message ID:", textMsg ? textMsg.id.id : 'null');
    } catch (err) {
        console.error("❌ Error sending text status:", err.message);
    }

    try {
        console.log("Step 2: Sending Media Status...");
        const imagePath = path.join(__dirname, '../1-Farmacia-Ecommerce/vitrine-virtual/posts_prontos/post_10169929269536.png');
        if (!fs.existsSync(imagePath)) {
            console.error("Image file not found at:", imagePath);
            client.destroy();
            process.exit(1);
        }
        
        console.log("Reading test image...");
        const media = MessageMedia.fromFilePath(imagePath);
        
        console.log("Sending media status via client.sendMessage...");
        const mediaMsg = await client.sendMessage('status@broadcast', media);
        console.log("✅ Media Status sent successfully! Message ID:", mediaMsg ? mediaMsg.id.id : 'null');
        
    } catch (err) {
        console.error("❌ Error sending media status:", err.message);
    }
    
    console.log("Waiting 10 seconds...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log("Destroying client...");
    await client.destroy();
    console.log("Finished test.");
    process.exit(0);
});

client.on('qr', () => {
    console.log("❌ QR Code event fired! WhatsApp is not authenticated!");
    client.destroy();
    process.exit(1);
});

client.initialize();
