/**
 * Gemini Carousel Builder
 *
 * Pipeline duplo: Claude (Diretor de Arte) → Gemini (Renderizador de Imagens)
 *
 * Uso:
 *   node gemini-carousel-builder.js "Tema do carrossel | Frente | Instruções"
 *   node gemini-carousel-builder.js ./minha-referencia.json
 *
 * Formato do JSON de referência (opcional):
 * {
 *   "tema": "string",
 *   "frente_de_negocio": "RT | B2B | B2C",
 *   "referencias": {
 *     "textos": ["..."],
 *     "estilo_visual": "...",
 *     "tom_especifico": "...",
 *     "numero_slides": 6
 *   }
 * }
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('ERRO: ANTHROPIC_API_KEY não encontrada no .env');
    process.exit(1);
}
if (!GEMINI_API_KEY) {
    console.error('ERRO: GEMINI_API_KEY não encontrada no .env');
    process.exit(1);
}

const claude = new Anthropic.default({ apiKey: ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- CONSTITUIÇÃO VISUAL OTIMIZA ---
const VISUAL_CONSTITUTION = `
BRAND IDENTITY - Otimiza FarmaVet:
- Brand Colors: Otimiza Blue (#1A3A6B), Grooming Green (#2ECC71), Pet Shop Orange (#FF6B35)
- Accent colors: soft purple (#7B68EE) and teal (#00BCD4)
- Photography style: high quality, natural or studio light, clean and professional
- Layout: grid-based, clean negative space, ample breathing room
- Footer area: always leave space at the bottom for OTIMIZA logo and contact info
- CRITICAL: NO text, words, letters, watermarks, or UI overlays in the image

PERSONAS & VISUAL STYLE:
- RT (Carmen): dark/muted professional palette, legal/corporate atmosphere, authority signaling
- B2B (Kyenner): dynamic business environment, logistics/supply chain imagery, growth indicators
- B2C / Aika: 3D animation style (Pixar/Illumination quality), white/cream fluffy dog with blue eyes, warm and playful
`;

const CLAUDE_SYSTEM_PROMPT = `Você é o Diretor de Arte Sênior da Otimiza FarmaVet, especialista em design de carrosséis para Instagram.

Sua missão: analisar as referências fornecidas e estruturar um carrossel completo em JSON com:
1. Estratégia editorial por slide (o QUE dizer e COMO)
2. Prompt visual ultra-detalhado em inglês para geração de imagem (Gemini) — cada slide precisa de imagem única e coerente com a narrativa

REGRAS DE CONTEÚDO:
- A Otimiza FarmaVet é uma FARMÁCIA de revenda/distribuição veterinária — NÃO uma clínica
- Nunca prometer curas ou resultados médicos
- RT (Carmen): tom jurídico e de autoridade, foco em compliance e segurança
- B2B (Kyenner): foco em parceria, margem de lucro, logística
- B2C/Aika: 3D animation, lúdico, educativo, empático

CONSTITUIÇÃO VISUAL:
${VISUAL_CONSTITUTION}

ESTRUTURA DE SLIDES PADRÃO:
- Slide 1 (Capa): gancho de atenção + título impactante
- Slides 2-4 (Conteúdo): desenvolvimento do argumento, um ponto por slide
- Slide 5 (Resolução): como a Otimiza resolve o problema
- Slide 6 (CTA): chamada para ação clara

Retorne APENAS um JSON válido, sem markdown, sem texto antes ou depois:
{
  "carrossel": {
    "tema": "string",
    "frente_de_negocio": "RT|B2B|B2C",
    "persona": "Carmen|Kyenner|Aika",
    "objetivo": "string",
    "conceito_visual_global": "string — descreva o fio visual que une todos os slides",
    "slides": [
      {
        "numero": 1,
        "tipo": "capa|conteudo|resolucao|cta",
        "titulo": "string — texto curto e impactante para o slide",
        "subtitulo": "string — complemento ou dado de apoio",
        "corpo_texto": "string — texto completo da legenda/body deste slide",
        "cta": "string|null — apenas no slide final",
        "prompt_imagem_en": "string — prompt ultra-detalhado em inglês para geração de imagem no Gemini, seguindo a Constituição Visual. Seja específico sobre composição, iluminação, cores, atmosfera e personagens. NUNCA mencione texto na imagem."
      }
    ]
  }
}`;

/**
 * Etapa 1: Claude analisa referências e gera o JSON do carrossel
 */
async function buildCarouselStructure(input) {
    console.log('\n🧠 Claude (Diretor de Arte) analisando referências...');

    let userMessage;
    if (typeof input === 'string') {
        userMessage = `Crie um carrossel para o seguinte briefing:\n${input}`;
    } else {
        userMessage = `Crie um carrossel baseado nestas referências:\n${JSON.stringify(input, null, 2)}`;
    }

    const response = await claude.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: CLAUDE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
    });

    const rawText = response.content[0].text.trim();

    // Remove blocos de markdown caso o modelo insira mesmo assim
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
        const parsed = JSON.parse(cleaned);
        const slides = parsed.carrossel?.slides;
        if (!slides || !Array.isArray(slides)) throw new Error('Estrutura de slides inválida');
        console.log(`   ✅ ${slides.length} slides estruturados por Claude.`);
        return parsed.carrossel;
    } catch (err) {
        console.error('   ❌ Falha ao parsear JSON do Claude:', err.message);
        console.error('   Resposta recebida:\n', rawText.substring(0, 500));
        throw err;
    }
}

/**
 * Etapa 2: Gemini renderiza a imagem para um slide
 */
async function renderSlideImage(slide, carouselTheme, outputDir) {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

    const fullPrompt = `${slide.prompt_imagem_en}

STRICT RULES: No text, no letters, no words, no watermarks, no UI elements visible anywhere in the image. Clean professional composition. Studio-quality lighting.`;

    try {
        const result = await model.generateContent(fullPrompt);
        const parts = result.response.candidates?.[0]?.content?.parts || [];

        let base64Image = null;
        for (const part of parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }

        if (!base64Image) {
            throw new Error('Gemini não retornou inlineData para o slide ' + slide.numero);
        }

        const themeSlug = carouselTheme.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `slide_${String(slide.numero).padStart(2, '0')}_${themeSlug}.png`;
        const filePath = path.join(outputDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
        console.log(`   ✅ Slide ${slide.numero}: ${fileName}`);
        return filePath;

    } catch (err) {
        console.error(`   ⚠️  Falha no Slide ${slide.numero}: ${err.message}`);
        return null;
    }
}

/**
 * Pipeline principal
 */
async function runCarouselPipeline(rawInput) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   GEMINI CAROUSEL BUILDER - Otimiza FarmaVet ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Resolve input: arquivo JSON ou string de briefing
    let input = rawInput;
    if (rawInput.endsWith('.json') && fs.existsSync(rawInput)) {
        console.log(`📂 Carregando referências de: ${rawInput}`);
        input = JSON.parse(fs.readFileSync(rawInput, 'utf8'));
    }

    // --- ETAPA 1: Claude → Estrutura do Carrossel ---
    const carrossel = await buildCarouselStructure(input);

    // Cria diretório de saída com timestamp
    const timestamp = Date.now();
    const themeSlug = carrossel.tema.substring(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputDir = path.join(__dirname, `carrossel_${themeSlug}_${timestamp}`);
    fs.mkdirSync(outputDir, { recursive: true });

    // Salva o JSON do carrossel para referência
    const jsonPath = path.join(outputDir, 'carrossel_estrutura.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ carrossel }, null, 2));
    console.log(`\n📋 Estrutura salva em: carrossel_estrutura.json`);
    console.log(`   Tema: ${carrossel.tema}`);
    console.log(`   Frente: ${carrossel.frente_de_negocio} | Persona: ${carrossel.persona}`);
    console.log(`   Slides: ${carrossel.slides.length}`);

    // --- ETAPA 2: Gemini → Imagens por Slide (sequencial para evitar rate limit) ---
    console.log('\n🎨 Gemini gerando imagens slide a slide...');
    const imageResults = [];

    for (const slide of carrossel.slides) {
        console.log(`\n   [${slide.numero}/${carrossel.slides.length}] ${slide.tipo.toUpperCase()}: "${slide.titulo}"`);
        const imagePath = await renderSlideImage(slide, carrossel.tema, outputDir);
        imageResults.push({ slide: slide.numero, imagePath, tipo: slide.tipo });

        // Pequena pausa para não saturar a API
        if (slide.numero < carrossel.slides.length) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    // --- RESUMO FINAL ---
    const sucessos = imageResults.filter(r => r.imagePath).length;
    const falhas = imageResults.filter(r => !r.imagePath).length;

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║              PIPELINE CONCLUÍDO              ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`\n📁 Pasta de saída: ${outputDir}`);
    console.log(`   ✅ Imagens geradas: ${sucessos}/${carrossel.slides.length}`);
    if (falhas > 0) console.log(`   ⚠️  Falhas: ${falhas} slides`);
    console.log(`\n📝 Conteúdo dos slides (para legenda/copy):\n`);

    for (const slide of carrossel.slides) {
        console.log(`--- Slide ${slide.numero} (${slide.tipo}) ---`);
        console.log(`Título: ${slide.titulo}`);
        if (slide.subtitulo) console.log(`Subtítulo: ${slide.subtitulo}`);
        if (slide.cta) console.log(`CTA: ${slide.cta}`);
        console.log('');
    }

    return { carrossel, imageResults, outputDir };
}

// --- EXECUÇÃO ---
const inputArg = process.argv[2];

if (!inputArg) {
    console.log(`
Uso:
  node gemini-carousel-builder.js "Tema | Frente | Instruções"
  node gemini-carousel-builder.js ./referencia.json

Exemplo:
  node gemini-carousel-builder.js "RT | Carmen | Como a falta de RT expõe a clínica a autuações do CRMV"
  node gemini-carousel-builder.js "B2C | Aika | Os 5 erros que os tutores cometem ao comprar medicamento pet online"
`);
    process.exit(0);
}

runCarouselPipeline(inputArg).catch(err => {
    console.error('\n💥 ERRO CRÍTICO:', err.message);
    process.exit(1);
});
