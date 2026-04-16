require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ==========================================
// CONFIGURAÇÕES GERAIS
// ==========================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_URN   = process.env.LINKEDIN_AUTHOR_URN; // Ex: urn:li:person:123abc456

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const rssParser = new Parser();

// Extrai a URL real do artigo a partir do link de redirecionamento do Google News
function resolveGoogleNewsUrl(googleLink) {
    try {
        // O Google News às vezes embute a URL real no parâmetro "url=" do link
        const match = googleLink.match(/url=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);

        // Tenta extrair via parâmetro "source=" ou pelo próprio valor do campo <source>
        // Se não encontrar nada, usa o link original mesmo
        return googleLink;
    } catch {
        return googleLink;
    }
}

// ==========================================
// CANAIS DE NOTÍCIAS VETERINÁRIAS (RSS)
// ==========================================
const RSS_FEEDS = [
    "https://caesegatos.com.br/feed/",           // Portal veterinário com links diretos
    "https://portalqtv.com.br/feed/"             // Notícias diárias do setor veterinário
];

// ==========================================
// PROMPTS DO GHOSTWRITER
// ==========================================
const SYSTEM_PROMPT = `
Você é o Ghostwriter Pessoal do "Responsável Técnico (RT)" da Otimiza FarmaVet.
Seu objetivo é se posicionar no LinkedIn como uma "Top Voice" B2B do mercado de Medicina Veterinária.

ESTRUTURA NARRATIVA (ANATOMIA DO TEXTO):
1. HERO (GANCHO): Um "bold statement". Uma frase de impacto, preferencialmente contra-intuitiva, que faça o leitor parar o scroll.
2. PROBLEM (DOR): Foque no que está quebrado, frustrante ou defasado no dia a dia da clínica. Use o travessão (—) para dar respiro à fala.
3. SOLUTION (RESPOSTA): Apresente o insight ou a solução que resolve o problema acima.
4. FEATURES (BENEFÍCIOS): Uma lista (usando • ou —) com o que se ganha ao adotar a solução.
5. DETAILS (PROFUNDIDADE): Detalhes técnicos, especificações ou diferenciais que mostram sua autoridade como RT.
6. HOW-TO (PASSO A PASSO): Um fluxo de processo ou workflow numerado de como aplicar a ideia.
7. CTA (TAGLINE/AÇÃO): Finalize com uma frase de efeito (tagline) e uma provocação que gere comentários técnicos.

REGRAS DE FORMATAÇÃO (ESTRITO):
- EMOJIS: PROIBIDO. Não use nenhum.
- MARKDOWN: NUNCA use asteriscos (**). Use CAIXA ALTA apenas para ênfase pontual em palavras-chave.
- LISTAS: Use exclusivamente "•" ou "—".
- RESPIRO E PONTUAÇÃO: Priorize a pontuação tradicional (vírgulas, ponto e vírgula ou dois pontos) para criar pausas e fluidez. O uso do travessão (—) deve ser restrito e usado apenas em casos de interrupção brusca ou ênfase muito específica. Evite o excesso.
- PARÁGRAFOS: Curtos e diretos.

GERAÇÃO OBRIGATÓRIA: Devolva apenas o texto final, pronto para postar.
`;

// ==========================================
// FUNÇÕES CEREBRAIS
// ==========================================

// --- MODO 1: NOTÍCIAS ---
async function generateNewsPost() {
    console.log("📰 MODO NOTÍCIAS: Buscando novidades no mercado veterinário...");
    
    // Pega o feed sorteado ou o primeiro
    const feedUrl = RSS_FEEDS[Math.floor(Math.random() * RSS_FEEDS.length)];
    const feed = await rssParser.parseURL(feedUrl);
    
    // Pegamos a notícia mais recente e resolvemos a URL real
    const latestNews = feed.items[0]; 
    // O campo 'link' do Google News pode ser um redirect; tentamos extrair a URL original
    const urlReal = resolveGoogleNewsUrl(latestNews.link) || latestNews['link'];
    console.log(`🗞️ Encontrada: ${latestNews.title}`);
    console.log(`🔗 URL real: ${urlReal}`);

    const prompt = `--- INSTRUÇÕES DO GHOSTWRITER ---\n${SYSTEM_PROMPT}\n\n--- TAREFA ---\nCrie um Post para o LinkedIn opinando sobre essa notícia recente que eu li:\nTÍTULO DA NOTÍCIA: ${latestNews.title}\nSINOPSE/RESUMO DA NOTÍCIA: ${latestNews.contentSnippet || latestNews.content}\nURL PARA REFERÊNCIA NO POST: ${urlReal}\n\nEscreva a postagem inteira, fazendo uma ponte entre como essa novidade afeta a rotina das clínicas e hospitais pelo Brasil afora e elogie os avanços. Não esqueça de deixar o Link da notícia original no final da postagem.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// --- MODO 2: DICA CLÍNICA (Do Próprio Blog) ---
async function generateBlogTipPost() {
    console.log("🧠 MODO BLOG-DICA: Varrendo nosso acervo interno...");
    
    const exportDir = path.join(__dirname, 'artigos-exportados');
    if (!fs.existsSync(exportDir)) throw new Error("A pasta de artigos exportados não existe. Execute o exportador primeiro.");
    
    const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.txt'));
    if (files.length === 0) throw new Error("A pasta está vazia.");

    // Sorteia um artigo qualquer
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const articleContent = fs.readFileSync(path.join(exportDir, randomFile), 'utf-8');

    console.log(`📝 Artigo Base Escolhido: ${randomFile}`);

    const prompt = `--- INSTRUÇÕES DO GHOSTWRITER ---\n${SYSTEM_PROMPT}\n\n--- TAREFA ---\nAbaixo está o texto de um de nossos artigos antigos, originalmente escrito para DONOS DE PETS (B2C).\nSua tarefa é usar o assunto central deste artigo e **inverter o ângulo para B2B**.\nEnsine, alerte ou dê uma dica valiosa sobre esse tema COMO SE VOCÊ ESTIVESSE FALANDO DE NEGÓCIO COM OUTROS VETERINÁRIOS.\nEx: Se o texto for sobre "Alergias Pet", fale sobre o aumento sazonal de alergias nas macas das clínicas e sobre oferecer as medicações corretas.\nEscreva a postagem direta, instigante e opinativa.\n\nCONTEÚDO DO ARTIGO:\n${articleContent.substring(0, 3000)}`; // limitamos caracteres para n bugar a IA
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// ==========================================
// INTEGRAÇÃO LINKEDIN OFFICAL API
// ==========================================
async function publishToLinkedIn(textContent) {
    if (!LINKEDIN_TOKEN || !LINKEDIN_URN) {
        console.log("⚠️ CHAVES AUSENTES: Como o LinkedIn Auth não está ativo no .env, o texto será apenas SALVO localmente em Rascunho!");
        return false;
    }

    console.log("🚀 Enviando post oficial para o LinkedIn do RT...");
    const url = 'https://api.linkedin.com/v2/ugcPosts';

    const payload = {
        "author": LINKEDIN_URN,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": textContent
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${LINKEDIN_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        console.log("🎉 PUBLICAÇÃO BEM SUCEDIDA NO LINKEDIN OFICIAL!");
        return true;
    } catch (err) {
        console.error("❌ Erro ao postar na API do LinkedIn:", err.response?.data || err.message);
        return false;
    }
}

// ==========================================
// FUNÇÃO EXECUTORA PRINCIPAL (Gatilho)
// ==========================================
async function runBot(modo = "MIX") {
    try {
        let textoPostagem = "";
        
        // Sorteamos o que postar hoje: 50% chance de ser uma Notícia nova, 50% chance de ser Reutilização do Blog.
        const usarNoticia = modo === "NOTICIA" ? true : (modo === "DICA" ? false : Math.random() < 0.5);

        if (usarNoticia) {
            textoPostagem = await generateNewsPost();
        } else {
            textoPostagem = await generateBlogTipPost();
        }

        console.log("\n=================================");
        console.log("📋 POSTAGEM GERADA PELA IA:");
        console.log("=================================\n");
        console.log(textoPostagem);
        console.log("\n=================================");

        // Tenta publicar
        const publicado = await publishToLinkedIn(textoPostagem);
        
        if (!publicado) {
            fs.writeFileSync(path.join(__dirname, 'ultimo_rascunho_linkedin.txt'), textoPostagem);
            console.log("\n📁 Post guardado no arquivo 'ultimo_rascunho_linkedin.txt'.");
            console.log("📌 Para ativar a postagem automática, adicione sua LINKEDIN_ACCESS_TOKEN e LINKEDIN_AUTHOR_URN no .env!");
        }

    } catch (e) {
        console.error("❌ Falha na operação do Ghostwriter:", e);
    }
}

// Aceita argumentos via terminal (ex: node bot.js NOTICIA)
const modoAtivo = process.argv[2] ? process.argv[2].toUpperCase() : "MIX";
runBot(modoAtivo);
