const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("=== MONITORANDO ENVIO E ACK DO STATUS ===");

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
        console.log("Aguardando fim da sincronização...");
        await client.pupPage.waitForFunction(() => {
            return !document.body.innerText.includes('Sincronizando');
        }, { timeout: 180000 });
        
        console.log("Sincronização concluída! Aguardando 10 segundos...");
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
        const msgId = response.id._serialized;
        console.log("✅ client.sendMessage resolvido! ID:", msgId);
        
        console.log("Monitorando o ACK do status na página...");
        const ackStatus = await client.pupPage.evaluate(async (serializedId) => {
            const msg = window.require('WAWebCollections').Msg.get(serializedId);
            if (!msg) return { error: "Mensagem não encontrada na coleção local." };
            
            return new Promise(resolve => {
                if (msg.ack >= 1) {
                    resolve({ ack: msg.ack, local: msg.local, pending: msg.pending });
                    return;
                }
                
                const handler = () => {
                    if (msg.ack >= 1) {
                        msg.off('change:ack', handler);
                        resolve({ ack: msg.ack, local: msg.local, pending: msg.pending });
                    }
                };
                
                msg.on('change:ack', handler);
                
                // Timeout de 45 segundos
                setTimeout(() => {
                    msg.off('change:ack', handler);
                    resolve({ ack: msg.ack, local: msg.local, pending: msg.pending, timeout: true });
                }, 45000);
            });
        }, msgId);
        
        console.log("Resultado do ACK:", JSON.stringify(ackStatus, null, 2));
        
    } catch (e) {
        console.error("❌ Erro no fluxo:", e.message);
    }
    
    await client.destroy();
    console.log("Fim do teste.");
    process.exit(0);
});

client.initialize();
