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
async function pushToNotion(briefings, finalMarkdown) {
    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
        console.error("\n⚠️  Erro Notion: Chaves faltando no arquivo .env.");
        return;
    }

    const notion = new Client({ auth: NOTION_API_KEY.trim() });
    const databaseId = NOTION_DATABASE_ID.trim();

    console.log(`\n📓 Módulo 6: Sincronizando com o Notion...`);
    
    // Divide o markdown final pelos separadores '---'
    const postSections = finalMarkdown.split('---').filter(s => s.trim().includes('## Post'));

    for (let i = 0; i < briefings.length; i++) {
        const b = briefings[i];
        const content = postSections[i] || "Conteúdo não segmentado corretamente.";
        
        try {
            // Prepara os blocos de conteúdo
            const childrenBlocks = [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ text: { content: "🖼️ Sugestão Visual" } }]
                    }
                }
            ];

            // Se houver imagem local, adicionamos o caminho e um callout
            if (b.localImagePath) {
                const fileName = b.localImagePath.split('\\').pop().split('/').pop();
                childrenBlocks.push({
                    object: 'block',
                    type: 'callout',
                    callout: {
                        rich_text: [{ text: { content: `Arte gerada: ${fileName}\nCaminho: ${b.localImagePath}` } }],
                        icon: { emoji: "🎨" },
                        color: "blue_background"
                    }
                });
            }

            // NOVO: Adiciona o Prompt Detalhado da Imagem
            if (b.imagePrompt) {
                childrenBlocks.push(
                    {
                        object: 'block',
                        type: 'heading_2',
                        heading_2: {
                            rich_text: [{ text: { content: "🤖 IA Image Prompt" } }]
                        }
                    },
                    {
                        object: 'block',
                        type: 'code',
                        code: {
                            language: 'plain text',
                            rich_text: [{ text: { content: b.imagePrompt } }]
                        }
                    }
                );
            }

            childrenBlocks.push(
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ text: { content: "✍️ Conteúdo do Post" } }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ text: { content: content.trim().substring(0, 2000) } }]
                    }
                }
            );

            // Criação da página no Notion
            const response = await notion.pages.create({
                parent: { database_id: databaseId },
                properties: {
                    "Nome": {
                        title: [
                            {
                                text: {
                                    content: `[${b.formato_post || 'Post'}] [${b.frente_de_negocio}] ${b.tema_central}`
                                }
                            }
                        ]
                    },
                    "Status": {
                        status: {
                            name: "Não iniciada"
                        }
                    }
                },
                children: childrenBlocks
            });

            console.log(`   ✅ Página no Notion Criada: ${b.tema_central.substring(0, 40)}...`);
            console.log(`      🔗 URL: ${response.url}`);

        } catch (error) {
            console.error(`   ❌ Erro no Notion para ${b.tema_central}:`, error.message);
            if (error.body) console.error("      Detais:", error.body);
        }
    }
}

module.exports = { pushToNotion };
