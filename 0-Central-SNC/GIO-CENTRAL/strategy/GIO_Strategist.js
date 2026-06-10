/**
 * Módulo: GIO Strategist (O Cérebro)
 * Localizado em: /GIO-CENTRAL/strategy/GIO_Strategist.js
 * Objetivo: Decidir a estratégia de conteúdo baseada em inteligência comercial.
 */

const fs = require('fs');
const path = require('path');
const { getContentIntelligence } = require('../../otimiza-content-generator/GIO_Bridge');

async function runStrategySession() {
    console.log("=========================================");
    console.log("🧠 GIO STRATEGIST: Sessão de Inteligência");
    console.log("=========================================\n");

    // 1. Coleta inteligência do Bridge (Vendas/Estoque)
    const intel = getContentIntelligence();
    
    let baseGoal = "Promoção de Suprimentos B2B e dicas de saúde Aika";
    
    if (intel) {
        console.log(`📊 GIO sugere foco em: ${intel.sugestao_tema}`);
        baseGoal = `Inclua o tema: ${intel.sugestao_tema}. Contexto: ${intel.contexto}. Além de: ${baseGoal}`;
    }

    // 2. Salva a estratégia do dia
    const strategyPath = path.join(__dirname, '..', 'data', 'current_strategy.json');
    const strategy = {
        date: new Date().toISOString(),
        goal: baseGoal,
        priority: "HIGH"
    };

    fs.writeFileSync(strategyPath, JSON.stringify(strategy, null, 2));
    console.log(`✅ Estratégia consolidada e salva em: /data/current_strategy.json`);
    
    return baseGoal;
}

if (require.main === module) {
    runStrategySession();
}

module.exports = { runStrategySession };
