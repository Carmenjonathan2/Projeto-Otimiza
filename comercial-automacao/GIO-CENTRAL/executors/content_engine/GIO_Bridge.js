/**
 * Módulo: GIO Bridge
 * Localizado em: /GIO_Bridge.js
 * Objetivo: Cruzar dados de estoque/vendas do GIO e sugerir briefings para o Content Engine.
 */

const fs = require('fs');
const path = require('path');

const GIO_DATA_PATH = path.join(__dirname, 'GIO-Gesp', 'dados_vendas_gio.json');

function getContentIntelligence() {
    console.log("🧠 GIO Bridge: Consultando inteligência de mercado...");

    if (!fs.existsSync(GIO_DATA_PATH)) {
        console.warn("   ⚠️ Dados do GIO não encontrados. Usando temas genéricos.");
        return null;
    }

    try {
        const dados = JSON.parse(fs.readFileSync(GIO_DATA_PATH, 'utf-8'));
        
        // Exemplo de lógica: Pega o cliente que mais comprou e o tema relacionado
        // No futuro, isso usará o GIO_Product_Analyzer para produtos específicos.
        const topCliente = dados[0];
        
        return {
            contexto: `Foco em clientes do perfil ${topCliente.nome} (Classe ${topCliente.classe}), que representam grande parte do faturamento recente.`,
            sugestao_tema: `Como otimizar a reposição de estoque para clínicas de alto volume.`
        };
    } catch (e) {
        return null;
    }
}

module.exports = { getContentIntelligence };
