const puppeteer = require('puppeteer-extra');
const path = require('path');

/**
 * Filtra e limpa e-mails inválidos (com extensões de imagens ou falso-positivos)
 * @param {string[]} emails Lista de e-mails extraídos
 */
function cleanEmails(emails) {
    if (!emails) return [];
    const forbiddenExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf'];
    const invalidPrefixes = ['bootstrap', 'jquery', 'font', 'assets', 'email@email.com', 'seuemail@'];
    
    return [...new Set(emails)]
        .map(e => e.toLowerCase().trim())
        .filter(e => {
            const hasForbiddenExt = forbiddenExts.some(ext => e.endsWith(ext));
            const hasInvalidPrefix = invalidPrefixes.some(pre => e.startsWith(pre));
            // Garante tamanho razoável e formato básico de e-mail
            return !hasForbiddenExt && !hasInvalidPrefix && e.length > 5 && e.includes('.') && e.length < 60;
        });
}

/**
 * Varre o site oficial de um lead para buscar e-mails, telefones e termos de RT.
 * @param {string} url URL do site do lead
 * @param {any} browserInst Instância do Puppeteer reutilizável
 */
async function crawlWebsite(url, browserInst) {
    if (!url || url === 'N/A' || url.trim() === '') {
        return { emails: [], phones: [], rtMentions: [], socialLinks: [], scrapedSnippet: '' };
    }

    // Adiciona protocolo se não estiver presente
    if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
    }

    const browser = browserInst;
    const page = await browser.newPage();
    
    // Configurações de timeout e bloqueio de mídia para acelerar o carregamento
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setDefaultNavigationTimeout(15000);

    const scrapedData = {
        emails: [],
        phones: [],
        rtMentions: [],
        socialLinks: [],
        scrapedSnippet: ''
    };

    try {
        console.log(`🕸️ Rastejando página principal: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // --- 1. Extração na Página Principal ---
        const pageContent = await page.evaluate(() => document.body.innerText);
        const pageHtml = await page.content();
        
        // Regex para e-mails e telefones
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/g;

        const rawEmails = pageContent.match(emailRegex) || pageHtml.match(emailRegex) || [];
        const rawPhones = pageContent.match(phoneRegex) || [];
        
        scrapedData.emails.push(...rawEmails);
        scrapedData.phones.push(...rawPhones);

        // Extrai links sociais comuns (Insta, Face, LinkedIn)
        const socialLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            return links
                .map(a => a.href)
                .filter(href => href.includes('instagram.com') || href.includes('linkedin.com') || href.includes('facebook.com'));
        });
        scrapedData.socialLinks.push(...socialLinks);

        // Procura por termos de RT/CRMV e traz o contexto
        const lines = pageContent.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        const rtKeywords = ['responsabilidade técnica', 'responsável técnico', 'crmv', 'médico veterinário', 'veterinário responsável', 'rt '];
        
        lines.forEach(line => {
            const lowercaseLine = line.toLowerCase();
            const matchesKeyword = rtKeywords.some(keyword => lowercaseLine.includes(keyword));
            if (matchesKeyword && scrapedData.rtMentions.length < 5) {
                scrapedData.rtMentions.push(line.slice(0, 150)); // Salva com limite de caracteres
            }
        });

        // Grava um resumo de texto da homepage para ajudar a IA a entender o nicho
        scrapedData.scrapedSnippet = pageContent.slice(0, 1000).replace(/\s+/g, ' ');

        // --- 2. Busca e navegação para página de Contato/Sobre se não achou e-mail ---
        if (scrapedData.emails.length === 0) {
            const contactUrl = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                const contactAnchor = anchors.find(a => {
                    const text = a.innerText.toLowerCase();
                    const href = a.getAttribute('href').toLowerCase();
                    return text.includes('contato') || text.includes('fale conosco') || text.includes('contact') || href.includes('contato') || href.includes('contact');
                });
                return contactAnchor ? contactAnchor.href : null;
            });

            if (contactUrl && contactUrl !== url) {
                console.log(`🕸️ Navegando para página de contato secundária: ${contactUrl}`);
                // Abre aba de contato
                await page.goto(contactUrl, { waitUntil: 'domcontentloaded' });
                const contactContent = await page.evaluate(() => document.body.innerText);
                const contactHtml = await page.content();

                const contactEmails = contactContent.match(emailRegex) || contactHtml.match(emailRegex) || [];
                const contactPhones = contactContent.match(phoneRegex) || [];

                scrapedData.emails.push(...contactEmails);
                scrapedData.phones.push(...contactPhones);
            }
        }

    } catch (e) {
        console.error(`⚠️ Erro ao rastejar website ${url}:`, e.message);
    } finally {
        await page.close();
    }

    // Limpa e estrutura os dados finais
    scrapedData.emails = cleanEmails(scrapedData.emails);
    scrapedData.phones = [...new Set(scrapedData.phones.map(p => p.trim()))].filter(p => p.length >= 8 && p.length < 20);
    scrapedData.socialLinks = [...new Set(scrapedData.socialLinks)];
    scrapedData.rtMentions = [...new Set(scrapedData.rtMentions)];

    return scrapedData;
}

module.exports = {
    crawlWebsite
};
