const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Gateway Unificado do WhatsApp
const whatsappGateway = require('../0-Central-SNC/src/integracoes/whatsapp_gateway');

const QUEUE_FILE = path.resolve(__dirname, 'lessie_whatsapp_queue.json');
const MAX_ENVIOS_DIA = 10; // Trava de segurança diária rígida para evitar blocks

/**
 * Limpa e formata o telefone para o padrão Z-API / Gateway
 */
const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if (!limpo || limpo === '') return null;
    if (limpo.startsWith('55')) {
        return limpo;
    }
    if (limpo.length === 10 || limpo.length === 11) {
        return `55${limpo}`;
    }
    return limpo;
};

/**
 * Envia mensagens para uma fila de leads usando o whatsappGateway
 */
async function processarFilaPersona(persona, leads) {
    if (leads.length === 0) return;

    console.log(`\n🤖 Processando Fila WhatsApp para a persona [${persona}]...`);
    let envios = 0;

    for (const lead of leads) {
        if (envios >= MAX_ENVIOS_DIA) {
            console.log(`🛑 Limite diário de segurança de ${MAX_ENVIOS_DIA} envios atingido para a persona ${persona}.`);
            break;
        }

        const phone = limparTelefone(lead.telefone);
        if (!phone) {
            console.log(`⚠️ Telefone inválido para ${lead.empresa}: ${lead.telefone}. Pulando.`);
            marcarFilaComoFalha(lead.telefone, "Telefone Inválido");
            continue;
        }

        console.log(`🎯 [${envios + 1}/${leads.length}] Enviando WhatsApp para: ${lead.nomeContato} (${lead.empresa}) usando Gateway...`);
        
        try {
            // syncToChatwoot: false para evitar poluir as conversas comerciais de atendimento real.
            const result = await whatsappGateway.enviarMensagemTexto(phone, lead.mensagemZap, false);
            
            console.log(`   ✔️ Resposta do Gateway:`, result.message || "Sucesso");
            marcarFilaComoEnviado(lead.telefone);
            envios++;
            
            // Delay de segurança (Rítmo Humano: 10-20 segundos para Z-API)
            const delay = 10000 + Math.floor(Math.random() * 10000);
            console.log(`⏳ Aguardando ${Math.round(delay/1000)}s de segurança...`);
            await new Promise(r => setTimeout(r, delay));
        } catch (e) {
            console.error(`   ❌ Erro ao enviar para ${lead.empresa}:`, e.message);
            marcarFilaComoFalha(lead.telefone, e.message);
        }
    }

    console.log(`🏁 Fila de WhatsApp de ${persona} concluída.`);
}

function marcarFilaComoEnviado(telefone) {
    if (!fs.existsSync(QUEUE_FILE)) return;
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const item = queue.find(i => i.telefone === telefone);
    if (item) {
        item.status = "Enviado";
        item.dataEnvio = new Date().toISOString();
    }
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

function marcarFilaComoFalha(telefone, motivo) {
    if (!fs.existsSync(QUEUE_FILE)) return;
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const item = queue.find(i => i.telefone === telefone);
    if (item) {
        item.status = "Falha";
        item.motivoFalha = motivo;
        item.dataProcessamento = new Date().toISOString();
    }
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

async function run() {
    console.log(`\n=============================================================`);
    console.log(`📱 DISPARADOR DE WHATSAPP DA FILA LESSIE (Z-API GATEWAY)`);
    console.log(`=============================================================\n`);

    if (!fs.existsSync(QUEUE_FILE)) {
        console.log("📭 Fila de WhatsApp vazia ou inexistente.");
        process.exit(0);
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const leadsAguardando = queue.filter(item => item.status === "Aguardando");

    if (leadsAguardando.length === 0) {
        console.log("✅ Não há leads pendentes de envio na fila de WhatsApp.");
        process.exit(0);
    }

    console.log(`📋 Encontrados ${leadsAguardando.length} leads pendentes.`);

    // Separa os leads por Persona
    const leadsKyenner = leadsAguardando.filter(item => item.persona === 'Kyenner');
    const leadsAika = leadsAguardando.filter(item => item.persona === 'Aika');

    // Processa sequencialmente
    if (leadsKyenner.length > 0) {
        await processarFilaPersona('Kyenner', leadsKyenner);
    }

    if (leadsAika.length > 0) {
        await processarFilaPersona('Aika', leadsAika);
    }

    console.log(`\n=============================================================`);
    console.log(`🏁 DISPAROS CONCLUÍDOS`);
    console.log(`=============================================================\n`);
    process.exit(0);
}

run().catch(err => {
    console.error("❌ Erro fatal no disparador de WhatsApp:", err);
    process.exit(1);
});
