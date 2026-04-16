const puppeteer = require('puppeteer');

(async () => {
    console.log("Iniciando conexão ao Gestão Click...");
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto('https://erp.gestaoclick.com.br/login', { waitUntil: 'networkidle2' });
        console.log("Página de login carregada.");
        
        // Tenta preencher login e senha (verificando os seletores mais comuns)
        const emailSelector = 'input[type="email"], input[name="email"], #email, #login';
        const passSelector = 'input[type="password"], input[name="senha"], #senha, #password';
        
        await page.waitForSelector(emailSelector, { timeout: 5000 });
        await page.type(emailSelector, 'carmenmsdcarvalho@gmail.com');
        await page.type(passSelector, 'CEO1520!Cc');
        
        console.log("Credenciais preenchidas. Efetuando login...");
        
        // Vamos clicar no botão de submit ou enter
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log("Aviso: timeout do waitForNavigation, mas pode ter carregado."))
        ]);
        
        console.log("URL após login:", page.url());
        
        // Pode ser útil verificar o HTML resultante
        const title = await page.title();
        console.log("Título da página após login:", title);
        
        if (page.url().includes('login')) {
            console.log("Parece que continuamos na página de login. Falha na autenticação ou captcha?");
        } else {
            console.log("Login aparentemente bem-sucedido!");
        }

    } catch (e) {
        console.error("Erro durante o processo:", e.message);
    } finally {
        await browser.close();
        console.log("Conexão encerrada.");
    }
})();
