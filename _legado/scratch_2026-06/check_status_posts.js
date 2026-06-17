const { Client } = require('whatsapp-web.js');
const path = require('path');

console.log("Checking currently active status posts on WhatsApp Web...");

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    },
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: 'c:/Users/jonat/OneDrive/Desktop/Otimiza/perfil_aika',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', async () => {
    console.log("✅ Client is ready!");
    
    try {
        const statusInfo = await client.pupPage.evaluate(() => {
            const meUser = window.require('WAWebUserPrefsMeUser').getMaybeMePnUser();
            if (!meUser) return { error: "Me user not found" };
            
            const myWid = meUser.toString();
            const statusCollection = window.require('WAWebCollections').Status;
            
            // Find our own status in the collection
            const myStatus = statusCollection.get(myWid) || statusCollection.toArray().find(s => s.id._serialized === myWid || s.id.user === meUser.user);
            
            if (!myStatus) {
                return {
                    hasStatus: false,
                    totalCollectionSize: statusCollection.length,
                    collectionKeys: statusCollection.toArray().map(s => s.id._serialized)
                };
            }
            
            const msgs = myStatus.msgs.toArray().map(msg => ({
                id: msg.id.id,
                type: msg.type,
                timestamp: msg.t,
                body: msg.body || ""
            }));
            
            return {
                hasStatus: true,
                id: myStatus.id._serialized,
                totalMsgs: msgs.length,
                msgs: msgs
            };
        });
        
        console.log("RESULT:", JSON.stringify(statusInfo, null, 2));
        
        // Take a screenshot to visualize if there are any popups or errors
        const screenshotPath = path.resolve(__dirname, 'wpp_status_check.png');
        await client.pupPage.screenshot({ path: screenshotPath });
        console.log("Screenshot saved to:", screenshotPath);
        
    } catch (err) {
        console.error("Error during evaluation:", err);
    }
    
    await client.destroy();
    process.exit(0);
});

client.on('auth_failure', () => {
    console.error("Auth Failure!");
    process.exit(1);
});

client.initialize();
