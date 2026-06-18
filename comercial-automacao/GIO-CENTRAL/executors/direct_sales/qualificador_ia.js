const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// CONFIGURAÇÕES
const INPUT_FILE = path.join(__dirname, '..', '..', '..', 'novos_leads_prospeccao.csv');
const OUTPUT_FILE = path.join(__dirname, '..', '..', '..', 'pipeline_prospeccao.json');
const GEN_AI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hook de monitoramento de custo (opcional)
let custoMonitor = null;
try {
    custoMonitor = require('../../../src/observabilidade/custo_monitor');
} catch (e) { /* monitor opcional */ }

async function qualificarLeads(leads) {
    const model = GEN_AI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });

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

        // Registrar custo (se monitor disponível)
        if (custoMonitor && response.usageMetadata) {
            const u = response.usageMetadata;
            custoMonitor.registrarChamada({
                promptTokens: u.promptTokenCount || 0,
                candidateTokens: u.candidatesTokenCount || 0,
                cachedTokens: u.cachedContentTokenCount || 0,
                model: 'gemini-2.5-flash-lite',
                persona: 'Qualificador-Lessie'
            });
        }

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

// Self-test: rodar `node qualificador_ia.js --self-test`
if (require.main === module && process.argv.includes('--self-test')) {
    (async () => {
        try {
            console.log('[SELF-TEST] qualificador_ia.js — qualificando lead fixo...');
            const leadsTeste = [{ Nome: 'Pet Shop Exemplo', Telefone: '31999999999', Endereco: 'BH/MG', Categoria: 'Pet Shop' }];
            const result = await qualificarLeads(leadsTeste);
            console.log(`[SELF-TEST OK] Resultado:`, JSON.stringify(result));
            process.exit(0);
        } catch (e) {
            console.error(`[SELF-TEST FAIL] ${e.message}`);
            process.exit(1);
        }
    })();
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

// Só roda o batch automático se NÃO for self-test
if (!process.argv.includes('--self-test')) {
    run();
}
