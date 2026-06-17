const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting detailed error-tracing status test...");

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
    
    // Log ALL console messages from the page
    client.pupPage.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error' || text.includes('error') || text.includes('failed') || text.includes('STATUS') || text.includes('status')) {
            console.log(`[BROWSER CONSOLE ${type.toUpperCase()}]:`, text);
        }
    });

    try {
        console.log("--- TEST 1: Sending Text Status via sendMessage ---");
        await client.sendMessage('status@broadcast', 'Teste texto ' + new Date().toLocaleTimeString());
        console.log("✅ client.sendMessage resolved successfully.");
    } catch (e) {
        console.error("❌ client.sendMessage rejected:", e);
    }

    try {
        console.log("--- TEST 2: Sending Media Status via Page Evaluate ---");
        const imagePath = path.resolve(__dirname, '../vitrine-virtual/posts_prontos/post_10169929433376.png');
        if (!fs.existsSync(imagePath)) {
            console.error("Test image not found at:", imagePath);
            await client.destroy();
            process.exit(1);
        }
        
        const media = MessageMedia.fromFilePath(imagePath);
        
        await client.pupPage.evaluate(async (mediaData) => {
            console.log("[STATUS] Starting media status send...");
            try {
                const chat = await window.WWebJS.getChat('status@broadcast', { getAsModel: false });
                if (!chat) {
                    console.error("[STATUS] Chat status@broadcast not found");
                    return;
                }
                
                const mediaOptions = await window.WWebJS.processMediaData(mediaData, {
                    sendToStatus: true
                });
                console.log("[STATUS] Media processed. type:", mediaOptions.type);
                
                const participant = window.require('WAWebWidFactory').asUserWidOrThrow(
                    window.require('WAWebUserPrefsMeUser').getMaybeMePnUser()
                );
                
                const newId = await window.require('WAWebMsgKey').newId();
                const newMsgKey = new (window.require('WAWebMsgKey'))({
                    from: window.require('WAWebUserPrefsMeUser').getMaybeMePnUser(),
                    to: chat.id,
                    id: newId,
                    participant: participant,
                    selfDir: 'out',
                });
                
                const message = {
                    id: newMsgKey,
                    ack: 0,
                    body: '',
                    from: window.require('WAWebUserPrefsMeUser').getMaybeMePnUser(),
                    to: chat.id,
                    local: true,
                    self: 'out',
                    t: parseInt(new Date().getTime() / 1000),
                    isNewMsg: true,
                    type: 'chat',
                    author: participant,
                    messageSecret: window.crypto.getRandomValues(new Uint8Array(32)),
                    cannotBeRanked: window.require('WAWebStatusGatingUtils')?.canCheckStatusRankingPosterGating?.() || false,
                    ...mediaOptions,
                    ...(mediaOptions.toJSON ? mediaOptions.toJSON() : {})
                };
                
                const msg = new (window.require('WAWebCollections').Msg.modelClass)(message);
                const mediaUpdate = (data) => window.require('WAWebMediaUpdateMsg')(data, mediaOptions);
                
                console.log("[STATUS] Triggering sendStatusMediaMsgAction...");
                await window.require('WAWebSendStatusMsgAction').sendStatusMediaMsgAction(msg, mediaUpdate);
                console.log("[STATUS] Triggered successfully!");
            } catch (err) {
                console.error("[STATUS] Error inside evaluation:", err.message, err.stack);
            }
        }, media);
        
        console.log("✅ Page evaluation resolved.");
    } catch (e) {
        console.error("❌ Page evaluation rejected:", e);
    }
    
    console.log("Waiting 20 seconds to capture any delayed console errors...");
    await new Promise(r => setTimeout(r, 20000));
    
    await client.destroy();
    console.log("Finished error-trace test.");
    process.exit(0);
});

client.on('auth_failure', () => {
    console.error("Auth Failure!");
    process.exit(1);
});

client.initialize();
