const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const TOKEN = process.env.TOKEN;
const ID_Instagram = process.env.ID_Instagram;

console.log("=========================================================");
console.log("🔍 AIKA INSTAGRAM: Buscando Comentários Recentes...");
console.log("=========================================================");

if (!TOKEN || !ID_Instagram) {
    console.error("❌ Erro: TOKEN ou ID_Instagram não configurados no arquivo .env");
    process.exit(1);
}

async function fetchRecentComments() {
    try {
        console.log("1. Buscando as 5 postagens mais recentes...");
        const mediaUrl = `https://graph.facebook.com/v19.0/${ID_Instagram}/media`;
        const mediaRes = await axios.get(mediaUrl, {
            params: {
                fields: 'id,caption,media_type,timestamp,permalink',
                limit: 5,
                access_token: TOKEN
            }
        });

        const mediaList = mediaRes.data.data;
        if (!mediaList || mediaList.length === 0) {
            console.log("📭 Nenhuma postagem encontrada na conta.");
            return;
        }

        console.log(`✅ Encontradas ${mediaList.length} postagens. Buscando comentários...\n`);

        for (const media of mediaList) {
            const date = new Date(media.timestamp).toLocaleString('pt-BR');
            const captionSnippet = media.caption ? media.caption.substring(0, 50).replace(/\n/g, ' ') + '...' : '(Sem legenda)';
            
            console.log(`---------------------------------------------------------`);
            console.log(`📸 POST ID: ${media.id}`);
            console.log(`📅 Data: ${date}`);
            console.log(`📝 Legenda: "${captionSnippet}"`);
            console.log(`🔗 Link: ${media.permalink}`);
            console.log(`---------------------------------------------------------`);

            try {
                const commentsUrl = `https://graph.facebook.com/v19.0/${media.id}/comments`;
                const commentsRes = await axios.get(commentsUrl, {
                    params: {
                        fields: 'id,text,timestamp,username,replies{id,text,timestamp,username}',
                        access_token: TOKEN
                    }
                });

                const comments = commentsRes.data.data;
                if (!comments || comments.length === 0) {
                    console.log("   💬 Nenhum comentário neste post.");
                } else {
                    console.log(`   💬 Comentários encontrados (${comments.length}):`);
                    for (const comment of comments) {
                        const commentDate = new Date(comment.timestamp).toLocaleString('pt-BR');
                        const text = comment.text || "[Texto oculto - App em Modo de Desenvolvimento]";
                        const username = comment.username ? `@${comment.username}` : "@usuario_oculto";
                        console.log(`      👤 ${username} [${commentDate}]: "${text}"`);
                        
                        // Check if there are replies
                        if (comment.replies && comment.replies.data) {
                            for (const reply of comment.replies.data) {
                                const replyDate = new Date(reply.timestamp).toLocaleString('pt-BR');
                                const replyText = reply.text || "[Texto oculto - App em Modo de Desenvolvimento]";
                                const replyUsername = reply.username ? `@${reply.username}` : "@usuario_oculto";
                                console.log(`         ↪ 👤 ${replyUsername} [${replyDate}]: "${replyText}"`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`   ❌ Erro ao buscar comentários para o post ${media.id}:`, err.response ? err.response.data.error.message : err.message);
            }
            console.log("\n");
        }

    } catch (err) {
        console.error("❌ Erro fatal ao acessar a API do Instagram:");
        if (err.response) {
            console.error(`   Status: ${err.response.status}`);
            console.error(`   Mensagem: ${err.response.data.error ? err.response.data.error.message : JSON.stringify(err.response.data)}`);
        } else {
            console.error(`   Mensagem: ${err.message}`);
        }
    }
}

fetchRecentComments();
