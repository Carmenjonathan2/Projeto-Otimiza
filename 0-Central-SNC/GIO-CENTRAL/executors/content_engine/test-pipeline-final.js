require('dotenv').config();
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Importação dos Módulos
const { generateExecution } = require('./copywriter');
const { runComplianceReview } = require('./compliance');
const { pushToNotion } = require('./notion');
const { gerarImagemBase } = require('./image-generator');

const MODEL_NAME = "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const PADRAO_VISUAL_OTIMIZA = `
Brand Colors: Otimiza Blue, Grooming Green, Pet Shop Orange. Accent colors: soft purple and teal.
Photography Style: High quality, natural light. Focus on happy, clean, and healthy animals. Focus on facial expressions. Human-pet interaction is highly encouraged.
Layout & Composition: Grid-based approach or circular masks for the animals. Add light illustrative elements like paws, bones, or small stars around the subjects.
Typography & UI: Clean layout with a space at the bottom for the 'OTIMIZA' logo and contact info.
`;

async function gerarPromptDeImagem(temaDoPost) {
    const modelPrompt = genAI.getGenerativeModel({ 
        model: MODEL_NAME, 
        systemInstruction: `Você é um Diretor de Arte sênior. O usuário vai te passar o tema de um post de rede social para uma farmácia veterinária. Sua missão é escrever um prompt de geração de imagem ultra-detalhado, em inglês, que obrigatoriamente incorpore as regras do PADRAO_VISUAL_OTIMIZA:
        
        ${PADRAO_VISUAL_OTIMIZA}
        
        O prompt final deve ser apenas um parágrafo direto ao ponto, pronto para ser colado em um gerador de imagens, sem introduções.`
    });

    const result = await modelPrompt.generateContent(`Tema do Post: ${temaDoPost}`);
    return result.response.text().trim();
}

const responseSchema = {
    description: "Set of strategy briefings",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            frente_de_negocio: { type: SchemaType.STRING, description: "RT, B2B Suprimentos ou B2C Tutor" },
            tema_central: { type: SchemaType.STRING, description: "A dor ou desejo explorado" },
            gancho_de_atencao: { type: SchemaType.STRING, description: "O gancho para prender a atenção" },
            persona_indicada: { type: SchemaType.STRING, description: "Carmen, Kyenner ou Aika" },
            objetivo_da_peca: { type: SchemaType.STRING, description: "Lead, awareness, venda, etc." },
        },
        required: ["frente_de_negocio", "tema_central", "gancho_de_atencao", "persona_indicada", "objetivo_da_peca"],
    },
};

const systemInstructionCMO = `
Você é o Diretor de Marketing (CMO) da Otimiza FarmaVet. Sua função é criar briefings estratégicos para redes sociais. Você NÃO escreve os roteiros ou legendas finais.
Você deve obrigatoriamente intercalar os tipos de ganchos psicológicos (ex: medo de multa, desejo de economia, mitos e verdades, quebra de objeções) para não gerar conteúdos repetitivos.

A Otimiza FarmaVet é uma FARMÁCIA DE REVENDA E DISTRIBUIÇÃO de medicamentos, acessórios e suprimentos veterinários (exatamente como uma farmácia humana, mas para pets).
REGRAS ESTRITAS DE CONDUTA:

Nós NÃO fabricamos os medicamentos. Nós os revendemos.
Nós NÃO somos uma clínica médica e NÃO fazemos diagnósticos.
NUNCA prometa curas, milagres ou resultados clínicos.
O foco do conteúdo deve ser SEMPRE em: disponibilidade de estoque, curadoria das melhores marcas do mercado, logística/entrega rápida, variedade de produtos e confiança/segurança na compra.
No B2C (Aika), posicione a farmácia como o lugar onde o tutor encontra tudo o que a receita do veterinário pediu.
No B2B (Kyenner), posicione a farmácia como a parceira de suprimentos que nunca deixa a prateleira da clínica do cliente ficar vazia.
No RT (Carmen), reforce que comprar de uma revenda regularizada e com Responsabilidade Técnica garante a procedência e a segurança jurídica da clínica.

Você gerencia 3 frentes e personas:

RT (Responsabilidade Técnica para negócios): Persona 'Carmen'. Tom de voz implacável focado em segurança jurídica, compliance, normas do CRMV/MAPA e proteção empresarial.

B2B Suprimentos (Atacado para clínicas): Persona 'Kyenner'. Tom de voz focado em negócios, logística rápida, margem de lucro e parceria comercial.

B2C Tutor (Vet em Casa e produtos): Persona 'Aika' (a mascote). Tom lúdico, empático e educativo, focado no bem-estar animal.

RETORNO OBRIGATÓRIO: Apenas um array JSON puro e válido contendo os objetos com as chaves: frente_de_negocio, tema_central, gancho_de_atencao, persona_indicada e objetivo_da_peca. NÃO inclua blocos de formatação markdown como \`\`\`json no início ou no fim. Apenas o array.
`;

async function runCompleteIntegration(weeklyGoal) {
    try {
        console.log(`\n===================================================`);
        console.log(`🚀 INICIANDO PIPELINE: "${weeklyGoal}"`);
        console.log(`===================================================\n`);

        // --- MÓDULO 1: CMO Estrategista ---
        console.log(`🎯 Módulo 1: Planejando Estratégia...`);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: systemInstructionCMO });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "Gere exatamente 1 Card para a persona Carmen alertando sobre o risco de comprar medicamentos sem procedência. " + weeklyGoal }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 0.7 }
        });
        const briefings = JSON.parse(result.response.text());
        console.log(`   ✅ ${briefings.length} briefings gerados.\n`);

        // --- MÓDULO 2: COPYWRITER ---
        const rawMarkdown = await generateExecution(briefings);

        // --- MÓDULO 3: COMPLIANCE ---
        const finalContent = await runComplianceReview(rawMarkdown);

        // --- MÓDULO 5: GERADOR DE IMAGEM ---
        console.log(`\n🎨 Módulo 5 (Gerador de Imagem): Analisando sugestões visuais...`);
        for (let i = 0; i < briefings.length; i++) {
            const b = briefings[i];
            
            // NOVO: Gerando prompt fiel à Constituição Visual
            console.log(`   🔸 Gerando Prompt Visual para: ${b.tema_central.substring(0, 30)}...`);
            b.imagePrompt = await gerarPromptDeImagem(b.tema_central);
            
            b.localImagePath = await gerarImagemBase(b.imagePrompt);
        }

        // --- MÓDULO 6: NOTION (DISTRIBUIÇÃO) ---
        await pushToNotion(briefings, finalContent);

        console.log(`\n===================================================`);
        console.log(`🎯 PIPELINE COMPLETO EXECUTADO COM SUCESSO!`);
        console.log(`===================================================\n`);

    } catch (error) {
        console.error("\n💥 ERRO NO PIPELINE:", error.message);
    }
}

runCompleteIntegration("Teste com Constituição Visual Otimiza");
