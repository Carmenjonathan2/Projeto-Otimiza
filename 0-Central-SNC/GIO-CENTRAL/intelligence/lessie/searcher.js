const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

puppeteer.use(StealthPlugin());

/**
 * Busca estabelecimentos no Google Maps usando a API do Places TextSearch.
 * @param {string} query Termo de busca (ex: "clinicas veterinarias Pampulha BH")
 * @param {number} limit Limite de resultados para retornar detalhes (default: 10)
 */
async function searchGoogleMaps(query, limit = 10) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("❌ Chave GOOGLE_MAPS_API_KEY não encontrada no arquivo .env");
    }

    console.log(`📡 Buscando no Google Maps: "${query}"...`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=pt-BR`;

    try {
        const response = await axios.get(searchUrl);
        const results = response.data.results || [];
        console.log(`📍 Google Maps retornou ${results.length} resultados preliminares.`);

        // Lista de exclusão para filtrar grandes redes comerciais (que já possuem assessoria de RT própria)
        const EXCLUSION_LIST = [
            'petz', 
            'cobasi', 
            'royal canin', 
            '100% pet', 
            'petland', 
            'anclivepa', 
            'dr. meep', 
            'hospital veterinario publico',
            'hospital publico'
        ];

        const filteredResults = results.filter(place => {
            const nameLower = (place.name || '').toLowerCase();
            const matchesExclusion = EXCLUSION_LIST.some(ex => nameLower.includes(ex));
            if (matchesExclusion) {
                console.log(`🚫 Filtrado pela lista de exclusão (grande rede/público): "${place.name}"`);
            }
            return !matchesExclusion;
        });

        console.log(`📍 Resultados após filtragem de exclusão: ${filteredResults.length} leads qualificados para PMEs.`);

        const leads = [];
        // Limita a quantidade de detalhes buscados para economizar cota da API e tempo
        const topResults = filteredResults.slice(0, limit);

        for (const place of topResults) {
            console.log(`ℹ️ Buscando detalhes de: ${place.name}...`);
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,user_ratings_total,reviews,website,formatted_phone_number,formatted_address,place_id&key=${apiKey}&language=pt-BR`;
            
            try {
                const detailsRes = await axios.get(detailsUrl);
                const detail = detailsRes.data.result || {};
                
                // Extrai a melhor avaliação para servir de gancho / review
                let reviewGancho = null;
                let reviewerName = null;
                if (detail.reviews && detail.reviews.length > 0) {
                    const boasReviews = detail.reviews.filter(r => r.rating >= 4 && r.text && r.text.length > 15);
                    if (boasReviews.length > 0) {
                        reviewGancho = boasReviews[0].text;
                        reviewerName = boasReviews[0].author_name;
                    } else {
                        reviewGancho = detail.reviews[0].text;
                        reviewerName = detail.reviews[0].author_name;
                    }
                }

                leads.push({
                    name: detail.name || place.name,
                    place_id: place.place_id,
                    address: detail.formatted_address || place.formatted_address || '',
                    phone: detail.formatted_phone_number || '',
                    website: detail.website || '',
                    rating: detail.rating || null,
                    reviewsCount: detail.user_ratings_total || 0,
                    reviewText: reviewGancho || '',
                    reviewerName: reviewerName || ''
                });

                // Pequeno delay por precaução contra rate limits da API
                await new Promise(r => setTimeout(r, 200));

            } catch (errDetail) {
                console.error(`⚠️ Erro ao buscar detalhes de ${place.name}:`, errDetail.message);
                // Fallback com dados básicos da lista principal
                leads.push({
                    name: place.name,
                    place_id: place.place_id,
                    address: place.formatted_address || '',
                    phone: '',
                    website: '',
                    rating: place.rating || null,
                    reviewsCount: place.user_ratings_total || 0,
                    reviewText: '',
                    reviewerName: ''
                });
            }
        }

        return leads;
    } catch (e) {
        console.error("❌ Erro na busca do Google Maps:", e.message);
        return [];
    }
}

/**
 * Lança o navegador Puppeteer em modo Stealth.
 */
async function launchBrowser() {
    return await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });
}

/**
 * Realiza uma busca no Google Search (Google Dorking) para coletar perfis de LinkedIn e Instagram de decisão.
 * @param {string} businessName Nome da empresa
 * @param {string} address Endereço ou cidade
 * @param {any} browserInst Instância opcional do navegador para reutilização
 */
async function dorkSocialProfiles(businessName, address, browserInst = null) {
    const browser = browserInst || await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Limpa o nome da empresa para evitar caracteres e termos que quebrem a busca
    const cleanName = businessName.replace(/Ltda|Eireli|S\/A|Me/gi, '').trim();
    
    const results = {
        linkedin: [],
        instagram: []
    };

    try {
        // --- 1. DORKING LINKEDIN ---
        // Ex: site:linkedin.com/in "dono" OR "proprietário" OR "sócio" OR "veterinário" "NOME DA EMPRESA"
        const queryLinkedin = `site:linkedin.com/in ("dono" OR "proprietário" OR "sócio" OR "veterinário" OR "gerente") "${cleanName}"`;
        console.log(`🔍 Dorking LinkedIn: "${queryLinkedin}"`);
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(queryLinkedin)}`, { waitUntil: 'networkidle2' });
        
        const linkedinProfiles = await page.evaluate(() => {
            const list = [];
            const elements = document.querySelectorAll('#search .g');
            elements.forEach(el => {
                const a = el.querySelector('a');
                const h3 = el.querySelector('h3');
                const snippet = el.querySelector('div[style*="webkit-line-clamp"], .VwiC3b');
                if (a && h3 && a.href.includes('linkedin.com/in/')) {
                    list.push({
                        url: a.href,
                        title: h3.innerText,
                        snippet: snippet ? snippet.innerText : ''
                    });
                }
            });
            return list;
        });
        results.linkedin = linkedinProfiles.slice(0, 3); // Top 3 contatos
        
        // Delay aleatório de segurança para evitar CAPTCHAs
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));

        // --- 2. DORKING INSTAGRAM ---
        const queryInstagram = `site:instagram.com "${cleanName}" ${address ? `"${address.split(',')[0]}"` : ''}`;
        console.log(`🔍 Dorking Instagram: "${queryInstagram}"`);
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(queryInstagram)}`, { waitUntil: 'networkidle2' });
        
        const instagramProfiles = await page.evaluate(() => {
            const list = [];
            const elements = document.querySelectorAll('#search .g');
            elements.forEach(el => {
                const a = el.querySelector('a');
                const h3 = el.querySelector('h3');
                const snippet = el.querySelector('div[style*="webkit-line-clamp"], .VwiC3b');
                if (a && h3 && a.href.includes('instagram.com/')) {
                    // Evita pegar links de hashtags ou páginas genéricas
                    if (!a.href.includes('/explore/') && !a.href.includes('/tags/')) {
                        list.push({
                            url: a.href,
                            title: h3.innerText,
                            snippet: snippet ? snippet.innerText : ''
                        });
                    }
                }
            });
            return list;
        });
        results.instagram = instagramProfiles.slice(0, 2);

    } catch (e) {
        console.error(`⚠️ Erro no Dorking de Redes Sociais para ${businessName}:`, e.message);
    } finally {
        await page.close();
        if (!browserInst) {
            await browser.close();
        }
    }

    return results;
}

module.exports = {
    searchGoogleMaps,
    dorkSocialProfiles,
    launchBrowser
};
