const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("=== DIAGNÓSTICO DE REDE NO ENVIO DE STATUS ===");

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
    
    // Listen to network request failures
    client.pupPage.on('requestfailed', request => {
        console.error(`[NET_ERROR] URL: ${request.url()} | Error: ${request.failure()?.errorText}`);
    });
    
    // Listen to all console errors
    client.pupPage.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`[CONSOLE_ERROR]:`, msg.text());
        }
    });

    try {
        console.log("Aguardando fim da sincronização...");
        await client.pupPage.waitForFunction(() => {
            return !document.body.innerText.includes('Sincronizando');
        }, { timeout: 180000 });
        
        console.log("Sincronização concluída! Aguardando 10 segundos para carregar o Status...");
        await new Promise(r => setTimeout(r, 10000));
        
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
        console.log("✅ client.sendMessage resolvido! ID:", response.id._serialized);
        
        console.log("Aguardando 20 segundos para garantir a transmissão...");
        await new Promise(r => setTimeout(r, 20000));
        
    } catch (e) {
        console.error("❌ Erro no fluxo:", e.message);
    }
    
    await client.destroy();
    console.log("Fim do teste.");
    process.exit(0);
});

client.initialize();
