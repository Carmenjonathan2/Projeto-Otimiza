const cron = require('node-cron');
const { DateTime } = require('luxon');
const { getAuthClient, saveToken } = require('./src/auth');
const { readLeads, updateLead } = require('./src/sheets');
const { generateIcebreaker } = require('./src/ai');
const { getPlaceData } = require('./src/places'); // <--- BUSCA DO GOOGLE MAPS
const { sendEmail, sendFollowUp, checkReplies } = require('./src/gmail');
const { validateEmail } = require('./src/validator'); // <--- NOVO
const { enviarAlertaTelegram } = require('./src/notifications'); // <--- NOVO MÓDULO IMPORTADO
const readline = require('readline');
require('dotenv').config();

const fs = require('fs');

const TIMEZONE = 'America/Sao_Paulo';
const LIMIT_NEW_LEADS = 30; // <--- TRAVA DE SEGURANÇA: Limite de e-mails de Prospecção
const LIMIT_FOLLOWUPS = 30; // <--- TRAVA DE SEGURANÇA: Limite de Bumps segregados

// Configuração de salvamento automático de Logs no disco
const logFile = process.env.ACCOUNT_ID ? `erros_historico_${process.env.ACCOUNT_ID}.txt` : 'erros_historico.txt';
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
    const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    const time = DateTime.now().setZone(TIMEZONE).toFormat('dd/MM/yyyy HH:mm:ss');
    logStream.write(`[LOG] [${time}] - ${message}\n`);
    originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
    const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    const time = DateTime.now().setZone(TIMEZONE).toFormat('dd/MM/yyyy HH:mm:ss');
    logStream.write(`[ERR] [${time}] - ${message}\n`);
    originalConsoleError.apply(console, args);
};

async function authorize() {
    const auth = await getAuthClient();
    if (!auth.credentials.refresh_token) {
        const authUrl = auth.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify'
            ],
        });
        console.log('Autorize visitando:', authUrl);
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((resolve) => {
            rl.question('Código: ', async (code) => {
                rl.close();
                const { tokens } = await auth.getToken(code);
                auth.setCredentials(tokens);
                await saveToken(auth);
                resolve(auth);
            });
        });
    }
    return auth;
}

async function runAutomation() {
    // 💡 Prevenção de Conflitos: Se estivermos em Multi-Conta, adicionamos um atraso aleatório pequeno (0-8s)
    if (process.env.ACCOUNT_ID) {
        const jitter = Math.floor(Math.random() * 8000);
        console.log(`⏳ Aguardando ${jitter}ms (Jitter Multi-Conta: ${process.env.ACCOUNT_ID})...`);
        await new Promise(r => setTimeout(r, jitter));
    }
    
    console.log(`\n--- 🕒 Ciclo Iniciado: ${DateTime.now().setZone(TIMEZONE).toFormat('dd/MM/yyyy HH:mm')} ---`);
    let sentNewCount = 0; // <--- Contador de envios (Icebreakers/Novos)
    let sentFollowupCount = 0; // <--- Contador de Bumps (Follow-up)
    try {
        const auth = await authorize();
        const leads = await readLeads(auth);
        const todayStr = DateTime.now().setZone(TIMEZONE).toFormat('dd/MM/yyyy');

        // 🎯 1. MONITORAMENTO: Identifica respostas e envia alertas
        console.log("🔍 Verificando respostas...");
        const responders = await checkReplies(auth, leads);
        if (responders.length > 0) {
            for (const lead of responders) {
                // Só alertamos se for a primeira vez que ele é marcado como respondido
                if (lead.status !== 'Respondido') {
                    console.log(`🎁 Resposta quente detectada: ${lead.nome} (${lead.empresa})`);

                    // Atualiza primeiro na planilha por segurança
                    await updateLead(auth, lead.rowIndex, 'Respondido', lead.dataEnvio, lead.messageId);

                    // DISPARA O ALERTA TELEGRAM AUTOMÁTICO
                    await enviarAlertaTelegram(lead.nome, lead.empresa);
                }
            }
        }

        // 2. PROCESSAR FILA (Novos Leads e Follow-ups)
        for (const lead of leads) {
            // TRAVA DE SEGURANÇA GERAL: Se ambos atingirem os limites, para o loop de vez
            if (sentNewCount >= LIMIT_NEW_LEADS && sentFollowupCount >= LIMIT_FOLLOWUPS) {
                console.log(`\n🛑 LIMITES TOTALMENTE ATINGIDOS (Novos: ${LIMIT_NEW_LEADS}, Bumps: ${LIMIT_FOLLOWUPS}). Interrompendo novos processamentos.`);
                break;
            }

            try {
                // Lógica de Follow-up (O Bump) - Se passaram exatos 3 dias
                if (lead.status === 'Enviado' && lead.dataEnvio) {
                    if (sentFollowupCount >= LIMIT_FOLLOWUPS) continue; // Pula somente se o limite de Follow-up esgotou

                    const sendDate = DateTime.fromFormat(lead.dataEnvio, 'dd/MM/yyyy').setZone(TIMEZONE);
                    const diffDays = Math.floor(DateTime.now().setZone(TIMEZONE).diff(sendDate, 'days').days);

                    if (diffDays === 3) {
                        console.log(`🚀 Enviando Bump (Day 3) para: ${lead.nome} [Bump #${sentFollowupCount + 1}]`);
                        const success = await sendFollowUp(auth, lead.email, lead.nome, lead.empresa, null, lead.messageId);
                        if (success) {
                            await updateLead(auth, lead.rowIndex, 'Bump Enviado', todayStr, lead.messageId);
                            sentFollowupCount++; // <--- INCREMENTA FOLLOWUP
                        }
                        await new Promise(r => setTimeout(r, 8000));
                    }
                }

                // Lógica de Novo Envio (Personalizado por IA)
                if (lead.status === 'Aguardando' || lead.status === '') {
                    if (sentNewCount >= LIMIT_NEW_LEADS) continue; // Pula somente se o limite Cota IA/Novo Lead esgotou
                    
                    // Validação de E-mail antes de gastar cota da IA
                    const isEmailValid = await validateEmail(lead.email);
                    if (!isEmailValid.valid) {
                        console.log(`⚠️ E-mail inválido (${isEmailValid.reason}): ${lead.email} - Lead: ${lead.nome}`);
                        await updateLead(auth, lead.rowIndex, 'E-mail Inválido', todayStr);
                        continue; // Pula para o próximo lead
                    }

                    console.log(`✉️ Processando Novo Lead: ${lead.nome} [Envio Novo #${sentNewCount + 1}]`);
                    
                    // Busca no Google (Nome + Cidade) para hiper-personalização
                    const placeData = await getPlaceData(lead.empresa, lead.endereco);

                    const icebreaker = await generateIcebreaker(lead.contexto, lead.nome, lead.empresa, placeData);
                    const res = await sendEmail(auth, lead.email, lead.nome, icebreaker, lead.empresa, lead.contexto);

                    if (res.success) {
                        await updateLead(auth, lead.rowIndex, 'Enviado', todayStr, res.messageId);
                        sentNewCount++; // <--- INCREMENTA NOVO LEAD
                    }
                    await new Promise(r => setTimeout(r, 8000));
                }
            } catch (errLead) {
                console.error(`❌ Erro Isolado no lead ${lead.nome} (${lead.email}):`, errLead.message);
                // Continua o loop para o próximo lead;
            }
        }

        console.log(`\n✅ Ciclo Finalizado! Total do dia: ${sentNewCount} Quebra-gelo | ${sentFollowupCount} Bumps`);
    } catch (error) {
        console.error("❌ Erro Geral:", error.message);
    }
}

// Verifica se foi chamado manualmente ou pelo agendador. 
// Para agendador via .bat, usamos a tag --once para rodar apenas uma vez e sair
if (process.argv.includes('--once')) {
    runAutomation().then(() => process.exit(0));
} else {
    // Agenda às 09:00 AM todos os dias
    cron.schedule('0 9 * * *', runAutomation, { timezone: TIMEZONE });
    // Inicia a primeira rodada
    runAutomation();
}
