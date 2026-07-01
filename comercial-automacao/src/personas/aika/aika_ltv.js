const snc = require('../../snc/snc_core');

async function dispararLembreteAniversario(cliente, telefone) {
    const mensagemAika = `Oi ${cliente}! Aqui é a Aika da Otimiza FarmaVet 🐾 passando pra desejar um feliz aniversário para o seu pet! Preparamos um cupom especial de frete grátis para comemorar.`;

    // 1. Passa pelo Filtro de Tom do SNC
    const aprovado = snc.validarTomDeVoz('Aika', mensagemAika);
    
    if (aprovado) {
        console.log(`[AIKA B2C] Enviando mensagem de aniversário para ${telefone}`);
        // Logica real de envio WWebJS...
    } else {
        console.log(`[AIKA B2C] ❌ Mensagem bloqueada pelo SNC. Regenerando com IA...`);
        // Chama Gemini para reescrever
    }
}

module.exports = { dispararLembreteAniversario };
