const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function diagnostico() {
    const logFile = 'diag_log.txt';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
    log('=== INICIANDO DIAGNÓSTICO OTIMIZA ===');
    log('Data: ' + new Date().toLocaleString());

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    
    // 1. Verificar Executável
    if (fs.existsSync(chromePath)) {
        log('✅ Caminho do Chrome OK: ' + chromePath);
    } else {
        log('❌ Falha: Chrome não encontrado em ' + chromePath);
        return;
    }

    try {
        log('🚀 Tentando abrir o navegador...');
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: chromePath,
            userDataDir: 'c:\\Users\\jonat\\OneDrive\\Desktop\\Otimiza\\perfil_aika',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        log('✅ Navegador aberto com sucesso.');
        const page = await browser.newPage();

        log('🔍 Testando navegação (Google)...');
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
        log('✅ Navegação externa OK.');

        log('🔍 Testando WhatsApp Web (Timeout 40s)...');
        try {
            await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 40000 });
            log('✅ WhatsApp Web carregado.');
            
            // Verificar se o QR Code ou Chat aparecem
            const isLogged = await page.evaluate(() => {
                const qr = !!document.querySelector('canvas[aria-label="Scan me!"]') || !!document.querySelector('canvas');
                const chat = !!document.querySelector('#pane-side') || !!document.querySelector('[data-testid="chat-list"]');
                if (chat) return 'LOGADO (Chat visível)';
                if (qr) return 'DESLOGADO (QR Code visível)';
                return 'DESCONHECIDO (Página carregada, mas sem QR ou Chat)';
            });
            log('📊 Estado do Login: ' + isLogged);

        } catch (e) {
            log('⚠️ Alerta no WhatsApp: ' + e.message);
            
            log('🧪 Tentando um carregamento LIMPO (sem sessão) para teste...');
            const browserClean = await puppeteer.launch({
                headless: false,
                executablePath: chromePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const pageClean = await browserClean.newPage();
            try {
                await pageClean.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 30000 });
                log('✅ WhatsApp Web (LIMPO) carregou com sucesso.');
            } catch (e2) {
                log('❌ WhatsApp Web (LIMPO) também falhou: ' + e2.message);
            }
            await browserClean.close();
        }

        log('⌛ Aguardando 10 segundos antes de fechar para inspeção...');
        await new Promise(r => setTimeout(r, 10000));

        await browser.close();
        log('🏁 Diagnóstico Finalizado.');

    } catch (err) {
        log('❌ ERRO CRÍTICO NO DIAGNÓSTICO: ' + err.stack);
    }
}

diagnostico();
