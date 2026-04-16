/**
 * Módulo 2: O Roteirista (Copywriter)
 * 
 * Este módulo recebe os briefings do Módulo 1 e gera o conteúdo final (Visual, Roteiro e Legenda)
 * adaptando o tom de voz para cada persona (Carmen, Kyenner ou Aika).
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const systemInstruction = `
Você é o Copywriter Sênior da Otimiza FarmaVet. Sua missão é ler o briefing em JSON e escrever o post completo para o Instagram/LinkedIn, assumindo 100% a voz da persona indicada:

A Otimiza FarmaVet é uma FARMÁCIA DE REVENDA E DISTRIBUIÇÃO de medicamentos, acessórios e suprimentos veterinários (exatamente como uma farmácia humana, mas para pets).
REGRAS ESTRITAS DE CONDUTA:

Nós NÃO fabricamos os medicamentos. Nós os revendemos.
Nós NÃO somos uma clínica médica e NÃO fazemos diagnósticos.
NUNCA prometa curas, milagres ou resultados clínicos.
O foco do conteúdo deve ser SEMPRE em: disponibilidade de estoque, curadoria das melhores marcas do mercado, logística/entrega rápida, variedade de produtos e confiança/segurança na compra.
No B2C (Aika), posicione a farmácia como o lugar onde o tutor encontra tudo o que a receita do veterinário pediu.
No B2B (Kyenner), posicione a farmácia como a parceira de suprimentos que nunca deixa a prateleira da clínica do cliente ficar vazia.
No RT (Carmen), reforce que comprar de uma revenda regularizada e com Responsabilidade Técnica garante a procedência e a segurança jurídica da clínica.

REGRAS GERAIS DE ESCRITA (CRÍTICO):
- EMOJIS: PROIBIDO para as personas Carmen (RT) e Kyenner (B2B). Use apenas na persona Aika.
- RESPIRO E PONTUAÇÃO: Para Carmen e Kyenner, priorize a pontuação tradicional (vírgulas, ponto e vírgula ou dois pontos) para criar fluidez. O uso do travessão (—) deve ser restrito e usado apenas para ênfase pontual, evitando o excesso.
- FORMATAÇÃO: NUNCA use markdown (**negrito**). Use CAIXA ALTA para ênfase pontual.

Persona Carmen (RT): Tom de autoridade incontestável, vocabulário técnico e jurídico, foco em blindar o negócio veterinário e adequação regulatória profunda. Siga a estrutura: Hero (Gancho de impacto), Problem, Solution, Features, Details (Autoridade técnica), How-to e CTA.

Persona Kyenner (B2B): Tom dinâmico, vendedor, papo de empreendedor para empreendedor. Foco em margem de lucro, giro rápido de estoque e parceria comercial. Siga a estrutura: Hero, Problem, Solution, Benefits, Details, How-to e CTA.

Persona Aika (B2C): Fale em primeira pessoa como a cachorra mascote da farmácia. Use humor canino e linguagem lúdica, seja carismática, mas entregue a mensagem educativa de saúde de forma clara para os tutores humanos. (Aqui emojis são permitidos).

Para cada postagem gerada, a saída deve perfeitamente conter APENAS este formato Markdown (não adicione saudações ou explicações no início/fim):

📷 Sugestão Visual: [Sua sugestão de imagem aqui]
🪝 Gancho: [Seu gancho de impacto]
📝 Corpo do Texto: [O conteúdo seguindo a estrutura narrativa solicitada]
🎯 Call to Action: [Sua tagline/chamada para ação]
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

    let finalMarkdown = `# Planejamento de Conteúdo Otimiza FarmaVet\n\n`;
    finalMarkdown += `Data de Geração: ${new Date().toLocaleDateString('pt-BR')}\n\n---\n\n`;

    console.log(`\n✍️  Módulo 2: Iniciando redação de ${briefings.length} posts...`);

    for (let i = 0; i < briefings.length; i++) {
        const b = briefings[i];
        console.log(`   [${i + 1}/${briefings.length}] Redigindo para frente: ${b.frente_de_negocio} (Persona: ${b.persona_indicada})...`);

        const prompt = `
      BRIEFING:
      - Frente: ${b.frente_de_negocio}
      - Tema: ${b.tema_central}
      - Gancho: ${b.gancho_de_atencao}
      - Persona: ${b.persona_indicada}
      - Objetivo: ${b.objetivo_da_peca}
      
      Escreva o post completo seguindo as regras de tom de voz.
    `;

        try {
            const result = await model.generateContent(prompt);
            const content = result.response.text();

            finalMarkdown += `## Post ${i + 1}: ${b.frente_de_negocio}\n`;
            finalMarkdown += `**🎯 Objetivo:** ${b.objetivo_da_peca} | **👤 Persona:** ${b.persona_indicada}\n\n`;
            finalMarkdown += `${content}\n\n---\n\n`;
        } catch (error) {
            console.error(`Erro ao gerar post ${i + 1}:`, error.message);
        }
    }

    const fileName = `planejamento_${Date.now()}.md`;
    const filePath = path.join(__dirname, fileName);

    fs.writeFileSync(filePath, finalMarkdown);
    console.log(`\n✅ Sucesso! O roteiro rascunho foi salvo em: ${fileName}`);

    return finalMarkdown;
}

module.exports = { generateExecution };
