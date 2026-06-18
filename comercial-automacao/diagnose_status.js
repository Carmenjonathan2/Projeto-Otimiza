const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting WhatsApp Status diagnosis...");

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
    console.log("✅ Client is ready! Starting status upload...");
    
    // Listen to all browser console messages
    client.pupPage.on('console', msg => {
        console.log(`[BROWSER-CONSOLE] [${msg.type()}] ${msg.text()}`);
    });

    client.pupPage.on('pageerror', err => {
        console.log(`[BROWSER-ERROR] ${err.toString()}`);
    });

    try {
        const imagePath = path.join(__dirname, '../1-Farmacia-Ecommerce/vitrine-virtual/posts_prontos/post_10169929269536.png');
        if (!fs.existsSync(imagePath)) {
            console.error("Image file not found at:", imagePath);
            client.destroy();
            process.exit(1);
        }
        
        console.log("Reading test image...");
        const media = MessageMedia.fromFilePath(imagePath);
        
        console.log("Injecting sendMediaStatus evaluation...");
        
        const result = await client.pupPage.evaluate(async (mediaData) => {
            console.log("Evaluating status send inside page...");
            try {
                const chat = await window.WWebJS.getChat('status@broadcast', { getAsModel: false });
                if (!chat) {
                    console.error("Status broadcast chat not found!");
                    return { success: false, error: 'Status broadcast chat not found' };
                }
                
                console.log("Processing media data...");
                const mediaOptions = await window.WWebJS.processMediaData(mediaData, {
                    sendToStatus: true
                });
                console.log("Processed media data. Filehash:", mediaOptions.filehash);
                
                const meUser = window.require('WAWebUserPrefsMeUser').getMaybeMePnUser();
                console.log("Me user:", meUser ? meUser.toString() : 'null');
                
                const participant = window.require('WAWebWidFactory').asUserWidOrThrow(meUser);
                
                const newId = await window.require('WAWebMsgKey').newId();
                const newMsgKey = new (window.require('WAWebMsgKey'))({
                    from: meUser,
                    to: chat.id,
                    id: newId,
                    participant: participant,
                    selfDir: 'out',
                });
                
                const message = {
                    id: newMsgKey,
                    ack: 0,
                    body: '',
                    from: meUser,
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
                console.log("Created Msg model type:", msg.type);
                
                const mediaUpdate = (data) => window.require('WAWebMediaUpdateMsg')(data, mediaOptions);
                
                console.log("Calling sendStatusMediaMsgAction...");
                // Await it to see if it throws or hangs
                const sendResult = await window.require('WAWebSendStatusMsgAction').sendStatusMediaMsgAction(msg, mediaUpdate);
                console.log("sendStatusMediaMsgAction call resolved. Result:", sendResult);
                return { success: true, result: sendResult };
            } catch (err) {
                console.error("Error inside evaluate:", err.message, err.stack);
                return { success: false, error: err.message, stack: err.stack };
            }
        }, media);

        console.log("Evaluation result:", result);
        
        console.log("Waiting 10 seconds to monitor console logs...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log("Taking post-send screenshot...");
        await client.pupPage.screenshot({ path: path.join(__dirname, 'whatsapp_screenshot_status_diag.png') });
        console.log("Screenshot saved to whatsapp_screenshot_status_diag.png");
        
    } catch (err) {
        console.error("Error during diagnosis run:", err);
    } finally {
        console.log("Destroying client...");
        await client.destroy();
        console.log("Done.");
        process.exit(0);
    }
});

client.on('qr', () => {
    console.log("❌ QR Code event fired! WhatsApp is not authenticated!");
    client.destroy();
    process.exit(1);
});

client.on('auth_failure', (msg) => {
    console.log("❌ Auth failure:", msg);
    process.exit(1);
});

client.initialize();
