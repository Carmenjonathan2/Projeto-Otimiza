const { Client } = require('whatsapp-web.js');

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
        const lidInfo = await client.pupPage.evaluate(() => {
            const meLid = window.require('WAWebUserPrefsMeUser').getMaybeMeLidUser();
            const mePn = window.require('WAWebUserPrefsMeUser').getMaybeMePnUser();
            const statusCollection = window.require('WAWebCollections').Status;
            
            const lidStr = meLid ? meLid.toString() : null;
            const pnStr = mePn ? mePn.toString() : null;
            
            const myStatusLid = lidStr ? statusCollection.get(lidStr) : null;
            const myStatusPn = pnStr ? statusCollection.get(pnStr) : null;
            
            return {
                myLid: lidStr,
                myPn: pnStr,
                myStatusLidExists: !!myStatusLid,
                myStatusPnExists: !!myStatusPn,
                myStatusLidMsgs: myStatusLid ? myStatusLid.msgs.toArray().map(m => ({ id: m.id.id, t: m.t, type: m.type })) : [],
                myStatusPnMsgs: myStatusPn ? myStatusPn.msgs.toArray().map(m => ({ id: m.id.id, t: m.t, type: m.type })) : []
            };
        });
        
        console.log("LID INFO:", JSON.stringify(lidInfo, null, 2));
    } catch (e) {
        console.error("Error during evaluation:", e);
    }
    
    await client.destroy();
    process.exit(0);
});

client.initialize();
