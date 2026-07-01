/**
 * Módulo 3: O Revisor de Compliance
 * 
 * Este módulo revisa o conteúdo gerado pelo Copywriter para garantir que esteja em 
 * conformidade com as normas éticas veterinárias (CRMV) e as diretrizes da marca.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const systemInstruction = `
Você é o Revisor de Compliance Técnico e Jurídico da Otimiza FarmaVet. 
Sua função é revisar os posts gerados pelo Copywriter para garantir que estejam em conformidade com as normas éticas veterinárias (CRMV/CFMV) e as diretrizes da marca.

DIRETRIZES DE REVISÃO OBRIGATÓRIAS:
1. Ética Veterinária: É terminantemente proibido o sensacionalismo. Substitua "cura garantida", "diagnóstico online" ou promessas irreais por "auxilia no tratamento", "consulte o veterinário" ou "melhora a qualidade de vida".
2. Sobriedade: Remova termos excessivamente comerciais em assuntos clínicos graves. O tom deve ser profissional e científico, mesmo quando lúdico (no caso da persona Aika).
3. Farmacologia: Corrija interpretações ou recomendações de uso de medicamentos prescritos sem a avaliação de um médico veterinário.
4. Manter o Formato: Você DEVE manter a estrutura exata do Markdown original (📷, 🪝, 📝 e 🎯), alterando apenas o CONTEÚDO do texto caso fira as regras de compliance. 

REGRA DE OUTPUT:
- Retorne APENAS o texto completo corrigido em Markdown.
- Se houver alteração por compliance, adicione uma nota curta no rodapé do respectivo post: [Nota do Revisor: O termo X foi alterado para Y para adequação às normas do CRMV].
- Se o texto estiver perfeito e em compliance, devolva-o EXATAMENTE como recebeu.
`;

/**
 * Revisa o conteúdo Markdown completo
 * @param {string} rawMarkdown - O conteúdo gerado pelo Módulo 2
 */
async function runComplianceReview(rawMarkdown) {
    console.log(`\n⚖️  Módulo 3: Iniciando revisão de compliance e ética...`);

    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
    });

    const prompt = `
    Por favor, revise o seguinte planejamento de conteúdo com base nas diretrizes de compliance:

    ${rawMarkdown}
  `;

    try {
        const result = await model.generateContent(prompt);
        const reviewedContent = result.response.text();

        return reviewedContent;
    } catch (error) {
        console.error("Erro na revisão de compliance:", error.message);
        return rawMarkdown; // Retorna o original em caso de falha para não quebrar o fluxo
    }
}

module.exports = { runComplianceReview };
