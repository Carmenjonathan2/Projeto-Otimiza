const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Usando o nome exato do modelo e garantindo a versão estável
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateIcebreaker(context, nomeLead, empresaLead, placeData = null) {
    if (!context || context.trim() === "") {
        return `Vi o excelente trabalho que a ${empresaLead || 'empresa de vocês'} realiza no setor.`;
    }
    
    let googleInstruction = `📍 Plano C (Sem Dados Maps): Apenas elogie algo da empresa (${empresaLead}) ou mencione uma dor comum do setor (como fiscalização ou qualidade sanitária) de forma natural.`;
    
    if (placeData && placeData.review) {
        googleInstruction = `📍 Plano A (Super Personalizado): Eu procurei a empresa no Google Maps e encontrei esta recente avaliação de cliente: "${placeData.review}". Crie a frase inicial ELOGIANDO EXPLICITAMENTE o que o cliente disse sobre a constância e o estabelecimento (seja natural, como se nós tivéssemos notado isso organicamente pesquisando a empresa).`;
    } else if (placeData && placeData.rating) {
        googleInstruction = `📍 Plano B (Nota Alta Maps): Eu procurei a empresa e vi que ela possui nota geral de ${placeData.rating} estrelas no Google Maps. Inicie a frase elogiando o fato da empresa manter uma nota de excelência aos olhos do público na internet, algo que gera confiança!`;
    }

    // Prompt mais direcionado para o nicho de RT Veterinário/Consuloria
    const prompt = `Você é um consultor veterinário especialista em Responsabilidade Técnica (RT). 
    Você está escrevendo um email para o(a) responsável ${nomeLead}, da empresa ${empresaLead}.
    Com base no contexto do lead: [${context}], escreva UMA ÚNICA frase curta, amigável e hiper-personalizada para iniciar o email. 
    
    AÇÃO ESPERADA:
    ${googleInstruction}
    
    REGRA CRÍTICA: NUNCA use espaços reservados ou variáveis vazias no texto, como "{nome do açougue}" ou "[Nome da Empresa]". Use texto natural com os nomes reais fornecidos. Cuidado para não confundir o nome do dono (${nomeLead}) com o nome do estabelecimento (${empresaLead}).
    IMPORTANTE: NÃO INICIE a frase com saudações como "Olá", "Oi", "Bom dia", "Tudo bem", "Prezado", etc. O sistema já adiciona a saudação automaticamente antes do seu texto. Comece diretamente com a frase do contexto/elogio!
    Escreva em Português do Brasil. Seja direto e sem "juridiquês" ou clichês de IA.`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        // Remove aspas se a IA colocar
        text = text.replace(/^"|"$/g, '');
        return text;
    } catch (error) {
        console.error("Erro ao gerar icebreaker com Gemini:", error.message);
        return "Acompanho o crescimento da sua empresa e admiro o profissionalismo de vocês.";
    }
}

module.exports = { generateIcebreaker };
