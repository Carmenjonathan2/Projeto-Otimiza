const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const QUEUE_FILE = path.resolve(__dirname, '../../../../lessie_whatsapp_queue.json');
const MAX_ENVIOS_DIA = 10; // Trava de segurança diária rígida para evitar blocks

/**
 * Limpa e formata o telefone para o padrão do whatsapp-web.js
 */
const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if(!limpo || limpo === '') return null;
    if(limpo.startsWith('55')) limpo = limpo.substring(2);
    
    // Se tem 11 dígitos e o terceiro é 9, é celular
    if (limpo.length === 11 && limpo.substring(2, 3) === '9') return `55${limpo}@c.us`;
    if (limpo.length === 10) return `55${limpo}@c.us`;
    return null;
};

/**
 * Envia mensagens para uma fila de leads usando um cliente específico
 */
async function processarFilaPersona(persona, leads) {
    if (leads.length === 0) return;

    const clientId = persona === 'Aika' ? 'aika-b2b' : 'kyenner-rt';
    console.log(`\n🤖 Inicializando Sessão WhatsApp para [${persona}] (Client ID: ${clientId})...`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: clientId }),
        puppeteer: {
            headless: false, // Mantido false para compatibilidade e diagnóstico visual se necessário
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    return new Promise((resolve) => {
        let envios = 0;

        client.on('qr', (qr) => {
            console.log(`\n⚠️ CONEXÃO REQUERIDA: Leia o QR Code abaixo com o WhatsApp da persona [${persona}]:`);
            qrcode.generate(qr, { small: true });
        });

        client.on('auth_failure', (msg) => {
            console.error(`❌ Falha de autenticação para a persona ${persona}:`, msg);
            resolve();
        });

        client.on('disconnected', (reason) => {
            console.log(`❌ Conexão encerrada para a persona ${persona}:`, reason);
        });

        client.on('ready', async () => {
            console.log(`✅ Conexão estabelecida com sucesso para [${persona}]. Processando leads...`);

            for (const lead of leads) {
                if (envios >= MAX_ENVIOS_DIA) {
                    console.log(`🛑 Limite diário de segurança de ${MAX_ENVIOS_DIA} envios atingido para a persona ${persona}.`);
                    break;
                }

                const zapId = limparTelefone(lead.telefone);
                if (!zapId) {
                    console.log(`⚠️ Telefone inválido para ${lead.empresa}: ${lead.telefone}. Pulando.`);
                    marcarFilaComoFalha(lead.telefone, "Telefone Inválido");
                    continue;
                }

                console.log(`🎯 [${envios + 1}/${leads.length}] Enviando WhatsApp para: ${lead.nomeContato} (${lead.empresa})`);
                
                try {
                    const numberId = await client.getNumberId(zapId.split('@')[0]);
                    
                    if (numberId) {
                        await client.sendMessage(numberId._serialized, lead.mensagemZap);
                        console.log(`   ✔️ Mensagem enviada com sucesso!`);
                        marcarFilaComoEnviado(lead.telefone);
                        envios++;
                        
                        // Delay de segurança (Rítmo Humano: 60-120 segundos)
                        const delay = 60000 + Math.floor(Math.random() * 60000);
                        console.log(`⏳ Aguardando ${Math.round(delay/1000)}s de segurança...`);
                        await new Promise(r => setTimeout(r, delay));
                    } else {
                        console.log(`   ⚠️ Número não registrado no WhatsApp: ${zapId}`);
                        marcarFilaComoFalha(lead.telefone, "Não possui WhatsApp");
                    }
                } catch (e) {
                    console.error(`   ❌ Erro ao enviar para ${lead.empresa}:`, e.message);
                }
            }

            console.log(`🏁 Fila de WhatsApp de ${persona} concluída.`);
            await client.destroy();
            resolve();
        });

        client.initialize();
    });
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
    console.log(`📱 DISPARADOR DE WHATSAPP DA FILA LESSIE`);
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

    // Processa sequencialmente para evitar conflito de portas/arquivos do Chrome
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
