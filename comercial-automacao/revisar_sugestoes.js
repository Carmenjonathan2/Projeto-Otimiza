const readline = require('readline');
const fs = require('fs');
const path = require('path');
const ciclo = require('./src/aprendizado/ciclo_aprendizado');

const ARQUIVO = path.resolve(__dirname, './sugestoes_bot.jsonl');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function revisar() {
    if (!fs.existsSync(ARQUIVO)) {
        console.log(`❌ Arquivo de sugestões não encontrado em: ${ARQUIVO}`);
        rl.close();
        return;
    }

    const linhas = fs.readFileSync(ARQUIVO, 'utf8').split('\n').filter(Boolean);
    let registros;
    try {
        registros = linhas.map(l => JSON.parse(l));
    } catch (parseErr) {
        console.error("❌ Erro ao parsear arquivo sugestoes_bot.jsonl:", parseErr.message);
        rl.close();
        return;
    }

    const pendentes = registros.filter(r => r.aprovado_humano === null);

    if (pendentes.length === 0) {
        console.log("🎉 Nenhuma sugestão pendente de revisão!");
        rl.close();
        return;
    }

    console.log(`\n📋 ${pendentes.length} sugestões pendentes de revisão.\n`);

    for (const r of registros) {
        if (r.aprovado_humano !== null) continue;

        console.log('─'.repeat(60));
        console.log(`🆔 ID: ${r.id} | Persona: ${r.persona} | Data: ${r.timestamp}`);
        console.log(`💬 Cliente: ${r.mensagemCliente}`);
        console.log(`🤖 Bot sugeriu:\n"${r.respostaSugerida}"`);
        if (r.estrategiaAtivada) console.log(`🎯 Estratégia: ${r.estrategiaAtivada}`);

        const resposta = await new Promise(res => rl.question('\n✅ Aprovar sugestão? (s/n/pular): ', res));

        if (resposta.toLowerCase() === 's') {
            r.aprovado_humano = true;
            console.log("💚 Aprovada com sucesso!");
        } else if (resposta.toLowerCase() === 'n') {
            r.aprovado_humano = false;
            const motivo = await new Promise(res => rl.question('Motivo da reprovação: ', res));
            r.motivo_reprovacao = motivo;
            console.log("🔴 Reprovada com sucesso.");
        } else {
            console.log("🟡 Pulada.");
        }
    }

    const atualizado = registros.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(ARQUIVO, atualizado, 'utf8');
    
    console.log('\n💾 Revisão salva com sucesso!');
    console.log('🔄 Sincronizando exemplos aprovados com o Few-Shot...');
    
    try {
        const novos = ciclo.sincronizarAprovados();
        console.log(`✅ Sincronização concluída! ${novos} novos exemplos gerados.`);
    } catch (e) {
        console.error("❌ Falha na sincronização de aprendizado:", e.message);
    }
    
    rl.close();
}

revisar();
