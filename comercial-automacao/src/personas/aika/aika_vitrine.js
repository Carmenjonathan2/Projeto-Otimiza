const { spawn } = require('child_process');
const path = require('path');
const snc = require('../../snc/snc_core');

// Configuração para ativar/desativar a geração diária automática da Shopify
const AUTO_GENERATE_FROM_SHOPIFY = false; 

async function gerarVitrine() {
    if (!AUTO_GENERATE_FROM_SHOPIFY) {
        snc.log("Aika B2C: Geração automática da Shopify desativada (usando flyers existentes em posts_prontos).");
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        snc.log("Aika B2C: Solicitando geração da Vitrine da Semana...");
        
        const caminhoScript = path.resolve(__dirname, '../../../../1-Farmacia-Ecommerce/vitrine-virtual/gerador_vitrine.py');
        const pastaExecucao = path.resolve(__dirname, '../../../../1-Farmacia-Ecommerce/vitrine-virtual');

        const processo = spawn('python', [caminhoScript], {
            stdio: 'inherit',
            shell: false,
            cwd: pastaExecucao
        });

        processo.on('close', (code) => {
            if (code === 0) {
                snc.log("Aika B2C: Vitrine gerada com sucesso!");
                resolve();
            } else {
                snc.log(`Aika B2C: Erro ao gerar vitrine. Código: ${code}`);
                resolve();
            }
        });
    });
}

// Permite rodar como standalone ou integrado no comando_central
if (require.main === module) {
    gerarVitrine();
}

module.exports = { gerarVitrine };
