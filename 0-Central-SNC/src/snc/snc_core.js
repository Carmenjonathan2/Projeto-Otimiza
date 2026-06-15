const fs = require('fs');
const path = require('path');

class SNC {
    constructor() {
        this.logFile = path.resolve(__dirname, '../../snc_alertas.log');
        this.limiarAdesaoMinimo = 15; // %
    }

    log(mensagem) {
        const linha = `[${new Date().toISOString()}] ${mensagem}\n`;
        fs.appendFileSync(this.logFile, linha);
        console.log(`[SNC] ${mensagem}`);
    }

    /**
     * Avalia se a base de clientes está com boa taxa de resposta.
     * Retorna { saudavel: boolean, taxaAdesao: number }
     */
    avaliarSaudeEmocional(historico, contatados) {
        // Implementação simplificada baseada no antigo snc_sensores.js
        if (!contatados || contatados.length === 0) return { saudavel: true, taxaAdesao: 100 };

        let totalResponderam = 0;
        // Na vida real, calcularia cruzando os dados
        // Por simplificação no mock, assumiremos 20%
        const taxaAdesao = 20.0; 

        const saudavel = taxaAdesao >= this.limiarAdesaoMinimo;
        
        if (!saudavel) {
            this.log(`ALERTA: Adesão baixa detectada (${taxaAdesao}%). Campanhas de prospecção devem ser pausadas.`);
        }

        return { saudavel, taxaAdesao };
    }

    /**
     * Filtro de Tom de Voz. Valida se a mensagem respeita as diretrizes da persona.
     */
    validarTomDeVoz(persona, texto) {
        const textoLower = texto.toLowerCase();
        
        if (persona === 'Aika') {
            // Aika B2C: Afeto, Cuidado, sem termos corporativos frios ou burocráticos.
            const palavrasProibidas = [
                'prezado', 'senhor', 'senhora', 'sr.', 'sra.',
                'termo', 'contrato', 'diretor', 'diretor veterinário', 'vigilância sanitária'
            ];
            for (let p of palavrasProibidas) {
                if (textoLower.includes(p)) {
                    this.log(`Filtro SNC (Aika) REPROVOU texto. Palavra robótica/inadequada: "${p}"`);
                    return false;
                }
            }
            return true;
        }

        if (persona === 'Kyenner') {
            // Kyenner B2B: Autoridade, Ciência, sem infantilidades e sem títulos honoríficos.
            const palavrasProibidas = ['fofinho', 'auau', 'miau', 'titio', 'animalzinho', 'parceirinho'];
            for (let p of palavrasProibidas) {
                if (textoLower.includes(p)) {
                    this.log(`Filtro SNC (Kyenner) REPROVOU texto. Palavra inadequada para B2B: "${p}"`);
                    return false;
                }
            }

            // Kyenner prefere ser informal e de parceria: evitar Dr, Dra, Doutor, Doutora
            const regexHonorifico = /\b(dr|dra|doutor|doutora)\b/i;
            if (regexHonorifico.test(textoLower)) {
                this.log(`Filtro SNC (Kyenner) REPROVOU texto. Contém título honorífico (Dr/Dra/Doutor/Doutora).`);
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Reflexo de Transbordamento: Corta a IA e notifica humanos.
     */
    acionarReflexoTransbordamento(cliente, motivo, canal) {
        this.log(`🚨 SAFETY NET ACIONADO! Cliente: ${cliente} | Motivo: ${motivo} | Canal: ${canal}`);
        // Aqui enviaria um webhook para o Telegram ou WhatsApp da equipe
        // ex: telegramApi.sendMessage(...)
    }
}

module.exports = new SNC();
