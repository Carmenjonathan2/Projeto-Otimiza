const { Client } = require('whatsapp-web.js');
const path = require('path');
const qrcode = require('qrcode-terminal');

console.log("⏳ Preparando o ambiente de Login da Aika...");

const client = new Client({
    authTimeoutMs: 0, // Sem limite de tempo para autenticar
    puppeteer: { 
        headless: false, // Janela visível para você escanear
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.join(__dirname, 'perfil_aika'),
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ],
        timeout: 0 // Impede que o navegador feche por lentidão
    }
});

client.on('qr', (qr) => {
    console.log("\n⚠️ O QR CODE ESTÁ NA TELA DO CHROME! ESCANEIE COM O CELULAR DA AIKA.");
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log("\n✅ SUCESSO! Aika está conectada.");
    console.log("A sessão foi salva. Encerrando esta janela de configuração em 5 segundos...");
    setTimeout(() => {
        client.destroy();
        process.exit(0);
    }, 5000);
});

client.on('authenticated', () => {
    console.log("\n🔐 Autenticado! Salvando a sua sessão na pasta...");
});

client.on('auth_failure', msg => {
    console.error("\n❌ Falha na Autenticação", msg);
});

client.initialize().catch(err => {
    console.error("Erro fatal ao iniciar:", err);
});
