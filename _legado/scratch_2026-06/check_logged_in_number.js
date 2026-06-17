const { Client } = require('whatsapp-web.js');
const path = require('path');

console.log("=== DIAGNOSTICO DE CONEXAO WHATSAPP ===");
console.log("Inicializando o cliente whatsapp-web.js...");

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    },
    puppeteer: { 
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.resolve(__dirname, '../perfil_aika'),
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

client.on('qr', (qr) => {
    console.log("⚠️ QR Code recebido! O WhatsApp não está conectado a nenhuma sessão ativa.");
    client.destroy();
    process.exit(0);
});

client.on('ready', () => {
    console.log("✅ Conectado com sucesso!");
    console.log("Número de Telefone:", client.info.wid.user);
    console.log("PushName:", client.info.pushname);
    console.log("Plataforma:", client.info.platform);
    client.destroy();
    process.exit(0);
});

client.on('authenticated', () => {
    console.log("🔐 Autenticado! Carregando dados da sessão...");
});

client.on('auth_failure', (msg) => {
    console.log("❌ Falha na autenticação:", msg);
    client.destroy();
    process.exit(0);
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Carregando tela do WhatsApp Web: ${percent}% - ${message}`);
});

client.on('change_state', (state) => {
    console.log(`🔄 Estado alterado para: ${state}`);
});

client.on('disconnected', (reason) => {
    console.log(`🔌 Desconectado: ${reason}`);
    client.destroy();
    process.exit(0);
});

console.log("Chamando client.initialize()...");
client.initialize()
    .then(() => {
        console.log("Promessa de inicialização resolvida.");
    })
    .catch(err => {
        console.error("❌ Erro ao inicializar o cliente:", err);
        process.exit(1);
    });

// Monitorando se o processo fica inativo por muito tempo
setTimeout(() => {
    console.log("⏰ Tempo limite de 60 segundos atingido no script de diagnóstico.");
    if (client.pupBrowser) {
        console.log("Fechando navegador por tempo limite...");
        client.destroy().then(() => process.exit(2));
    } else {
        process.exit(2);
    }
}, 60000);
