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
// PROMPT: O SEGREDO DO GEO PARA COLEÇÕES
// ==========================================
const GEO_SYSTEM_INSTRUCTION = `
Você é o Especialista Sênior em GEO (Generative Engine Optimization) e Curador de Conteúdo de uma Farmácia Veterinária.
Eu te passarei o Nome e uma breve descrição de uma CATEGORIA/COLEÇÃO da loja (ex: Remédios para Pulgas, Rações Premium, Brinquedos).

SUA TAREFA:
Devolva ESTRITAMENTE UM OBJETO JSON VÁLIDO (sem markdown, sem \`\`\`json, texto puro) com as duas chaves abaixo:

1. "hero_text": Uma introdução magnética (1 ou 2 parágrafos no máximo) posicionando a autoridade da farmácia nessa categoria. Explique brevemente como escolher produtos dessa coleção, demonstrando empatia com o tutor e foco em bem-estar animal. Use <br> ou <strong> se necessário.
2. "faq": Um Array de Objetos. Gere 4 perguntas frequentes que tutores fazem no Google/ChatGPT antes de comprar produtos DESTA categoria em geral. As respostas devem mostrar autoridade técnica e ajudar na decisão de compra de forma imparcial. Estrutura exata: [{"pergunta": "...", "resposta": "..."}, {...}]

Gere conteúdo médico-veterinário seguro e focado em informar a IA e humanos sobre COMO comprar dessa prateleira.
Retorne apenas o JSON limpo!
`;

// ==========================================
// FUNÇÕES DA API DA SHOPIFY
// ==========================================

async function getPendingCollections() {
  const url = `https://${STORE_URL}/admin/api/2024-01/graphql.json`;
  let hasNextPage = true;
  let cursor = null;
  const pendingCollections = [];

  console.log("🔍 Mapeando todas as Coleções da Shopify... (Isso pode levar alguns segundos)");

  while (hasNextPage) {
    const query = `
      query ($cursor: String) {
        collections(first: 50, after: $cursor) {
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

    const data = response.data.data.collections;
    
    // Filtra apenas as que AINDA NÃO TEM o metafield preenchido
    const newPending = data.edges
      .map(edge => edge.node)
      .filter(c => c.metafield === null);

    pendingCollections.push(...newPending);

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return pendingCollections;
}

async function updateCollectionMetafields(collectionId, fieldKey, fieldValue, fieldType) {
  const url = `https://${STORE_URL}/admin/api/2024-01/collections/${collectionId}/metafields.json`;
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
  console.log("🚀 Iniciando Otimizador GEO em MASSA nas COLEÇÕES...\n");

  try {
    const collections = await getPendingCollections();
    
    if (collections.length === 0) {
        console.log("✅ Uau! Todas as suas coleções/categorias já estão 100% otimizadas.");
        return;
    }

    console.log(`🎯 Encontradas ${collections.length} coleções que precisam de otimização GEO!\n`);

    for (let i = 0; i < collections.length; i++) {
        const c = collections[i];
        console.log(`[${i + 1}/${collections.length}] Processando: ${c.title}`);
        
        try {
            const contextHtml = c.descriptionHtml ? c.descriptionHtml : "Sem descrição prévia.";
            const prompt = `--- INSTRUÇÕES ---\n${GEO_SYSTEM_INSTRUCTION}\n\n--- DADOS ---\nNOME DA COLEÇÃO: ${c.title}\nCONTEXTO/DESCRIÇÃO ATUAL:\n${contextHtml}`;
            
            const result = await model.generateContent(prompt);
            
            let aiResponse = result.response.text().trim();
            aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '');
            
            const geoData = JSON.parse(aiResponse);

            await updateCollectionMetafields(c.legacyResourceId, "geo_faq", JSON.stringify(geoData.faq), "json");
            await updateCollectionMetafields(c.legacyResourceId, "geo_hero_text", geoData.hero_text, "multi_line_text_field");
            
            console.log(`  ✅ Otimização Concluída para a Categoria!`);
            
            // Pausa generosa para prevenir Rate Limits da Shopify e Google
            await sleep(4500);

        } catch (err) {
            console.error(`  ⚠️ Erro na IA/JSON para a categoria saltando para a próxima.`);
            await sleep(5000); 
        }
    }

    console.log(`\n🎉 PROCESSO FINALIZADO!`);
    console.log(`Todas as coleções da sua loja agora blindam a inteligência das IAs!`);

  } catch (error) {
    console.error("\n❌ Erro crítico no robô:");
    console.error(error.message);
  }
}

runMassAutomation();
