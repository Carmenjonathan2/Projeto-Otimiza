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
// PROMPT: O SEGREDO DO GEO
// ==========================================
const GEO_SYSTEM_INSTRUCTION = `
Você é o Especialista Sênior em GEO (Generative Engine Optimization) e Copywriting Veterinário de Conversão.
Eu te passarei o Nome e a Descrição Técnica de um produto veterinário real.

SUA TAREFA:
Devolva ESTRITAMENTE UM OBJETO JSON VÁLIDO (sem markdown, sem \`\`\`json, texto puro) com as duas chaves abaixo:

1. "copydesk": Uma nova introdução (1 ou 2 parágrafos). Destaque a dor do tutor, o problema que o produto resolve e o diferencial (Ex: comodidade, alívio rápido). Aja com profissionalismo empático e sem criar falsas promessas médicas. Use tags HTML simples como <br> ou <strong> para formatar.
2. "faq": Um Array de Objetos. Gere 4 perguntas frequentes e estratégicas sobre o produto. A resposta deve ser direta mas completa. Estrutura exata: [{"pergunta": "...", "resposta": "..."}, {...}]

Seja preciso. Retorne apenas o JSON limpo.
`;

// ==========================================
// FUNÇÕES DA API DA SHOPIFY
// ==========================================

// Puxa produtos via GraphQL para já verificar se o Metafield existe (Economia de requisições)
async function getPendingProducts() {
  const url = `https://${STORE_URL}/admin/api/2024-01/graphql.json`;
  let hasNextPage = true;
  let cursor = null;
  const pendingProducts = [];

  console.log("🔍 Mapeando todo o catálogo na Shopify... (Isso pode levar alguns segundos)");

  while (hasNextPage) {
    const query = `
      query ($cursor: String) {
        products(first: 50, after: $cursor, query: "status:active") {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              legacyResourceId
              title
              descriptionHtml
              metafield(namespace: "custom", key: "geo_faq") { value }
            }
          }
        }
      }
    `;

    const response = await axios.post(url, { query, variables: { cursor } }, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' }
    });

    const data = response.data.data.products;
    
    // Filtra apenas produtos que AINDA NÃO TEM o metafield preenchido e possuem descrição
    const newPending = data.edges
      .map(edge => edge.node)
      .filter(p => p.metafield === null && p.descriptionHtml && p.descriptionHtml.length > 20);

    pendingProducts.push(...newPending);

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return pendingProducts;
}

// Atualiza o Metafield usando a REST API (funciona com o legacyResourceId)
async function updateProductMetafields(productId, fieldKey, fieldValue, fieldType) {
  const url = `https://${STORE_URL}/admin/api/2024-01/products/${productId}/metafields.json`;
  const payload = { metafield: { namespace: "custom", key: fieldKey, value: fieldValue, type: fieldType } };

  try {
    await axios.post(url, payload, {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' }
    });
    return true;
  } catch (error) {
    console.error(`  ❌ Erro ao salvar ${fieldKey}:`, error.response?.data || error.message);
    return false;
  }
}

// ==========================================
// FLUXO PRINCIPAL: AUTOMAÇÃO EM MASSA
// ==========================================
async function runMassAutomation() {
  console.log("🚀 Iniciando Otimizador GEO em MASSA...\n");

  try {
    const products = await getPendingProducts();
    
    if (products.length === 0) {
        console.log("✅ Uau! O seu catálogo já está 100% otimizado. Nenhum produto pendente encontrado.");
        return;
    }

    console.log(`🎯 Encontrados ${products.length} produtos que precisam de otimização GEO!\n`);

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        console.log(`[${i + 1}/${products.length}] Processando: ${p.title}`);
        
        try {
            const prompt = `--- INSTRUÇÕES ---\n${GEO_SYSTEM_INSTRUCTION}\n\n--- DADOS ---\nNOME: ${p.title}\nDESCRIÇÃO TÉCNICA ATUAL:\n${p.descriptionHtml}`;
            const result = await model.generateContent(prompt);
            
            let aiResponse = result.response.text().trim();
            aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '');
            
            const geoData = JSON.parse(aiResponse);

            // Injeta os dados
            await updateProductMetafields(p.legacyResourceId, "geo_faq", JSON.stringify(geoData.faq), "json");
            await updateProductMetafields(p.legacyResourceId, "geo_copydesk", geoData.copydesk, "multi_line_text_field");
            
            console.log(`  ✅ Otimização Concluída!`);
            
            // Pausa de 4.5 segundos para evitar bloqueios de Rate Limit da Shopify/Google (Tier gratuito do gemini)
            await sleep(4500);

        } catch (err) {
            console.error(`  ⚠️ Erro na IA/JSON para este produto saltando para o próximo.`);
            // Pausa um pouco maior caso o erro seja de Rate Limit do Gemini
            await sleep(5000); 
        }
    }

    console.log(`\n🎉 PROCESSO FINALIZADO COM SUCESSO!`);
    console.log(`Toda a sua loja agora é uma máquina otimizada para o Google e IAs!`);

  } catch (error) {
    console.error("\n❌ Erro crítico no robô:");
    console.error(error.message);
  }
}

// Inicia o processo
runMassAutomation();
