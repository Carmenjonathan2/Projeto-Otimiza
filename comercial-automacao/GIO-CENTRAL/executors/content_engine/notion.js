/**
 * Módulo 6: Integração Notion
 * Localizado em: /otimiza-content-generator/notion.js
 */

const { Client } = require('@notionhq/client');

const {
    NOTION_API_KEY,
    NOTION_DATABASE_ID
} = process.env;

/**
 * Cria páginas no Notion para cada briefing gerado
 * @param {Array} briefings - Dados do Módulo 1
 * @param {string} finalMarkdown - Conteúdo final do Módulo 3
 */
/**
 * Cria páginas no Notion para cada briefing gerado
 * @param {Array} results - Dados completos do Módulo 2 (social_post, blog_article, briefing)
 */
async function pushToNotion(results) {
    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
        console.error("\n⚠️  Erro Notion: Chaves faltando no arquivo .env.");
        return;
    }

    const notion = new Client({ auth: NOTION_API_KEY.trim() });
    const databaseId = NOTION_DATABASE_ID.trim();

    console.log(`\n📓 Módulo 6: Sincronizando com o Notion (Especializado)...`);
    
    for (const res of results) {
        const b = res.briefing;
        const s = res.social_post;
        
        try {
            // Prepara os blocos de conteúdo
            const childrenBlocks = [
                {
                    object: 'block',
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{ text: { content: `🚀 Kit Multiplataforma: ${res.briefing.persona_indicada}` } }]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ text: { content: "📱 Instagram" } }]
                    }
                },
                {
                    object: 'block',
                    type: 'callout',
                    callout: {
                        rich_text: [{ text: { content: `Formato: ${b.formato_post}\nGancho: ${s.instagram.gancho}` } }],
                        icon: { emoji: "📸" },
                        color: "purple_background"
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ text: { content: s.instagram.corpo } }]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ text: { content: "🤝 LinkedIn (Para Ghostwriter)" } }]
                    }
                },
                {
                    object: 'block',
                    type: 'quote',
                    quote: {
                        rich_text: [{ text: { content: s.linkedin.corpo } }]
                    }
                },
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ text: { content: "📄 Blog Article (Shopify)" } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ text: { content: `Título: ${res.blog_article.title}\nStatus: Enviado como Rascunho para blog '${res.blog_article.classificacao === 'B2B' ? 'Fala, MedVet!' : 'Tutores'}'` } }]
                    }
                }
            ];

            // Criação da página no Notion
            const response = await notion.pages.create({
                parent: { database_id: databaseId },
                properties: {
                    "Nome": {
                        title: [
                            {
                                text: {
                                    content: `[${res.blog_article.classificacao}] [${res.briefing.persona_indicada}] ${b.tema_central}`
                                }
                            }
                        ]
                    },
                    "Status": {
                        status: {
                            name: "Pronto para Agendar"
                        }
                    }
                },
                children: childrenBlocks
            });

            console.log(`   ✅ Notion: [${res.briefing.persona_indicada}] ${b.tema_central.substring(0, 30)}...`);

        } catch (error) {
            console.error(`   ❌ Erro no Notion para ${b.tema_central}:`, error.message);
        }
    }
}

module.exports = { pushToNotion };
