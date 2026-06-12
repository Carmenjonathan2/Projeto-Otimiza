const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const { launchBrowser, searchGoogleMaps, dorkSocialProfiles } = require('./searcher');
const { crawlWebsite } = require('./crawler');
const { assessLead } = require('./assessor');
const { dispatchToGoogleSheets, dispatchToWhatsAppQueue, dispatchToLocalDatabase } = require('./dispatcher');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Traduz o comando em linguagem natural do usuário em parâmetros estruturados de busca.
 * @param {string} userPrompt Entrada de texto livre do usuário
 */
async function translateUserPrompt(userPrompt) {
    console.log(`🧠 Traduzindo comando de busca com Gemini...`);
    const prompt = `Você é o interpretador de linguagem natural da Lessie AI para a prospecção da Otimiza FarmaVet.
O usuário enviou a seguinte mensagem de prospecção:
"${userPrompt}"

Traduza essa mensagem em três parâmetros estruturados:
1. searchQuery: A query ideal e direta para fazer a pesquisa de locais no Google Maps (máximo 5 palavras). Exemplo: se o usuário diz "quero achar clinicas de grande porte na pampulha", retorne "clinica veterinaria pampulha belo horizonte". Garanta que o termo inclua o contexto geográfico (como cidade/bairro). Se nenhuma cidade for citada, assuma "Belo Horizonte, MG" por padrão.
2. nichoDesejado: O nicho do negócio em português (ex: "Clínica Veterinária", "Petshop", "Casa de Carnes", "Supermercado").
3. regiaoTarget: Bairro, região ou cidade alvo (ex: "Pampulha, Belo Horizonte - MG").

Retorne APENAS um objeto JSON válido (sem formatar markdown):
{
  "searchQuery": "...",
  "nichoDesejado": "...",
  "regiaoTarget": "..."
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        if (text.startsWith('```json')) {
            text = text.replace(/```json|```/g, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/```/g, '');
        }

        const parsed = JSON.parse(text.trim());
        console.log("🎯 Parâmetros Estruturados Identificados:", parsed);
        return parsed;
    } catch (e) {
        console.error("⚠️ Falha ao traduzir comando com Gemini, aplicando fallback de busca padrão.");
        return {
            searchQuery: userPrompt,
            nichoDesejado: "Petshop/Veterinária",
            regiaoTarget: "Belo Horizonte, MG"
        };
    }
}

/**
 * Executa o Pipeline Completo da Lessie.
 */
async function run() {
    console.log(`\n=============================================================`);
    console.log(`🕵️‍♂️ AGENTE LESSIE — INICIANDO VARREDURA E ANÁLISE DE LEADS`);
    console.log(`=============================================================\n`);

    // Parser de argumentos básico
    const args = process.argv;
    
    let userPrompt = "";
    const promptIdx = args.indexOf('--prompt');
    if (promptIdx !== -1 && args[promptIdx + 1]) {
        userPrompt = args[promptIdx + 1];
    }

    let limit = 5; // Limite padrão de leads por busca
    const limitIdx = args.indexOf('--limit');
    if (limitIdx !== -1 && args[limitIdx + 1]) {
        limit = parseInt(args[limitIdx + 1], 10) || 5;
    }

    if (!userPrompt || userPrompt.trim() === "") {
        console.error("❌ ERRO: Você deve fornecer uma busca usando o argumento --prompt");
        console.log(`Exemplo: node 0-Central-SNC/GIO-CENTRAL/intelligence/lessie/lessie_prospector.js --prompt "Buscar petshops na Pampulha" --limit 5`);
        process.exit(1);
    }

    // 1. Tradução da Intenção via IA
    const searchParams = await translateUserPrompt(userPrompt);

    // 2. Busca inicial no Google Maps
    const rawLeads = await searchGoogleMaps(searchParams.searchQuery, limit);
    if (rawLeads.length === 0) {
        console.log("📭 Nenhum lead encontrado no Google Maps para esta pesquisa.");
        process.exit(0);
    }

    // 3. Inicializa o Navegador Puppeteer (Compartilhado para performance)
    console.log("🚀 Lançando navegador para enriquecimento e dorking...");
    const browser = await launchBrowser();

    const finalLeads = [];

    // 4. Loop de enriquecimento e qualificação
    for (let i = 0; i < rawLeads.length; i++) {
        const lead = rawLeads[i];
        console.log(`\n-------------------------------------------------------------`);
        console.log(`🎯 [${i + 1}/${rawLeads.length}] Enriquecendo Lead: ${lead.name}`);
        console.log(`-------------------------------------------------------------`);

        // Dorking de redes sociais (LinkedIn / Instagram)
        console.log("🔍 Buscando perfis no LinkedIn e Instagram...");
        const socialProfiles = await dorkSocialProfiles(lead.name, searchParams.regiaoTarget, browser);
        lead.socialProfiles = socialProfiles;

        // Crawler do Website (se houver)
        if (lead.website && lead.website !== 'N/A') {
            console.log(`🕸️ Crawlando website: ${lead.website}`);
            const scrapedData = await crawlWebsite(lead.website, browser);
            lead.scrapedData = scrapedData;
        } else {
            console.log("ℹ️ Lead sem website cadastrado no Maps.");
            lead.scrapedData = { emails: [], phones: [], rtMentions: [], socialLinks: [], scrapedSnippet: '' };
        }

        // 5. Raciocínio de ICP e Persona via Gemini
        console.log("🧠 Qualificando lead e escrevendo copy de abordagem com IA...");
        const assessedLead = await assessLead(lead);
        
        // Armazena e exibe a qualificação
        console.log(`💎 Qualificado para: [${assessedLead.persona}] | Score: ${assessedLead.score}/5`);
        console.log(`📌 Gancho Gerado: "${assessedLead.contextoIA}"`);

        // 6. Roteamento e Despacho de Leads
        let dispatchedEmail = false;
        let dispatchedZap = false;

        // Se encontrou e-mail e foi qualificado, injeta no Sheets de Cold-Email
        if (assessedLead.emailDestino) {
            dispatchedEmail = await dispatchToGoogleSheets(assessedLead);
        }

        // Se tem telefone comercial, injeta na fila de WhatsApp local
        const telefoneAlvo = lead.phone || (assessedLead.telefone || "");
        if (telefoneAlvo) {
            dispatchedZap = await dispatchToWhatsAppQueue(assessedLead, telefoneAlvo);
        }

        // Salva na base de dados de leads local (Tabela de Match + Scripts para Ligação Fria)
        await dispatchToLocalDatabase(assessedLead, lead);

        finalLeads.push({
            empresa: assessedLead.empresa,
            nicho: assessedLead.nicho,
            persona: assessedLead.persona,
            score: assessedLead.score,
            email: assessedLead.emailDestino || "Não encontrado",
            telefone: telefoneAlvo || "Não encontrado",
            enviadoEmail: dispatchedEmail ? "Sim (Sheets)" : "Não",
            enviadoZap: dispatchedZap ? "Sim (Fila)" : "Não"
        });

        // Delay preventivo contra captchas/rate limit entre os leads
        await new Promise(r => setTimeout(r, 2000));
    }

    // 7. Encerramento e fechamento do browser
    await browser.close();
    console.log("\n🔒 Navegador fechado.");

    // 8. Relatório final formatado
    console.log(`\n=============================================================`);
    console.log(`🏁 RESUMO DA PROSPECÇÃO (AGENTE LESSIE)`);
    console.log(`=============================================================`);
    console.table(finalLeads);
    console.log(`\n👉 E-mails enviados para a planilha oficial para processamento diário.`);
    console.log(`👉 WhatsApps adicionados na fila "lessie_whatsapp_queue.json".`);
    console.log(`=============================================================\n`);
}

run().catch(err => {
    console.error("❌ Ocorreu um erro fatal no pipeline da Lessie:", err);
    process.exit(1);
});
