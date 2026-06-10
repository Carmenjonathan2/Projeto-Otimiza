const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// CONFIGURAÇÕES
const INPUT_FILE = path.join(__dirname, '..', '..', '..', 'novos_leads_prospeccao.csv');
const OUTPUT_FILE = path.join(__dirname, '..', '..', '..', 'pipeline_prospeccao.json');
const GEN_AI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function qualificarLeads(leads) {
    const model = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Você é o Especialista em Qualificação da Otimiza FarmaVet. 
    Analise os leads abaixo e categorize-os para nosso pipeline de vendas.
    
    REGRAS DE CATEGORIZAÇÃO:
    - AIKA (Vet em Casa): Pet Shops, Banho e Tosa, Lojas de Rações. Foco em parcerias B2B para vacinação. Humor e Empatia.
    - KYENNER (RT): Clínicas Veterinárias, Hospitais, Açougues, Casas de Carnes, Indústrias. Foco em Responsabilidade Técnica e Ciência.
    
    PARA CADA LEAD, RETORNE UM JSON NO FORMATO:
    {
      "nome": "Nome do Lead",
      "telefone": "Telefone Formatado",
      "nicho": "Nicho Identificado",
      "score": 1-5 (5 é alta prioridade),
      "atribuido_a": "Aika" | "Kyenner",
      "motivo": "Curta explicação estratégica baseada na persona"
    }
    
    LEADS PARA ANALISAR:
    ${JSON.stringify(leads)}
    
    Retorne apenas o array de objetos JSON.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        
        // Limpeza de Markdown se necessário
        if (text.startsWith('```json')) {
            text = text.replace(/```json|```/g, '');
        }
        
        return JSON.parse(text);
    } catch (e) {
        console.error("❌ Erro na qualificação IA:", e.message);
        return [];
    }
}

async function run() {
    console.log(`[INICIO] qualificador_ia.js ${new Date().toISOString()}`);
    
    const leadsRaw = [];
    if (!fs.existsSync(INPUT_FILE)) {
        console.error("❌ Arquivo de entrada não encontrado.");
        process.exit(1);
    }

    fs.createReadStream(INPUT_FILE)
        .pipe(csv())
        .on('data', (data) => leadsRaw.push(data))
        .on('end', async () => {
            console.log(`🔎 Processando ${leadsRaw.length} leads para qualificação...`);
            
            // Processar em lotes de 10 para evitar limites de token
            const qualificados = [];
            for (let i = 0; i < leadsRaw.length; i += 10) {
                const lote = leadsRaw.slice(i, i + 10);
                const resultadoLote = await qualificarLeads(lote);
                qualificados.push(...resultadoLote);
            }

            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(qualificados, null, 2));
            console.log(`[OK] qualificador_ia.js ${new Date().toISOString()} — ${qualificados.length} leads qualificados e salvos em pipeline_prospeccao.json (Aika vs Kyenner)`);
        });
}

run();
