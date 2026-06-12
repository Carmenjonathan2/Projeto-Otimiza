const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Usando o modelo configurado no projeto (gemini-2.5-flash)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Analisa os dados consolidados do lead usando a inteligência do Gemini.
 * @param {any} leadData Dossiê completo do lead (dados do Maps + crawlers + dorks)
 */
async function assessLead(leadData) {
    const prompt = `Você é o Diretor Estratégico de Qualificação da Otimiza FarmaVet.
Analise os dados consolidados do lead abaixo e classifique-o para nosso pipeline de prospecção ativa.

DADOS DO LEAD COLETADOS:
- Nome Fantasia: "${leadData.name}"
- Telefone: "${leadData.phone}"
- Website: "${leadData.website}"
- Endereço/Região: "${leadData.address}"
- Nota Google Maps: ${leadData.rating} (${leadData.reviewsCount} avaliações)
- Review em Destaque no Google: "${leadData.reviewText}" (Escrita por: ${leadData.reviewerName})
- Menções de RT/CRMV no site: ${JSON.stringify(leadData.scrapedData?.rtMentions || [])}
- Resumo do site (Homepage): "${leadData.scrapedData?.scrapedSnippet || ''}"
- E-mails encontrados: ${JSON.stringify(leadData.scrapedData?.emails || [])}
- Telefones encontrados: ${JSON.stringify(leadData.scrapedData?.phones || [])}
- Redes Sociais do Site: ${JSON.stringify(leadData.scrapedData?.socialLinks || [])}
- Resultados de Dorking (LinkedIn): ${JSON.stringify(leadData.socialProfiles?.linkedin || [])}
- Resultados de Dorking (Instagram): ${JSON.stringify(leadData.socialProfiles?.instagram || [])}

---

REGRAS DE ATRIBUIÇÃO DE PERSONA:
1. **AIKA (Campanha Vet em Casa / Parcerias):** 
   - Público-alvo: Pet Shops, Centros de Estética Pet, Banho e Tosa, Lojas de Ração, Hotéis Pet, Adestradores.
   - Foco: Fechar parcerias B2B2C onde a Aika realiza vacinação/consultas em domicílio ou no local com preço social para os clientes deles.
   - Tom: Empático, amigável e focado em benefícios mútuos de vendas.
   
2. **KYENNER (Responsabilidade Técnica - RT / Conformidade):**
   - Público-alvo: Clínicas Veterinárias, Consultórios, Hospitais Veterinários, Açougues, Casas de Carnes, Supermercados, Distribuidores de Produtos de Origem Animal, Fábricas de Pet Food.
   - Foco: Oferecer suporte e blindagem jurídica/sanitária de Responsabilidade Técnica (RT) homologado perante o CRMV e órgãos sanitários.
   - Tom: Científico, profissional, focado em segurança legal, conformidade e proteção contra multas.

---

DIRETRIZES DE SAÍDA:
- **nomeContato**: Identifique o nome do dono, proprietário, sócio ou veterinário chefe nos dados (especialmente no LinkedIn Dorking ou Sobre). Se não achar nenhum nome de pessoa específico, use "Responsável Técnico" para Kyenner ou "Gerente de Parcerias" para Aika.
- **persona**: Defina estritamente como "Aika" ou "Kyenner".
- **score**: Dê uma nota de 1 a 5 (5 é a prioridade máxima: ex. uma clínica com avaliações ruins ou um pet shop de alto padrão na região alvo).
- **contextoIA (O GANCHO COMERCIAL):** Escreva um parágrafo curto de 1 a 3 frases contendo o gancho comercial hiper-personalizado. 
  - Regra crítica para o gancho: Mencione algo real extraído dos dados, como um review de cliente no Google Maps (ex: "Vi que os clientes elogiam muito o cuidado do banho e tosa..."), um detalhe do site ou post.
  - Esse texto será injetado na planilha de e-mail e usado pelo gerador de icebreakers do Gmail. Não use espaços reservados como "{nome}".
- **emailDestino**: Escolha o e-mail mais promissor encontrado. Se não houver, deixe vazio ("").
- **temRT**: Indique "Sim", "Não" ou "Dúvida" se há indicações claras se o estabelecimento possui ou não um responsável técnico de RT ativo.
- **grauIntencao**: Indique "Alto", "Médio" ou "Baixo" com base nas avaliações recentes do Google Maps, tamanho e atividade na web.
- **dorIdentificada**: Qual é a principal dor comercial do lead (ex: Sem RT explícito no site; críticas a serviço veterinário específico no Google Maps; pet shop precisando expandir portfólio de vacinação B2B2C).
- **scriptLigacao**: Um roteiro curtíssimo de ligação telefônica (máximo 3 frases) em linguagem natural para ser usado pela persona (Aika ou Kyenner) ao ligar para o lead. Deve soar extremamente espontâneo e focar no gancho. Ex: "Oi, tudo bem? Vi a avaliação da [Pessoa] elogiando o atendimento de vocês no Google... liguei porque..."

---

RETORNE APENAS UM OBJETO JSON VÁLIDO (SEM FORMATAÇÃO OU CÓDIGO MARKDOWN ADICIONAL) NO SEGUINTE FORMATO:
{
  "nomeContato": "Nome da Pessoa ou Cargo Fallback",
  "empresa": "Nome Fantasia do Lead",
  "persona": "Aika" | "Kyenner",
  "nicho": "Tipo de negócio",
  "score": 1-5,
  "motivo": "Justificativa estratégica curta de 1 frase",
  "contextoIA": "Texto do gancho comercial",
  "emailDestino": "email@exemplo.com",
  "temRT": "Sim" | "Não" | "Dúvida",
  "grauIntencao": "Alto" | "Médio" | "Baixo",
  "dorIdentificada": "Descrição da dor/oportunidade comercial",
  "scriptLigacao": "Texto curto do script para ligação fria"
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Limpeza de blocos markdown do JSON
        if (text.startsWith('```json')) {
            text = text.replace(/```json|```/g, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/```/g, '');
        }
        
        const parsedResult = JSON.parse(text.trim());
        
        // Garante fallbacks básicos de dados caso a IA falhe
        return {
            nomeContato: parsedResult.nomeContato || "Proprietário",
            empresa: parsedResult.empresa || leadData.name,
            persona: parsedResult.persona === "Aika" ? "Aika" : "Kyenner",
            nicho: parsedResult.nicho || "Petshop/Veterinária",
            score: Number(parsedResult.score) || 3,
            motivo: parsedResult.motivo || "Lead qualificado automaticamente.",
            contextoIA: parsedResult.contextoIA || `Acompanhamos o ótimo trabalho da ${leadData.name} no Maps e redes sociais.`,
            emailDestino: parsedResult.emailDestino || (leadData.scrapedData?.emails?.[0] || ""),
            temRT: parsedResult.temRT || "Dúvida",
            grauIntencao: parsedResult.grauIntencao || "Médio",
            dorIdentificada: parsedResult.dorIdentificada || "Prospecção ativa padrão.",
            scriptLigacao: parsedResult.scriptLigacao || `Olá, gostaria de falar com o responsável pela ${leadData.name}. Vi o ótimo trabalho de vocês...`
        };

    } catch (e) {
        console.error("❌ Erro ao analisar lead com Gemini:", e.message);
        const isClinic = /clinica|hospital|vet|veterinari/gi.test(leadData.name);
        return {
            nomeContato: isClinic ? "Responsável Técnico" : "Gerente de Parcerias",
            empresa: leadData.name,
            persona: isClinic ? "Kyenner" : "Aika",
            nicho: isClinic ? "Clínica Veterinária" : "Petshop",
            score: 3,
            motivo: "Erro na qualificação IA, utilizando classificação de fallback.",
            contextoIA: `Identificamos a empresa ${leadData.name} como de destaque no setor na região de ${leadData.address.split(',')[0]}.`,
            emailDestino: leadData.scrapedData?.emails?.[0] || "",
            temRT: "Dúvida",
            grauIntencao: "Médio",
            dorIdentificada: "Erro ao processar análise via IA.",
            scriptLigacao: `Olá, gostaria de falar com o responsável pela ${leadData.name}.`
        };
    }
}

module.exports = {
    assessLead
};
