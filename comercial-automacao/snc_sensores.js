const fs = require('fs');
const path = require('path');

// ============================================
// SNC SENSORES - Medidor de Adesão e Abandono Emocional
// ============================================

const ARQUIVO_B2B = 'b2b_contatados.json';
const ARQUIVO_HISTORICO = 'historico_comercial.json';
const LIMIAR_ADESAO_MINIMO = 15; // Se for menor que 15%, aciona alerta de reescrita
const LOG_SNC = 'snc_alertas.log';

function limparTelefone(telStr) {
    if (!telStr) return '';
    return telStr.replace(/\D/g, ''); // Apenas números
}

function processarSensores() {
    console.log('[INICIO] snc_sensores.js', new Date().toISOString());

    let b2bContatados = [];
    if (fs.existsSync(ARQUIVO_B2B)) {
        b2bContatados = JSON.parse(fs.readFileSync(ARQUIVO_B2B, 'utf8'));
    } else {
        console.log('[AVISO] Arquivo b2b_contatados.json não encontrado.');
    }

    let historico = [];
    if (fs.existsSync(ARQUIVO_HISTORICO)) {
        historico = JSON.parse(fs.readFileSync(ARQUIVO_HISTORICO, 'utf8'));
    } else {
        console.log('[AVISO] Arquivo historico_comercial.json não encontrado. Base de respostas vazia.');
    }

    // 1. Agrupar interações por telefone
    const interacoesPorTelefone = {};
    historico.forEach(ev => {
        const tel = limparTelefone(ev.telefone);
        if (!interacoesPorTelefone[tel]) {
            interacoesPorTelefone[tel] = [];
        }
        interacoesPorTelefone[tel].push(ev);
    });

    // 2. Calcular Taxa de Adesão (Quantos prospectados responderam?)
    let totalProspectados = b2bContatados.length;
    let totalResponderam = 0;
    let totalAbandonos = 0;

    b2bContatados.forEach(lead => {
        const telBusca = limparTelefone(lead.telLimpo || lead.telOriginal);
        // O cliente para qual mandamos mensagem (prefixo 55 + DDD + numero)
        // No historico, o numero pode estar com ou sem o 9 extra. Fazemos match parcial.
        
        let respondeu = false;
        let ultimaInteracaoFoiDoComercial = false;

        // Procura se esse lead existe nas interacoes
        const numeroMatch = Object.keys(interacoesPorTelefone).find(t => t.includes(telBusca.substring(4)) || telBusca.includes(t.substring(4)));
        
        if (numeroMatch) {
            const mensagens = interacoesPorTelefone[numeroMatch];
            // Verifica se o lead enviou alguma mensagem (comercial_respondeu == false)
            const respostasLead = mensagens.filter(m => !m.comercial_respondeu);
            if (respostasLead.length > 0) {
                respondeu = true;
                totalResponderam++;
                
                // Verifica Abandono (a última mensagem do chat foi do Comercial e já faz mais de 24h?)
                const ultimaMensagem = mensagens[mensagens.length - 1];
                if (ultimaMensagem.comercial_respondeu) {
                    const dataUltima = new Date(ultimaMensagem.timestamp);
                    const diffHoras = (new Date() - dataUltima) / (1000 * 60 * 60);
                    if (diffHoras > 24) {
                        totalAbandonos++;
                    }
                }
            }
        }
    });

    const taxaAdesao = totalProspectados > 0 ? ((totalResponderam / totalProspectados) * 100).toFixed(2) : 0;
    const taxaAbandono = totalResponderam > 0 ? ((totalAbandonos / totalResponderam) * 100).toFixed(2) : 0;

    console.log(`\n📊 [SNC SENSORES] RELATÓRIO DE SAÚDE EMOCIONAL`);
    console.log(`- Total Prospectados: ${totalProspectados}`);
    console.log(`- Total Responderam: ${totalResponderam}`);
    console.log(`- Taxa de Adesão (Resposta): ${taxaAdesao}%`);
    console.log(`- Leads em Abandono Emocional: ${totalAbandonos}`);
    console.log(`- Taxa de Abandono (Após Engajamento): ${taxaAbandono}%`);

    let acao = "Métricas Saudáveis. Nenhuma reescrita necessária.";
    let alertaCritico = false;

    if (totalProspectados > 10 && taxaAdesao < LIMIAR_ADESAO_MINIMO) {
        acao = `ALERTA CRÍTICO: Adesão abaixo de ${LIMIAR_ADESAO_MINIMO}%. Gatilho SNC acionado para o Gemini reescrever a abordagem.`;
        alertaCritico = true;
        fs.appendFileSync(LOG_SNC, `[${new Date().toISOString()}] ${acao}\n`);
    }

    if (totalAbandonos > Math.max(5, totalResponderam * 0.5)) {
         fs.appendFileSync(LOG_SNC, `[${new Date().toISOString()}] ALERTA: Alta Taxa de Abandono Emocional (${taxaAbandono}%).\n`);
    }

    console.log(`\n🧠 DIAGNÓSTICO DO SNC: ${acao}`);
    console.log('[OK] snc_sensores.js', new Date().toISOString(), `Adesao:${taxaAdesao}%, Abandono:${taxaAbandono}%`);
    
    // Se precisar reescrever, aqui poderíamos integrar com a API do Gemini.
    if (alertaCritico) {
        console.log("\n[GATILHO] O Mestre deve solicitar ao Gemini a revisão do copy B2B/B2C, pois a comunicação perdeu a sintonia.");
    }
}

try {
    processarSensores();
} catch (e) {
    console.error(`[ERRO] snc_sensores.js ${e.message}`);
    process.exit(1);
}
