require('dotenv').config();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ==========================================
// CONFIGURAÇÕES GERAIS
// ==========================================
const STORE_URL = process.env.SHOPIFY_STORE_URL; 
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// PROMPT: O SEGREDO DO GEO PARA BLOGS
// ==========================================
const GEO_SYSTEM_INSTRUCTION = `
Você é o Revisor Médico-Veterinário e Especialista Sênior em GEO (Generative Engine Optimization).
Eu te passarei um artigo cru de um blog veterinário.

SUA TAREFA:
Devolva ESTRITAMENTE UM OBJETO JSON VÁLIDO (sem markdown, sem \`\`\`json, texto puro) contendo:

1. "html_revisado": Reescreva todo o corpo do artigo passado. Use uma formatação HTML rigorosa (empregue <h2> e <h3> fáceis de ler, use <ul><li> para listas). Melhore a persuasão e o tom médico-científico, mas o mantenha compreensível para tutores de pet. NUNCA insira as tags <html>, <head> ou <body>, devolva apenas o corpo de conteúdo formatado nativamente para ser embutido na página, pronto para o blog. NUNCA DE FORMA ALGUMA USE ASTERISCOS ** PARA NEGRITO, USE EXCLUSIVAMENTE A TAG HTML <strong>.
2. "schema_markup": Um Objeto JSON-LD contendo o Schema "MedicalWebPage". Coloque as declarações exigidas pelo Google (ex: "@type": "MedicalWebPage", "about", "audience" (pacientes/tutores), e cite a Especialidade como "Veterinary"). Não crie a tag <script>, retorne apenas o objeto JSON-LD puro.

Seu retorno deve ser estritamente JSON Limpo! Ex: {"html_revisado": "<h2>...</h2>", "schema_markup": {"@context": "..."}}
`;

// ==========================================
// FUNÇÕES DA API DA SHOPIFY
// ==========================================

async function getPendingArticles() {
  const url = `https://${STORE_URL}/admin/api/2024-01/graphql.json`;
  let hasNextPage = true;
  let cursor = null;
  const pendingArticles = [];

  console.log("🔍 Mapeando todos os Artigos de Blog da Shopify...");

  while (hasNextPage) {
    const query = `
      query ($cursor: String) {
        articles(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              body
              blog { id }
              metafield(namespace: "custom", key: "geo_article_schema") { value }
            }
          }
        }
      }
    `;

    const response = await axios.post(url, { query, variables: { cursor } }, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' }
    });

    if (response.data.errors) {
      throw new Error("GraphQL Error: " + JSON.stringify(response.data.errors));
    }

    const data = response.data.data.articles;
    
    // Filtra artigos que ainda nao receberam otimizacao
    const newPending = data.edges
      .map(edge => edge.node)
      .filter(a => a.metafield === null);

    pendingArticles.push(...newPending);

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return pendingArticles;
}

async function updateArticleBody(blogId, articleId, newHtml) {
    const url = `https://${STORE_URL}/admin/api/2024-01/blogs/${blogId}/articles/${articleId}.json`;
    const payload = { article: { id: articleId, body_html: newHtml } };
  
    try {
      await axios.put(url, payload, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' }
      });
      return true;
    } catch (error) {
      console.error(`  ❌ Erro ao atualizar o corpo:`, error.response?.data || error.message);
      return false;
    }
}

async function updateArticleMetafield(articleId, fieldKey, fieldValue, fieldType) {
  const url = `https://${STORE_URL}/admin/api/2024-01/articles/${articleId}/metafields.json`;
  const payload = { metafield: { namespace: "custom", key: fieldKey, value: fieldValue, type: fieldType } };

  try {
    await axios.post(url, payload, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' }
    });
    return true;
  } catch (error) {
    console.error(`  ❌ Erro ao salvar metafield ${fieldKey}:`, error.response?.data || error.message);
    return false;
  }
}

// ==========================================
// FLUXO PRINCIPAL: AUTOMAÇÃO EM MASSA
// ==========================================
async function runMassAutomation() {
  console.log("🚀 Iniciando Otimizador GEO em MASSA no BLOG...\n");

  try {
    const articles = await getPendingArticles();
    
    if (articles.length === 0) {
        console.log("✅ Excelente! Todos os artigos do seu blog já foram otimizados com o Schema Médico!");
        return;
    }

    console.log(`🎯 Encontrados ${articles.length} artigos pendentes!\n`);

    for (let i = 0; i < articles.length; i++) {
        const a = articles[i];
        console.log(`[${i + 1}/${articles.length}] Processando: ${a.title}`);
        
        try {
            const legacyResourceId = a.id.split("/").pop();
            const blogLegacyResourceId = a.blog.id.split("/").pop();
            
            const contextHtml = a.body ? a.body : "Artigo em branco.";
            const prompt = `--- INSTRUÇÕES ---\n${GEO_SYSTEM_INSTRUCTION}\n\n--- DADOS ---\nTÍTULO: ${a.title}\nTEXTO BASE:\n${contextHtml}`;
            
            const result = await model.generateContent(prompt);
            
            let aiResponse = result.response.text().trim();
            aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '');
            
            // Garantia extra contra asteriscos
            aiResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            const geoData = JSON.parse(aiResponse);

            await updateArticleBody(blogLegacyResourceId, legacyResourceId, geoData.html_revisado);
            await updateArticleMetafield(legacyResourceId, "geo_article_schema", JSON.stringify(geoData.schema_markup), "json");
            
            console.log(`  ✅ Otimização Concluída!`);
            
            // Segurar o tráfego da API
            await sleep(4500);

        } catch (err) {
            console.error(`  ⚠️ Erro ao processar o artigo, saltando...`, err.message);
            await sleep(5000); 
        }
    }

    console.log(`\n🎉 PROCESSO DO BLOG FINALIZADO O COM SUCESSO!`);
    console.log(`A autoridade das suas postagens atingiu o ápice clínico.`);

  } catch (error) {
    console.error("\n❌ Erro crítico no robô:");
    console.error(error.message);
  }
}

runMassAutomation();
