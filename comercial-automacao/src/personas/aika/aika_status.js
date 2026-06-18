const { Client, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log("[SNC] Aika B2C: Inicializando o Cérebro do WhatsApp para Status...");

try {
    // Release any stale Chrome profile locks to prevent Puppeteer timeouts
    execSync('powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name = \'chrome.exe\'\\" | Where-Object { $_.CommandLine -like \'*perfil_aika*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"', { stdio: 'ignore' });
} catch (err) {
    // Ignore errors if no processes are locked
}


const postsDir = path.resolve(__dirname, '../../../../1-Farmacia-Ecommerce/vitrine-virtual/posts_prontos');
const enviadosDir = path.resolve(__dirname, '../../../../1-Farmacia-Ecommerce/vitrine-virtual/posts_enviados');

// Garante que a pasta de enviados existe
if (!fs.existsSync(enviadosDir)) {
    fs.mkdirSync(enviadosDir, { recursive: true });
}

// Verifica se existem posts para enviar
if (!fs.existsSync(postsDir)) {
    console.log("[SNC] Aika B2C: Pasta de posts prontos não encontrada.");
    process.exit(0);
}

const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.png'));

if (files.length === 0) {
    console.log("[SNC] Aika B2C: Nenhum post novo encontrado para o Status hoje.");
    process.exit(0);
}

const metadataPath = path.resolve(__dirname, '../../../../1-Farmacia-Ecommerce/vitrine-virtual/posts_metadata.json');
const { getSelectedProductsForDay } = require('./product_selector');

// Rotate selection based on day of month to vary daily
const day = new Date().getDate();

// Use the shared selector to pick the 4 unique products for today
const { selectedProducts, selectedFiles } = getSelectedProductsForDay(metadataPath, files, day);

// Determine the relative day number (dia 1, dia 2, etc.) based on existing sent posts
let dayNumber = 1;
if (fs.existsSync(enviadosDir)) {
  const enviadosFiles = fs.readdirSync(enviadosDir);
  let maxDay = 0;
  let todayDay = null;
  const todayStr = new Date().toDateString();
  
  for (const f of enviadosFiles) {
    const match = f.match(/^dia\s+(\d+)\.\d+\.png$/i);
    if (match) {
      const dNum = parseInt(match[1], 10);
      if (dNum > maxDay) {
        maxDay = dNum;
      }
      try {
        const stats = fs.statSync(path.join(enviadosDir, f));
        if (stats.mtime.toDateString() === todayStr) {
          todayDay = dNum;
        }
      } catch (err) {}
    }
  }
  
  if (todayDay !== null) {
    dayNumber = todayDay;
  } else {
    dayNumber = maxDay + 1;
  }
}

console.log(`[SNC] Aika B2C: Dia da campanha: ${dayNumber}. Selecionados ${selectedFiles.length} arquivos para envio.`);

const client = new Client({
    authTimeoutMs: 0,
    puppeteer: { 
        headless: true, // Roda invisível no background
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.resolve(__dirname, '../../../../4-Time-Casa/perfil_aika'),
        protocolTimeout: 180000, // Evita timeout do protocolo ao subir mídia lenta
        timeout: 0,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

const LIMITE_DIARIO = 4;

async function sendMediaStatus(client, media) {
    return await client.sendMessage('status@broadcast', media);
}


client.on('ready', async () => {
    const fila = selectedFiles;
    console.log(`[SNC] Aika B2C: Conectada! Aguardando carregamento do painel principal (busca de elementos)...`);
    
    try {
        // Wait for main UI element or status icon to guarantee app is loaded
        await client.pupPage.waitForSelector('span[data-icon="status-refreshed"], span[data-icon="status-v3"], div[data-testid="chat-list"]', { timeout: 60000 });
        console.log("[SNC] Aika B2C: Painel principal detectado!");
        
        console.log("[SNC] Aika B2C: Aguardando fim da sincronização de mensagens...");
        await client.pupPage.waitForFunction(() => {
            const text = document.body.innerText;
            return !text.includes('Sincronizando') && !text.includes('Carregando conversas');
        }, { timeout: 180000 });
        
        console.log("[SNC] Aika B2C: Sincronização concluída! Aguardando mais 10 segundos para estabilizar...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (err) {
        console.warn("[SNC] Aika B2C: Aviso! Timeout ou erro ao aguardar carregamento/sincronização. Continuando...", err.message);
    }
    
    console.log(`[SNC] Aika B2C: Iniciando envio de ${fila.length} vitrines para o Status (limite: ${LIMITE_DIARIO})...`);
    
    for (const file of fila) {
        const filePath = path.join(postsDir, file);
        const slot = fila.indexOf(file) + 1; // 1-based index within the daily batch
        const renamed = `dia ${dayNumber}.${slot}.png`;
        const newFilePath = path.join(enviadosDir, renamed);
        
        try {
            console.log(`[SNC] Aika B2C: Subindo ${file} como ${renamed}...`);
            const media = MessageMedia.fromFilePath(filePath);
            
            // Envio direto para o broadcast de status via injeção direta na página
            await sendMediaStatus(client, media);
            
            // Copia para a pasta de enviados com o novo nome
            fs.copyFileSync(filePath, newFilePath);
            
            // Aguarda 5 segundos entre as fotos para dar um respiro pra rede
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (e) {
            console.error(`[SNC] Aika B2C: Erro ao postar ${file}:`, e);
        }
    }
    
    console.log("[SNC] Aika B2C: Aguardando 15 segundos para garantir que o upload final foi concluído...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log("[SNC] Aika B2C: Missão Cumprida! Vitrine no ar para todo mundo ver.");
    client.destroy();
    process.exit(0);
});

client.on('loading_screen', (percent, message) => {
    console.log(`[SNC] Aika B2C: Carregando tela do WhatsApp Web: ${percent}% - ${message}`);
});

client.on('change_state', (state) => {
    console.log(`[SNC] Aika B2C: Estado alterado para: ${state}`);
});

client.on('qr', (qr) => {
    console.error("[SNC] Aika B2C: WhatsApp não autenticado! O QR Code foi solicitado.");
    console.error("[SNC] Aika B2C: Por favor, execute o arquivo 'AUTENTICAR_WHATSAPP_AIKA.bat' para conectar seu celular.");
    client.destroy();
    process.exit(1);
});

client.on('auth_failure', msg => {
    console.error("[SNC] Aika B2C: Ops! Falha na Autenticação do WhatsApp!", msg);
    process.exit(1);
});

client.initialize().catch(err => {
    console.error("[SNC] Aika B2C: Erro fatal na engine do chrome:", err);
    process.exit(1);
});
