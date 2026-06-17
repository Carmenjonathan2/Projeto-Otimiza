const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

console.log("=== INICIANDO TESTE DE STATUS COM METODO NATIVO ===");

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

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Carregando tela do WhatsApp Web: ${percent}% - ${message}`);
});

client.on('change_state', (state) => {
    console.log(`🔄 Estado alterado para: ${state}`);
});

client.on('authenticated', () => {
    console.log("🔐 Autenticado com sucesso!");
});

client.on('auth_failure', (msg) => {
    console.error("❌ Falha na autenticação:", msg);
});

client.on('disconnected', (reason) => {
    console.error("🔌 Desconectado:", reason);
});

client.on('ready', async () => {
    console.log("✅ Cliente pronto!");
    console.log("Número logado:", client.info.wid.user);

    // Capture console errors/logs from page
    client.pupPage.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' || text.includes('failed') || text.includes('STATUS') || text.includes('status') || text.includes('media')) {
            console.log(`[CONSOLEG ${msg.type().toUpperCase()}]:`, text);
        }
    });

    try {
        const postsDir = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/vitrine-virtual/posts_prontos';
        const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.png'));
        
        if (files.length === 0) {
            console.error("Nenhuma imagem gerada encontrada em posts_prontos!");
            await client.destroy();
            process.exit(1);
        }
        
        const testImage = path.join(postsDir, files[0]);
        console.log(`Imagem de teste selecionada: ${testImage}`);
        
        const media = MessageMedia.fromFilePath(testImage);
        
        console.log("Enviando mídia para status@broadcast usando client.sendMessage...");
        const response = await client.sendMessage('status@broadcast', media);
        console.log("✅ client.sendMessage resolvido com sucesso!");
        console.log("Mensagem ID:", response.id._serialized);
        
        console.log("Aguardando 10 segundos para processar e atualizar...");
        await new Promise(r => setTimeout(r, 10000));
        
        // Verificar se aparece na coleção de status ativa
        const statusInfo = await client.pupPage.evaluate(() => {
            const meUser = window.require('WAWebUserPrefsMeUser').getMaybeMePnUser();
            if (!meUser) return { error: "Me user não encontrado" };
            
            const myWid = meUser.toString();
            const statusCollection = window.require('WAWebCollections').Status;
            
            const myStatus = statusCollection.get(myWid) || statusCollection.toArray().find(s => s.id._serialized === myWid || s.id.user === meUser.user);
            
            if (!myStatus) {
                return {
                    hasStatus: false,
                    totalCollectionSize: statusCollection.length
                };
            }
            
            const msgs = myStatus.msgs.toArray().map(msg => ({
                id: msg.id.id,
                type: msg.type,
                timestamp: msg.t
            }));
            
            return {
                hasStatus: true,
                id: myStatus.id._serialized,
                totalMsgs: msgs.length,
                msgs: msgs
            };
        });
        
        console.log("Coleção de status atualizada:", JSON.stringify(statusInfo, null, 2));
        
        const screenshotPath = 'c:/Users/jonat/OneDrive/Desktop/Otimiza/scratch/wpp_status_sent_check.png';
        await client.pupPage.screenshot({ path: screenshotPath });
        console.log("Screenshot de verificação salva em:", screenshotPath);
        
    } catch (e) {
        console.error("❌ Ocorreu um erro no teste:", e);
    }
    
    await client.destroy();
    console.log("Teste finalizado.");
    process.exit(0);
});

console.log("Chamando client.initialize()...");
client.initialize().catch(err => {
    console.error("Erro ao inicializar:", err);
});
