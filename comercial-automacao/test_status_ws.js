const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("Starting Status Diagnostic Test in Workspace...");

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    },
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.join(__dirname, '../4-Time-Casa/perfil_aika'),
        protocolTimeout: 60000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', async () => {
    console.log("✅ Client is ready!");
    
    try {
        console.log("Step 1: Testing Text Status...");
        // Send a text status update
        await client.sendMessage('status@broadcast', 'Teste de automação status texto');
        console.log("✅ Text Status sent successfully!");
    } catch (err) {
        console.error("❌ Error sending text status:", err);
    }

    try {
        console.log("Step 2: Testing Media Status (with debug logging inside page)...");
        const imagePath = path.join(__dirname, '../1-Farmacia-Ecommerce/vitrine-virtual/posts_prontos/post_10169929433376.png');
        if (!fs.existsSync(imagePath)) {
            console.error("Image file not found at:", imagePath);
            client.destroy();
            process.exit(1);
        }
        
        console.log("Reading media file...");
        const media = MessageMedia.fromFilePath(imagePath);
        
        console.log("Injecting custom page log listener...");
        client.pupPage.on('console', msg => {
            const txt = msg.text();
            if (txt.includes('[STATUS-DBG]')) {
                console.log("BROWSER LOG:", txt);
            }
        });

        console.log("Evaluating media upload and status send directly with logging...");
        
        await client.pupPage.evaluate(async (mediaData) => {
            console.log("[STATUS-DBG] Starting evaluation of media status...");
            const chat = await window.WWebJS.getChat('status@broadcast', { getAsModel: false });
            console.log("[STATUS-DBG] Got status chat:", !!chat);
            
            console.log("[STATUS-DBG] Processing media data...");
            const mediaOptions = await window.WWebJS.processMediaData(mediaData, {
                sendToStatus: true
            });
            console.log("[STATUS-DBG] Processed media data successfully! filehash:", mediaOptions.filehash);
            
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
            console.log("[STATUS-DBG] Created Msg model. Msg type:", msg.type);
            
            const mediaUpdate = (data) => window.require('WAWebMediaUpdateMsg')(data, mediaOptions);
            
            console.log("[STATUS-DBG] Triggering sendStatusMediaMsgAction...");
            window.require('WAWebSendStatusMsgAction').sendStatusMediaMsgAction(msg, mediaUpdate);
            console.log("[STATUS-DBG] sendStatusMediaMsgAction triggered (no-await)!");
            return true;
        }, media);

        console.log("✅ Direct evaluation call finished successfully!");
    } catch (err) {
        console.error("❌ Error sending media status:", err);
    }
    
    console.log("Destroying client...");
    await client.destroy();
    console.log("Finished test.");
    process.exit(0);
});

client.on('auth_failure', () => {
    console.error("Auth Failure!");
    process.exit(1);
});

client.initialize();
