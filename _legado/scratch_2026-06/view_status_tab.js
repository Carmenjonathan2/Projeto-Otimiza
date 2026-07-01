const { Client } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("=== VISUALIZANDO ABA DE STATUS NO WHATSAPP WEB ===");

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
        console.log("Procurando botões na barra lateral...");
        
        // Wait for the main layout to load
        await client.pupPage.waitForSelector('span[data-icon="status-v3"]', { timeout: 15000 });
        
        console.log("Clicando no botão de Status...");
        await client.pupPage.click('span[data-icon="status-v3"]');
        
        console.log("Aguardando carregamento da aba de Status...");
        await new Promise(r => setTimeout(r, 5000));
        
        const screenshotPath = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/scratch/wpp_status_tab.png';
        await client.pupPage.screenshot({ path: screenshotPath });
        console.log("Screenshot da aba de Status salva em:", screenshotPath);
        
        // Copy screenshot to artifacts so the agent can view it
        const artPath = 'C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/wpp_status_tab.png';
        fs.copyFileSync(screenshotPath, artPath);
        console.log("Screenshot copiado para os artefatos.");
        
    } catch (e) {
        console.error("❌ Erro ao tentar visualizar aba de Status:", e.message);
        
        // Take a fallback screenshot
        const fallbackPath = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/scratch/wpp_status_tab_error.png';
        await client.pupPage.screenshot({ path: fallbackPath });
        fs.copyFileSync(fallbackPath, 'C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/wpp_status_tab_error.png');
        console.log("Screenshot de erro salva.");
    }
    
    await client.destroy();
    process.exit(0);
});

client.initialize();
