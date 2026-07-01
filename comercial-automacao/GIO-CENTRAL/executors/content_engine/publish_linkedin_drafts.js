/**
 * Módulo: LinkedIn Publisher (Auto)
 * Caminho: /otimiza-content-generator/publish_linkedin_drafts.js
 * Objetivo: Pegar os rascunhos especializados e publicar via API do LinkedIn.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_URN   = process.env.LINKEDIN_AUTHOR_URN;
const DRAFTS_DIR     = path.join(__dirname, 'linkedin-drafts');

async function publishDraft(filePath) {
    if (!LINKEDIN_TOKEN || !LINKEDIN_URN) {
        console.error("❌ Erro: LINKEDIN_ACCESS_TOKEN ou AUTHOR_URN não configurados no .env.");
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    console.log(`🚀 Publicando draft: ${fileName}...`);

    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const payload = {
        "author": LINKEDIN_URN,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    try {
        await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${LINKEDIN_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        console.log(`   ✅ Sucesso! Post publicado no LinkedIn.`);
        
        // Move para pasta de publicados
        const sentDir = path.join(DRAFTS_DIR, 'publicados');
        if (!fs.existsSync(sentDir)) fs.mkdirSync(sentDir);
        fs.renameSync(filePath, path.join(sentDir, fileName));
        
    } catch (err) {
        console.error(`   ❌ Falha ao publicar ${fileName}:`, err.response?.data || err.message);
    }
}

async function runAutoPublish() {
    if (!fs.existsSync(DRAFTS_DIR)) {
        console.log("📂 Nenhuma pasta de drafts encontrada.");
        return;
    }

    const drafts = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.txt'));
    
    if (drafts.length === 0) {
        console.log("📭 Nenhum post pendente no LinkedIn.");
        return;
    }

    console.log(`\n📢 Iniciando publicação de ${drafts.length} posts pendentes...`);
    
    for (const file of drafts) {
        await publishDraft(path.join(DRAFTS_DIR, file));
        // Delay de segurança entre posts
        await new Promise(r => setTimeout(r, 5000));
    }
}

runAutoPublish();
