const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// CONFIGURAÇÕES
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = ['6823632451', '868045878']; // Carmen e Oliveira
const DB_FILE = path.join(__dirname, '..', '..', '..', 'estoque_validades.json');

const HOJE = new Date();

async function enviarAlerta(texto) {
    for (const chatId of CHAT_IDS) {
        try {
            await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: texto,
                parse_mode: 'Markdown'
            });
        } catch (e) {
            console.error(`Erro ao enviar para ${chatId}:`, e.message);
        }
    }
}

async function run() {
    console.log(`[INICIO] notificador_vencimento.js ${new Date().toISOString()}`);
    
    if (!fs.existsSync(DB_FILE)) return console.log("Arquivo de estoque não encontrado.");
    
    const estoque = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    let alertasEnviados = 0;

    estoque.forEach(item => {
        const [dia, mes, ano] = item.validade.split('/');
        const dataValidade = new Date(ano, mes - 1, dia);
        
        // Diferença em meses
        const diffMeses = (dataValidade.getFullYear() - HOJE.getFullYear()) * 12 + (dataValidade.getMonth() - HOJE.getMonth());
        
        if (diffMeses <= 3 && diffMeses >= 0) {
            alertasEnviados++;
            
            let urgencia = "⚠️";
            if (diffMeses <= 1) urgencia = "🚨 CRÍTICO";
            else if (diffMeses <= 2) urgencia = "🟠 ALERTA";

            const copyZap = `🔥 *OFERTA RELÂMPAGO OTIMIZA!* 🔥\n\nGaranta agora o *${item.nome}* com desconto exclusivo de validade próxima!\n\n📅 *Validade:* ${item.validade}\n🔢 *Últimas unidades!*\n\n🛒 *Compre aqui:* ${item.linkShopify}\n\n🐾 _Otimiza FarmaVet - Cuidando com carinho e economia!_`;

            const msgTelegram = `📦 *PRODUTO VENCENDO!* ${urgencia}\n\n👤 *Item:* ${item.nome}\n📅 *Vencimento:* ${item.validade}\n🕒 *Faltam:* ${diffMeses} mês(es)\n\n--- ✂️ *COPIE E COLE NO WHATSAPP* ✂️ ---\n\n${copyZap}`;

            enviarAlerta(msgTelegram);
        }
    });

    console.log(`[OK] notificador_vencimento.js ${new Date().toISOString()} — Verificação concluída. ${alertasEnviados} alertas enviados.`);
}

run();
