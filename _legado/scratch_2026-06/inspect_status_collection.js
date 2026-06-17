const { Client } = require('whatsapp-web.js');
const path = require('path');

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
    console.log("✅ Client is ready!");
    
    try {
        console.log("Aguardando fim da sincronização de mensagens...");
        await client.pupPage.waitForFunction(() => {
            return !document.body.innerText.includes('Sincronizando');
        }, { timeout: 180000 });
        console.log("Sincronização concluída! Aguardando 10 segundos...");
        await new Promise(r => setTimeout(r, 10000));

        const collectionInfo = await client.pupPage.evaluate(() => {
            const statusCollection = window.require('WAWebCollections').Status;
            const items = statusCollection.toArray();
            
            return items.map(item => {
                const msgs = item.msgs ? item.msgs.toArray().map(m => ({
                    id: m.id.id,
                    type: m.type,
                    timestamp: m.t,
                    ack: m.ack,
                    pending: m.pending,
                    local: m.local
                })) : [];
                
                return {
                    id: item.id._serialized,
                    unreadCount: item.unreadCount,
                    totalMsgs: msgs.length,
                    msgs: msgs
                };
            });
        });
        
        console.log("STATUS COLLECTION ITEMS:");
        console.log(JSON.stringify(collectionInfo, null, 2));
    } catch (e) {
        console.error("Error during evaluation:", e.message);
    }
    
    await client.destroy();
    process.exit(0);
});

client.initialize().catch(console.error);
