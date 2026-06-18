/**
 * ORQUESTRADOR FINAL - Otimiza FarmaVet Content Suite
 * Pipeline: Strategist (1) -> Copywriter (2) -> Compliance (3) -> Image Generator (5) -> Trello (4)
 */

require('dotenv').config();
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Importação dos Módulos
const { generateExecution } = require('./copywriter');
const { runComplianceReview } = require('./compliance');
const { createDraftArticle } = require('./shopify-draftsman');
const { pushToNotion } = require('./notion');
// const { gerarImagemBase } = require('./image-generator');

const MODEL_NAME = "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("ERRO: A variável GEMINI_API_KEY não foi encontrada no arquivo .env.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const responseSchema = {
    description: "Set of strategy briefings",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            frente_de_negocio: { type: SchemaType.STRING, description: "RT, B2B Suprimentos ou B2C Tutor" },
            tema_central: { type: SchemaType.STRING, description: "A dor ou desejo explorado" },
            gancho_de_atencao: { type: SchemaType.STRING, description: "O gancho para prender a atenção" },
            persona_indicada: { type: SchemaType.STRING, description: "Carmen, Kyenner ou Aika" },
            objetivo_da_peca: { type: SchemaType.STRING, description: "Lead, awareness, venda, etc." },
            formato_post: { type: SchemaType.STRING, description: "Decida se o ideal é: Carrossel, Reels ou Post Estático" }
        },
        required: ["frente_de_negocio", "tema_central", "gancho_de_atencao", "persona_indicada", "objetivo_da_peca", "formato_post"],
    },
};

// --- CONSTITUIÇÃO VISUAL OTIMIZA ---
const PADRAO_VISUAL_OTIMIZA = `
Brand Colors: Otimiza Blue, Grooming Green, Pet Shop Orange. Accent colors: soft purple and teal.
Photography Style: High quality, natural light. Focus on happy, clean, and healthy animals. Focus on facial expressions. Human-pet interaction is highly encouraged.
Layout & Composition: Grid-based approach or circular masks for the animals. Add light illustrative elements like paws, bones, or small stars around the subjects.
Typography & UI: Clean layout with a space at the bottom for the 'OTIMIZA' logo and contact info.
`;

const systemInstruction = `
Você é o Diretor de Marketing (CMO) da Otimiza FarmaVet. Sua função é criar briefings estratégicos para redes sociais. Você NÃO escreve os roteiros ou legendas finais.
Você deve obrigatoriamente intercalar os tipos de ganchos psicológicos (ex: medo de multa, desejo de economia, mitos e verdade, quebra de objeções) para não gerar conteúdos repetitivos.

A Otimiza FarmaVet é uma FARMÁCIA DE REVENDA E DISTRIBUIÇÃO de medicamentos, acessórios e suprimentos veterinários (exatamente como uma farmácia humana, mas para pets).
REGRAS ESTRITAS DE CONDUTA:

Nós NÃO fabricamos os medicamentos. Nós os revendemos.
Nós NÃO somos uma clínica médica e NÃO fazemos diagnósticos.
NUNCA prometa curas, milagres ou resultados clínicos.
O foco do conteúdo deve ser SEMPRE em: disponibilidade de estoque, curadoria das melhores marcas do mercado, logística/entrega rápida, variedade de produtos e confiança/segurança na compra.
No B2C (Aika), posicione a farmácia como o lugar onde o tutor encontra tudo o que a receita do veterinário pediu.
No B2B (Kyenner), posicione a farmácia como a parceira de suprimentos que nunca deixa a prateleira da clínica do cliente ficar vazia.
No RT (Carmen), reforce que comprar de uma revenda regularizada e com Responsabilidade Técnica garante a procedência e a segurança jurídica da clínica.

Você gerencia 3 frentes e personas:

RT (Responsabilidade Técnica para negócios): Persona 'Carmen'. Tom de voz implacável focado em segurança jurídica, compliance, normas do CRMV/MAPA e proteção empresarial.

B2B Suprimentos (Atacado para clínicas): Persona 'Kyenner'. Tom de voz focado em negócios, logística rápida, margem de lucro e parceria comercial.

B2C Tutor (Vet em Casa e produtos): Persona 'Aika' (a mascote). Tom lúdico, empático e educativo, focado no bem-estar animal.

RETORNO OBRIGATÓRIO: Apenas um array JSON puro e válido contendo os objetos com as chaves: frente_de_negocio, tema_central, gancho_de_atencao, persona_indicada e objetivo_da_peca. NÃO inclua blocos de formatação markdown como \`\`\`json no início ou no fim. Apenas o array.
`;

/**
 * Função para gerar o prompt de imagem baseado no Padrão Visual Otimiza
 */
async function gerarPromptDeImagem(temaDoPost) {
    const modelPrompt = genAI.getGenerativeModel({ 
        model: MODEL_NAME, 
        systemInstruction: `Você é um Diretor de Arte sênior. O usuário vai te passar o tema de um post de rede social para uma farmácia veterinária. Sua missão é escrever um prompt de geração de imagem ultra-detalhado, em inglês, que obrigatoriamente incorpore as regras do PADRAO_VISUAL_OTIMIZA:
        
        ${PADRAO_VISUAL_OTIMIZA}
        
        O prompt final deve ser apenas um parágrafo direto ao ponto, pronto para ser colado em um gerador de imagens, sem introduções.`
    });

    const result = await modelPrompt.generateContent(`Tema do Post: ${temaDoPost}`);
    return result.response.text().trim();
}

/**
 * Função para buscar tendências da semana usando Google Search via Gemini
 */
async function buscarTendenciasDaSemana() {
    const cachePath = path.join(__dirname, 'tendencias_cache.json');
    const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

    try {
        // Verificar se existe cache válido
        if (fs.existsSync(cachePath)) {
            const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            const now = Date.now();
            
            if (now - cacheData.timestamp < CACHE_EXPIRATION_MS) {
                console.log(`\n♻️  MÓDULO 0: Usando tendências do cache (gerado em ${new Date(cacheData.timestamp).toLocaleDateString('pt-BR')})`);
                return cacheData.conteudo;
            }
        }

        console.log(`\n🔍 MÓDULO 0: Buscando NOVAS tendências em alta na internet (Custo de Grounding)...`);
        // Usando o Gemini com a tool de Google Search para buscar dados reais
        const searchModel = genAI.getGenerativeModel({
            model: MODEL_NAME,
            tools: [{ googleSearch: {} }] // Ativa a busca na web
        });

        const promptSearch = `Faça uma pesquisa rápida na internet sobre as tendências, notícias e assuntos em alta desta semana no Brasil relevantes para:
        1. Mercado veterinário, gestão de clínicas e responsabilidade técnica (público RT).
        2. Suprimentos veterinários, farmácias pet, e inovações do mercado (público B2B).
        3. Dicas de saúde pet, cuidados com cães/gatos e bem-estar animal (público B2C / Tutores).
        
        Sua resposta será usada como base para a criação de conteúdo em redes sociais.
        Retorne um resumo objetivo (com pelo menos 1 tópico interessante para cada público).`;

        const result = await searchModel.generateContent(promptSearch);
        const tendencias = result.response.text();

        // Salvar no cache
        fs.writeFileSync(cachePath, JSON.stringify({
            timestamp: Date.now(),
            conteudo: tendencias
        }, null, 2));

        console.log(`   ✅ Novas tendências capturadas e salvas em cache!`);
        return tendencias;
    } catch (error) {
        console.warn(`\n⚠️ Aviso: Falha ao buscar tendências na web, prosseguindo com fallback... (${error.message})`);
        return "Notícias em alta sobre saúde animal e gestão de clínicas veterinárias.";
    }
}

/**
 * Função principal (Main Pipeline)
 */
async function runCompletePipeline(userPromptGoal) {
    try {
        console.log(`\n===================================================`);
        console.log(`🚀 INICIANDO CONTENT ENGINE 2.0 (SHOPIFY)`);
        console.log(`===================================================\n`);

        // --- MÓDULO 0: BUSCA DE TENDÊNCIAS ---
        const tendencias = await buscarTendenciasDaSemana();

        const estrategistaGoal = `
        Objetivo/Direcionamento original: ${userPromptGoal}

        Tópicos em alta capturados esta semana:
        ${tendencias}

        Por favor, elabore os briefings baseando-se em pelo menos alguns desses tópicos em alta para ter maior engajamento.
        `;

        // --- MÓDULO 1: ESTRATEGISTA ---
        console.log(`\n🎯 Módulo 1: Planejando Estratégia Baseada nas Tendências...`);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: estrategistaGoal }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 0.7 }
        });
        const briefings = JSON.parse(result.response.text());
        console.log(`   ✅ ${briefings.length} briefings gerados estrategicamente.\n`);

        // --- MÓDULO 2: ROTEIRISTA (Dual Content) ---
        const contentResults = await generateExecution(briefings);

        // --- MÓDULO 3 & 4: COMPLIANCE & SHOPIFY ---
        console.log(`\n🛡️  Módulo 3: Compliance & Módulo 4: Exportação Shopify...`);
        
        for (const res of contentResults) {
            console.log(`\n   🔹 Processando: ${res.briefing.tema_central}`);

            if (!res.social_post || !res.blog_article) {
                console.warn(`   ⚠️  Aviso: Pulo de briefing devido a falha na geração de conteúdo.`);
                continue;
            }

            // 1. Compliance no Post Social (Instagram)
            const socialMarkdown = `📷 IG Visual: ${res.social_post.sugestao_visual}\n📝 Corpo IG: ${res.social_post.instagram.corpo}`;
            const reviewedSocial = await runComplianceReview(socialMarkdown);
            res.social_post.instagram.reviewed_text = reviewedSocial;

            // 2. Criação de Rascunho no Shopify (Escolha do Blog Dinâmica)
            const shopifyDraft = await createDraftArticle({
                title: res.blog_article.title || res.briefing.tema_central,
                body_html: res.blog_article.body_html || "",
                summary: res.blog_article.summary || "",
                schema_markup: res.blog_article.schema_markup || {}
            }, res.blog_article.classificacao); // B2B -> Fala, MedVet! | B2C -> Tutores

            if (shopifyDraft) {
                res.shopify_url = shopifyDraft.url;
            }

            // 3. Exportação para Ghostwriter (LinkedIn)
            try {
                const liDir = path.join(__dirname, 'linkedin-drafts');
                if (!fs.existsSync(liDir)) fs.mkdirSync(liDir);
                const liFileName = `li_${Date.now()}_${res.briefing.persona_indicada}.txt`;
                fs.writeFileSync(path.join(liDir, liFileName), res.social_post.linkedin.corpo);
                console.log(`   📂 LinkedIn Draft salvo para Ghostwriter: ${liFileName}`);

                // 4. Verificação de Delírio (Gargalo)
                const fullText = res.social_post.linkedin.corpo + res.blog_article.body_html;
                if (fullText.includes('[GARGALO]') || fullText.includes('REVISÃO HUMANA')) {
                    const notifyPath = path.join(__dirname, '..', '..', 'data', 'notifications.json');
                    let notifications = [];
                    if (fs.existsSync(notifyPath)) {
                        notifications = JSON.parse(fs.readFileSync(notifyPath, 'utf8'));
                    }
                    notifications.push({
                        id: Date.now(),
                        tipo: 'AI_INCERTEZA',
                        mensagem: `GIO detectou incerteza no tema: ${res.briefing.tema_central}. Conteúdo marcado como GARGALO.`,
                        data: new Date().toISOString()
                    });
                    fs.writeFileSync(notifyPath, JSON.stringify(notifications, null, 2));
                    console.log(`   ⚠️ ALERTA: Conteúdo marcado como GARGALO e notificado no Painel.`);
                }
            } catch (e) {
                console.error("   ❌ Erro no pós-processamento:", e.message);
            }
        }

        // --- MÓDULO 6: NOTION ---
        await pushToNotion(contentResults);

        console.log(`\n===================================================`);
        console.log(`🎯 PIPELINE CONCLUÍDO COM SUCESSO!`);
        console.log(`   📝 Log Visual: planejamento_multiplataforma_... .md`);
        console.log(`===================================================\n`);

    } catch (error) {
        console.error("\n💥 ERRO NO PIPELINE:", error.message);
    }
}

// Execução
const userGoal = process.argv[2] || "Promoção de Suprimentos B2B e dicas de saúde Aika";
runCompletePipeline(userGoal);
