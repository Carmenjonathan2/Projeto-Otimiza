const { Client } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("=== TIRANDO SCREENSHOT DO ESTADO ATUAL ===");

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    },
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: 'c:/Users/jonat/OneDrive/Desktop/Otimiza/perfil_aika',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

client.on('ready', async () => {
    console.log("✅ Cliente pronto!");
    
    try {
        console.log("Aguardando 10 segundos...");
        await new Promise(r => setTimeout(r, 10000));
        
        const screenshotPath = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/scratch/wpp_now.png';
        await client.pupPage.screenshot({ path: screenshotPath });
        console.log("Screenshot do estado atual tirado.");
        
        fs.copyFileSync(screenshotPath, 'C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/wpp_now.png');
        console.log("Copiado para os artefatos.");
        
        // Print text on screen to see what is happening
        const text = await client.pupPage.evaluate(() => {
            return document.body.innerText;
        });
        console.log("TEXT ON SCREEN (truncated):", text.substring(0, 500));
        
    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
    
    await client.destroy();
    process.exit(0);
});

client.initialize();
