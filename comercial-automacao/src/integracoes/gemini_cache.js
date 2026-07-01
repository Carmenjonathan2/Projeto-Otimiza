const { GoogleAICacheManager } = require('@google/generative-ai/server');
require('dotenv').config();

// Mapa em memória para armazenar os metadados do cache por persona
const cacheMap = new Map();

/**
 * Obtém o cache existente ou cria um novo se estiver expirado ou ausente.
 * @param {string} persona - 'Aika' ou 'Kyenner'
 * @param {string} modelName - Nome do modelo (ex: 'gemini-2.5-flash-lite')
 * @param {string} systemInstructionText - Texto completo do system instruction
 * @returns {Promise<string|null>} O nome do cache no formato da API do Gemini ou null se desativado
 */
async function getOrCreateCache(persona, modelName, systemInstructionText) {
    const isCacheEnabled = process.env.GEMINI_CACHE_ENABLED === 'true';
    if (!isCacheEnabled) {
        return null;
    }

    const now = Date.now();
    const cached = cacheMap.get(persona);

    // Reutilizar o cache se ele existir e faltar mais de 5 minutos para expirar
    if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
        console.log(`[CACHE-GEMINI] Reutilizando cache existente para ${persona}: ${cached.name}`);
        return cached.name;
    }

    console.log(`[CACHE-GEMINI] Cache ausente ou expirando para ${persona}. Criando novo cache...`);

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY não configurada no ambiente.");
        }

        const cacheManager = new GoogleAICacheManager(apiKey);
        const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

        // Mínimo de 1024 tokens exigido pela API do Gemini.
        // Se regrasCriticas + activeSystemInstruction < 1024 tokens,
        // adicionamos um padding sintético (~~~CACHE_PADDING~~~) nos contents para atingir o mínimo.
        // 400 repetições garantem ~1600 tokens.
        const paddingText = "~~~CACHE_PADDING~~~ ".repeat(400);

        const cache = await cacheManager.create({
            model: modelPath,
            displayName: `otimiza_cache_${persona.toLowerCase()}`,
            systemInstruction: {
                parts: [{ text: systemInstructionText }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: paddingText }]
                }
            ],
            ttl: '3600s' // TTL de 1 hora
        });

        console.log(`[CACHE-GEMINI] Cache criado com sucesso. Nome: ${cache.name}`);

        // Armazenar no Map com tempo de expiração de 50 minutos (margem de segurança de 10 minutos do TTL de 1h)
        cacheMap.set(persona, {
            name: cache.name,
            expiresAt: now + 50 * 60 * 1000
        });

        return cache.name;
    } catch (e) {
        console.error(`❌ [CACHE-GEMINI] Erro ao criar cache para ${persona}:`, e.message);
        // Fallback: se o cache falhar, retorna null para cair no fluxo sem cache
        return null;
    }
}

/**
 * Invalida o cache em memória para a persona indicada.
 * Utilizado para hot-reload e depuração de alterações nos prompts.
 * @param {string} persona 
 */
function invalidateCache(persona) {
    console.log(`[CACHE-GEMINI] Invalidando cache para ${persona}`);
    cacheMap.delete(persona);
}

module.exports = {
    getOrCreateCache,
    invalidateCache
};
