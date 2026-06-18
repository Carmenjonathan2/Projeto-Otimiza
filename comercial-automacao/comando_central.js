const { spawn } = require('child_process');
const path = require('path');
const snc = require('./src/snc/snc_core');
const fs = require('fs');

async function executarScript(nome, caminho, pasta = '.') {
    return new Promise((resolve) => {
        console.log(`\n-----------------------------------------`);
        console.log(`🚀 INICIANDO: ${nome}`);
        console.log(`-----------------------------------------\n`);

        const processo = spawn('node', [caminho, '--once'], {
            stdio: 'inherit',
            shell: true,
            cwd: path.resolve(pasta)
        });

        processo.on('close', (code) => {
            console.log(`\n✅ ${nome} finalizado (Código: ${code})`);
            resolve();
        });
    });
}

async function comandoCentral() {
    console.log("=========================================");
    console.log("   CENTRAL DE COMANDO OTIMIZA FARMAVET   ");
    console.log("=========================================\n");

    // Lendo dados para simular o SNC (no futuro, integraria com DB/JSON atualizado)
    let contatados = [];
    if (fs.existsSync('b2b_contatados.json')) {
        contatados = JSON.parse(fs.readFileSync('b2b_contatados.json'));
    }

    // 1. AVALIAÇÃO DO SNC (Sistema Nervoso Central)
    console.log("🧠 Verificando Saúde Emocional do Ecossistema...");
    const statusSnc = snc.avaliarSaudeEmocional([], contatados);
    
    if (!statusSnc.saudavel) {
        snc.log("⚠️ GATILHO SNC: Abandono emocional detectado. Suspendendo campanhas FRIAS.");
    } else {
        console.log(`✅ Saúde emocional estável. Taxa de Adesão: ${statusSnc.taxaAdesao}%.`);
    }

    console.log("\n--- ROTINAS DE RETENÇÃO / LTV (SEMPRE RODAM) ---");
    // LTV sempre roda pois é relacionamento com quem já é cliente
    await executarScript("Aniversariantes do Dia (Aika)", "src/personas/aika/aika_ltv.js");
    await executarScript("Vitrine Especial da Semana (Aika)", "src/personas/aika/aika_vitrine.js");
    await executarScript("Postagem Automática no Status (Aika)", "src/personas/aika/aika_status.js");

    console.log("\n--- ROTINAS DE PROSPECÇÃO ---");
    if (statusSnc.saudavel) {
        await executarScript("Cold E-mail Automation", "index.js", "cold-email-automation");
        await executarScript("Aika B2B - Condomínios", "b2b_whatsapp.js", "GIO-CENTRAL/executors/direct_sales");
        // Futuro: await executarScript("Kyenner RT", "src/personas/kyenner/kyenner_prospeccao.js");
    } else {
        console.log("⏸️ Prospecção pulada. A equipe deve revisar os copies e tom de voz (Reflexo de Transbordamento).");
    }

    console.log("\n=========================================");
    console.log("     TODAS AS TAREFAS CONCLUÍDAS! ✅     ");
    console.log("=========================================\n");
}

comandoCentral();
