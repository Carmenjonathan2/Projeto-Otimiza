const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const TOKEN = process.env.TOKEN;
const ID_Instagram = process.env.ID_Instagram;

if (!TOKEN || !ID_Instagram) {
    console.error("[SNC] Aika IG: Erro! Credenciais do Instagram (TOKEN ou ID_Instagram) não encontradas no .env.");
    process.exit(1);
}

const vitrineDir  = path.resolve(__dirname, '../../../../1-Farmacia-Ecommerce/vitrine-virtual');
const postsDir    = path.resolve(vitrineDir, 'posts_prontos');
const enviadosDir = path.resolve(vitrineDir, 'posts_enviados');

async function uploadToCatbox(filePath) {
    console.log(`[SNC] Aika IG: Fazendo upload temporário de ${path.basename(filePath)} para o Catbox...`);
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 60000 // 1 minute timeout for uploads
    });
    return response.data.trim();
}

/**
 * Creates and publishes a story container on Instagram (supports both images and videos).
 * Uses active polling to wait until the media container is fully processed by Meta before publishing.
 */
async function postStoryToInstagram(mediaUrl, isVideo = false) {
    console.log(`[SNC] Aika IG: Criando container de Story no Instagram Graph API (${isVideo ? 'VÍDEO' : 'IMAGEM'})...`);
    
    const containerUrl = `https://graph.instagram.com/v19.0/${ID_Instagram}/media`;
    const params = {
        media_type: 'STORIES',
        access_token: TOKEN
    };
    
    if (isVideo) {
        params.video_url = mediaUrl;
    } else {
        params.image_url = mediaUrl;
    }

    const containerRes = await axios.post(containerUrl, null, { params });
    const containerId = containerRes.data.id;
    console.log(`[SNC] Aika IG: Container criado! ID: ${containerId}. Iniciando monitoramento de processamento...`);

    // Poll the container status until it's ready (FINISHED) or fails
    let isReady = false;
    const startTime = Date.now();
    const maxWaitTime = 180000; // max wait 3 minutes
    
    while (!isReady && (Date.now() - startTime) < maxWaitTime) {
        // Wait 10 seconds before checking status
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
            const statusUrl = `https://graph.instagram.com/v19.0/${containerId}`;
            const statusRes = await axios.get(statusUrl, {
                params: {
                    fields: 'status_code',
                    access_token: TOKEN
                }
            });
            const statusCode = statusRes.data.status_code;
            console.log(`[SNC] Aika IG: Status do Container ${containerId}: ${statusCode}`);
            
            if (statusCode === 'FINISHED') {
                isReady = true;
                break;
            } else if (statusCode === 'ERROR') {
                throw new Error(`Falha no processamento da Meta para o container ${containerId}.`);
            }
        } catch (err) {
            console.warn(`[SNC] Aika IG: Erro ao verificar status (tentando novamente): ${err.message}`);
        }
    }

    if (!isReady) {
        console.warn("[SNC] Aika IG: O container não finalizou o processamento no tempo limite. Tentando publicar mesmo assim...");
    }

    console.log("[SNC] Aika IG: Publicando o Story...");
    const publishUrl = `https://graph.instagram.com/v19.0/${ID_Instagram}/media_publish`;
    const publishRes = await axios.post(publishUrl, null, {
        params: {
            creation_id: containerId,
            access_token: TOKEN
        }
    });

    return publishRes.data.id;
}

async function main() {
    console.log("[SNC] Aika IG: Iniciando automação de Stories do Instagram...");
    
    // Garante que a pasta de enviados existe
    if (!fs.existsSync(enviadosDir)) {
        fs.mkdirSync(enviadosDir, { recursive: true });
    }

    // 1. Get the files in posts_prontos
    const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [];
    
    // 2. Determine campaign day number
    let dayNumber = 1;
    if (fs.existsSync(enviadosDir)) {
        const enviadosFiles = fs.readdirSync(enviadosDir);
        let maxDay = 0;
        let todayDay = null;
        const todayStr = new Date().toDateString();
        
        for (const f of enviadosFiles) {
            const match = f.match(/^dia\s+(\d+)\.\d+_ig\.(png|mp4)$/i) || f.match(/^dia\s+(\d+)\.\d+\.png$/i);
            if (match) {
                const dNum = parseInt(match[1], 10);
                if (dNum > maxDay) {
                    maxDay = dNum;
                }
                try {
                    const stats = fs.statSync(path.join(enviadosDir, f));
                    if (stats.mtime.toDateString() === todayStr) {
                        todayDay = dNum;
                    }
                } catch (err) {}
            }
        }
        
        if (todayDay !== null) {
            dayNumber = todayDay;
        } else {
            dayNumber = maxDay + 1;
        }
    }
    
    const day = new Date().getDate();
    console.log(`[SNC] Aika IG: Dia da campanha: ${dayNumber}. Dia do mês para rotação: ${day}.`);

    // 3. Resolve the 10 Story assets
    const storyFlow = [];

    // Story 1: Video alerta promo (Temporarily disabled due to horizontal format)
    // const videoPath = path.join(vitrineDir, 'video alerta promo.mp4');
    // storyFlow.push({ path: videoPath, isVideo: true, name: 'Video Alerta Promo' });

    // Stories 2 to 5: 4 product promotions selected by category keywords (shared logic)
    const metadataPath = path.join(vitrineDir, 'posts_metadata.json');
    const { getSelectedProductsForDay } = require('./product_selector');
    const { selectedProducts, selectedFiles } = getSelectedProductsForDay(metadataPath, files, day);

    if (selectedFiles.length < 4) {
        console.warn(`[SNC] Aika IG: Aviso! Menos de 4 flyers promocionais selecionados hoje (encontrados: ${selectedFiles.length}).`);
    }

    selectedFiles.forEach((file, index) => {
        storyFlow.push({
            path: path.join(postsDir, file),
            isVideo: false,
            name: `Promoção ${index + 1}: ${selectedProducts[index]?.nome || file}`
        });
    });

    // Story 6: Vaccine summary (Prioritize user-edited 'vacinas pronto.jpg', fallback to 'post_vacinas.png')
    let summaryPath = path.join(postsDir, 'vacinas pronto.jpg');
    if (!fs.existsSync(summaryPath)) {
        summaryPath = path.join(postsDir, 'post_vacinas.png');
    }
    storyFlow.push({ path: summaryPath, isVideo: false, name: 'Resumo Campanha Vacinas' });

    // Stories 7 to 10: 4 individual vaccine flyers
    const vaccineFiles = [
        'post_vacina_nobivac.png',
        'post_vacina_antirrabica.png',
        'post_vacina_gripe.png',
        'post_vacina_recombitek.png'
    ];

    vaccineFiles.forEach((file, index) => {
        storyFlow.push({
            path: path.join(postsDir, file),
            isVideo: false,
            name: `Vacina Individual ${index + 1}: ${file}`
        });
    });

    // 4. Validate all resolved files exist
    console.log("[SNC] Aika IG: Validando arquivos da sequência de 10 Stories...");
    let validationOk = true;
    for (const story of storyFlow) {
        if (!fs.existsSync(story.path)) {
            console.error(`[SNC] Aika IG: Erro! Arquivo não encontrado: ${story.path} (${story.name})`);
            validationOk = false;
        } else {
            console.log(`[SNC] Aika IG: [OK] Encontrado: ${path.basename(story.path)} (${story.name})`);
        }
    }

    if (!validationOk) {
        console.error("[SNC] Aika IG: Falha na validação de arquivos. Abortando fluxo diário.");
        process.exit(1);
    }

    console.log(`[SNC] Aika IG: Todos os ${storyFlow.length} arquivos validados. Iniciando postagens...`);

    // 5. Publish stories in order
    let postedCount = 0;
    for (let i = 0; i < storyFlow.length; i++) {
        const story = storyFlow[i];
        const slot = i + 1;
        const ext = story.isVideo ? 'mp4' : 'png';
        const renamed = `dia ${dayNumber}.${slot}_ig.${ext}`;
        const targetEnviadoPath = path.join(enviadosDir, renamed);

        console.log(`\n[SNC] Aika IG: --- POSTANDO STORY ${slot}/${storyFlow.length} (${story.name}) ---`);
        
        try {
            // Upload to Catbox
            const publicUrl = await uploadToCatbox(story.path);
            console.log(`[SNC] Aika IG: Hospedado temporariamente: ${publicUrl}`);

            // Call Graph API
            const publishedId = await postStoryToInstagram(publicUrl, story.isVideo);
            console.log(`[SNC] Aika IG: Story ${slot} postado com sucesso! ID da Publicação: ${publishedId}`);

            // Copy to enviados with standardized name
            fs.copyFileSync(story.path, targetEnviadoPath);
            console.log(`[SNC] Aika IG: Cópia de log salva como ${renamed}`);

            postedCount++;

            // Cooldown between stories (10 seconds)
            if (slot < storyFlow.length) {
                console.log("[SNC] Aika IG: Aguardando 10 segundos de cooldown antes da próxima mídia...");
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        } catch (err) {
            console.error(`[SNC] Aika IG: Erro ao postar Story ${slot} (${story.name}):`, err.response ? err.response.data : err.message);
        }
    }

    console.log(`\n[SNC] Aika IG: Fluxo finalizado! Postados com sucesso: ${postedCount}/${storyFlow.length} Stories.`);
}

main().catch(err => {
    console.error("[SNC] Aika IG: Erro não tratado na rotina principal:", err);
});
