const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("=== TESTANDO ENVIO DE STATUS APÓS SINCRONIZAÇÃO COMPLETA ===");

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
        console.log("Aguardando fim da sincronização de mensagens...");
        
        // Wait until 'Sincronizando' disappears from the body text
        await client.pupPage.waitForFunction(() => {
            return !document.body.innerText.includes('Sincronizando');
        }, { timeout: 180000 });
        
        console.log("Sincronização concluída! Aguardando mais 5 segundos para estabilizar...");
        await new Promise(r => setTimeout(r, 5000));
        
        // Check if status icon is available now
        const hasStatusIcon = await client.pupPage.evaluate(() => {
            return !!document.querySelector('span[data-icon="status-v3"]');
        });
        console.log("Ícone de status disponível no DOM:", hasStatusIcon);
        
        // Send a status update
        const postsDir = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/vitrine-virtual/posts_prontos';
        const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.png'));
        
        if (files.length === 0) {
            console.error("Nenhuma imagem em posts_prontos!");
            await client.destroy();
            process.exit(1);
        }
        
        const testImage = path.join(postsDir, files[0]);
        console.log(`Subindo status com a imagem: ${testImage}`);
        
        const media = MessageMedia.fromFilePath(testImage);
        
        console.log("Enviando status...");
        const response = await client.sendMessage('status@broadcast', media);
        console.log("✅ Enviado com sucesso! ID:", response.id._serialized);
        
        console.log("Aguardando 10 segundos...");
        await new Promise(r => setTimeout(r, 10000));
        
        // Verify status tab
        if (hasStatusIcon) {
            console.log("Navegando para a aba de status...");
            await client.pupPage.click('span[data-icon="status-v3"]');
            await new Promise(r => setTimeout(r, 5000));
            
            const screenshotPath = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/scratch/wpp_status_synced_view.png';
            await client.pupPage.screenshot({ path: screenshotPath });
            fs.copyFileSync(screenshotPath, 'C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/wpp_status_synced_view.png');
            console.log("Screenshot salvo nos artefatos.");
        }
        
    } catch (e) {
        console.error("❌ Erro no fluxo:", e.message);
    }
    
    await client.destroy();
    process.exit(0);
});

client.initialize();
