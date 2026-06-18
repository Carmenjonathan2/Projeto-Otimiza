/**
 * Módulo 2: O Roteirista (Copywriter)
 * 
 * Este módulo recebe os briefings do Módulo 1 e gera o conteúdo final:
 * 1. Post para Redes Sociais (Instagram/LinkedIn)
 * 2. Artigo para Blog Shopify (HTML + SEO/GEO)
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const MODEL_NAME = "gemini-flash-latest";
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// Schema de Resposta para Social (Especializado por Plataforma)
const socialSchema = {
    type: SchemaType.OBJECT,
    properties: {
        sugestao_visual: { type: SchemaType.STRING },
        instagram: {
            type: SchemaType.OBJECT,
            properties: {
                gancho: { type: SchemaType.STRING },
                corpo: { type: SchemaType.STRING },
                cta: { type: SchemaType.STRING }
            },
            required: ["gancho", "corpo", "cta"]
        },
        linkedin: {
            type: SchemaType.OBJECT,
            properties: {
                gancho: { type: SchemaType.STRING },
                corpo: { type: SchemaType.STRING },
                cta: { type: SchemaType.STRING }
            },
            required: ["gancho", "corpo", "cta"]
        }
    },
    required: ["sugestao_visual", "instagram", "linkedin"]
};

// Schema de Resposta para Blog
const blogSchema = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING },
        body_html: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
        classificacao: { type: SchemaType.STRING, description: "B2B ou B2C" },
        schema_markup: {
            type: SchemaType.OBJECT,
            properties: {
                "@context": { type: SchemaType.STRING },
                "@type": { type: SchemaType.STRING },
                "name": { type: SchemaType.STRING },
                "description": { type: SchemaType.STRING }
            }
        }
    },
    required: ["title", "body_html", "summary", "classificacao"]
};

const systemInstruction = `
Você é o Copywriter Sênior e Estrategista Multiplataforma da Otimiza FarmaVet. Sua missão é transformar briefings estratégicos em ecossistemas de conteúdo (Instagram + LinkedIn + Blog).

--- 🛡️ TRAVAS DE SEGURANÇA (MANDAMENTOS) ---
1. NATUREZA: SOMOS REVENDA/DISTRIBUIÇÃO. Nunca diga que fabricamos medicamentos.
2. PROIBIÇÃO TOTAL: Nunca fale sobre "Planos de Saúde Pet". Delírios sobre esse tema são terminantemente proibidos.
3. SEM DIAGNÓSTICOS: Não somos clínica. Nenhuma promessa de cura ou diagnóstico médico.
4. INCERTEZA: Se o briefing for vago ou incerto sobre a política da empresa, use o termo [GARGALO - REVISÃO HUMANA] no texto final para sinalizar o operador.
5. LOCALIZAÇÃO: Estamos em Belo Horizonte / Minas Gerais. Não invente outras sedes.

REGRAS DE PERSONA (Obrigatório em TODOS os canais):
1. Carmen (CEO & Jurídico): Tom de autoridade, governança e visão estratégica. Foco em segurança jurídica, compliance tributário e gestão de alto nível. PÚBLICO: Proprietários de Clínicas e Gestores. (B2B)
   - Blog: Assine como "Dra. Carmen - CEO & Bacharel em Direito".
   - LinkedIn: Use travessões (—) para pausas. SEM EMOJIS.
2. Kyenner (B2B): Tom pragmático, focado em lucro, estoque e logística. PÚBLICO: Gestores de Suprimentos. (B2B)
   - Blog: Assine como "Kyenner - Relacionamento Comercial".
   - LinkedIn: Direto ao ponto, focado em margem. SEM EMOJIS.
3. Aika (B2C): Tom em primeira pessoa (cachorra), focado no bem-estar e na facilidade para o tutor encontrar o remédio. PÚBLICO: Donos de Pets. (B2C)
   - Blog: Assine como "Lambeijos da Aika 🐾".
   - Instagram: Lúdico, com emojis, foco emocional.

ESPECIFICAÇÕES POR CANAL:
- INSTAGRAM: Foco no visual e ganchos rápidos. Emojis permitidos para Aika. Para demais, tom moderado.
- LINKEDIN (Ghostwriter Style): Use o travessão (—) para pausas naturais. FOCO EM INSIGHTS DE NEGÓCIO. Sem emojis. Use CAIXA ALTA para ênfase (moderadamente).
- BLOG: HTML estruturado (h2, h3, strong, p). SEO e GEO (Curitiba/PR) integrados. O artigo deve soar como uma expansão profunda do post social, mantendo a voz da persona.

A saída deve ser um JSON puro seguindo o esquema JSON fornecido em cada chamada.
`;

/**
 * Gera o conteúdo para cada briefing no array
 * @param {Array} briefings - Array de objetos do Módulo 1
 */
async function generateExecution(briefings) {
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
    });

    const results = [];
    console.log(`\n✍️  Módulo 2: Iniciando redação de ${briefings.length} kits multiplataforma (IG + LI + Blog)...`);

    for (let i = 0; i < briefings.length; i++) {
        const b = briefings[i];
        console.log(`   [${i + 1}/${briefings.length}] Processando Persona: ${b.persona_indicada} | Tema: ${b.tema_central.substring(0, 30)}...`);

        try {
            // Chamada 1: Social Posts (IG + LI)
            console.log(`      🔸 Gerando Posts Sociais (Instagram & LinkedIn)...`);
            const socialResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: `Gere o JSON com "instagram" e "linkedin" para o briefing: ${JSON.stringify(b)}. Siga o esquema: { sugestao_visual, instagram: { gancho, corpo, cta }, linkedin: { gancho, corpo, cta } }.` }] }],
                generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
            });
            
            // Parser Indestrutível
            const parseBetterJSON = (raw) => {
                const match = raw.match(/\{[\s\S]*\}/);
                if (!match) return null;
                const clean = match[0]
                    .replace(/,\s*([\}\]])/g, '$1') // Trailings
                    .replace(/\n\s*\/\/.*$/gm, '') // Comentários
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Invisíveis
                try { return JSON.parse(clean); } catch(e) { return null; }
            };

            const socialContent = parseBetterJSON(socialResult.response.text());

            // Chamada 2: Blog Metadata & Classificação
            console.log(`      🔸 Gerando Metadados Blog & Classificando (B2B/B2C)...`);
            const metaResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: `Gere o JSON de METADADOS para o briefing: ${JSON.stringify(b)}. Use as chaves: "title", "summary", "classificacao" (seja 'B2B' ou 'B2C'), "schema_markup".` }] }],
                generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
            });
            const metaContent = parseBetterJSON(metaResult.response.text());

            // Chamada 3: Blog Body HTML (Texto Puro assinado pela Persona)
            console.log(`      🔸 Gerando HTML do Artigo (Assinado por ${b.persona_indicada})...`);
            const htmlResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: `Escreva o ARTIGO BLOG EM HTML para o briefing: ${JSON.stringify(b)}. O texto DEVE ser escrito/assinado pela persona ${b.persona_indicada}. Use h2, h3, strong, p. SEM JSON. Apenas o código HTML bruto.` }] }]
            });
            const htmlContent = htmlResult.response.text().trim();

            if (!socialContent || !metaContent) throw new Error("Falha no parsing dos dados estruturados");

            results.push({
                social_post: socialContent,
                blog_article: {
                    ...metaContent,
                    body_html: htmlContent
                },
                briefing: b
            });

        } catch (error) {
            console.error(`      ❌ Erro ao gerar conteúdo ${i + 1}:`, error.message);
        }
    }

    // Salva o log visual (Simplificado para o terminal)
    const logFileName = `planejamento_multiplataforma_${Date.now()}.md`;
    let logMarkdown = `# Planejamento de Conteúdo Otimiza (IG + LI + Blog)\n\n`;
    results.forEach((res, idx) => {
        logMarkdown += `## Kit ${idx + 1}: ${res.briefing.tema_central}\n`;
        logMarkdown += `👤 Persona: ${res.briefing.persona_indicada} | 🏷️ Tipo: ${res.blog_article.classificacao}\n\n`;
        logMarkdown += `📱 INSTAGRAM:\n${res.social_post.instagram.corpo}\n\n`;
        logMarkdown += `🤝 LINKEDIN:\n${res.social_post.linkedin.corpo}\n\n`;
        logMarkdown += `📄 BLOG [${res.blog_article.title}]: (Enviado para Shopify)\n\n`;
        logMarkdown += `---\n\n`;
    });
    fs.writeFileSync(path.join(__dirname, logFileName), logMarkdown);
    console.log(`\n✅ Sucesso! O log visual foi salvo em: ${logFileName}`);

    return results;
}

module.exports = { generateExecution };
