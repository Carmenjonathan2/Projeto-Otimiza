const snc = require('../../snc/snc_core');

async function dispararProspeccao(clinica, telefone) {
    const mensagemKyenner = `Olá, Dr(a). Sou Kyenner Oliver, RT da Otimiza. Vi que sua clínica em BH trabalha com foco em felinos. Gostaria de apresentar nossa tabela B2B para envio de medicamentos expressos.`;

    // 1. Passa pelo Filtro de Tom do SNC
    const aprovado = snc.validarTomDeVoz('Kyenner', mensagemKyenner);
    
    if (aprovado) {
        console.log(`[KYENNER B2B] Disparando prospecção para ${clinica} (${telefone})`);
        // Logica real de envio
    } else {
        console.log(`[KYENNER B2B] ❌ Mensagem bloqueada pelo SNC. Não segue o tom de autoridade.`);
    }
}

module.exports = { dispararProspeccao };
