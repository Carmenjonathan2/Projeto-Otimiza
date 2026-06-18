require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function fetchAllArticles() {
  const url = `https://${STORE_URL}/admin/api/2024-01/graphql.json`;
  let hasNextPage = true;
  let cursor = null;
  const allArticles = [];

  console.log("🔍 Puxando todos os artigos do blog da Shopify...");

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
              publishedAt
              author { name }
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
    allArticles.push(...data.edges.map(edge => edge.node));

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return allArticles;
}

function cleanHtml(html) {
  if (!html) return "";
  // Substitui tags br e blocos por quebras de linha reais
  let text = html.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<\/p>|<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<\/li>/gi, "\n");
  // Remove qualquer outra tag HTML sobrando
  text = text.replace(/<[^>]+>/g, '');
  // Decodifica entidades basicas
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return text.trim();
}

async function exportArticles() {
  const exportDir = path.join(__dirname, 'artigos-exportados');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  try {
    const articles = await fetchAllArticles();
    console.log(`✅ ${articles.length} Artigos encontrados. Salvando no PC...`);

    let metaJson = [];

    articles.forEach((a, index) => {
      // Cria nome de arquivo seguro
      const safeTitle = a.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
      const fileName = `art_${index + 1}_${safeTitle}.txt`;
      const filePath = path.join(exportDir, fileName);

      // Limpa as tags HTML para deixar só o texto puro bonitinho pra reutilização!
      const content = `TÍTULO: ${a.title}\nAUTOR: ${a.author ? a.author.name : 'Otimiza'}\nDATA: ${a.publishedAt}\n\n======================================\nCONTEÚDO:\n\n${cleanHtml(a.body)}`;
      
      fs.writeFileSync(filePath, content, 'utf-8');
      
      metaJson.push({
        id: a.id,
        title: a.title,
        file: fileName
      });
    });

    // Salva também uma planilha crua JSON com tudo
    fs.writeFileSync(path.join(exportDir, '_indice_geral.json'), JSON.stringify(metaJson, null, 2));

    console.log(`🎉 Extração concluída! Tudo salvo na pasta: otimiza-content-generator/artigos-exportados/`);

  } catch (err) {
    console.error("Erro na extração:", err);
  }
}

exportArticles();
