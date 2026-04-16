const { google } = require('googleapis');
require('dotenv').config();

// Helper para extrair o primeiro nome do lead com Capitalização Correta (João, Maria)
function formatFirstName(rawName) {
    if (!rawName || typeof rawName !== 'string') return "";
    const parts = rawName.trim().split(' ');
    let firstName = "";
    for (let p of parts) {
        let clean = p.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
        if (clean.length > 0) {
            firstName = clean;
            break;
        }
    }
    if (!firstName) return "";
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

// Helper para converter texto em MIME Base64 (padrão Gmail)
function createMimeMessage(to, subject, body, threadId = null, replyToId = null) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
    ];

    // Adiciona cabeçalhos de Threading se for um follow-up
    if (replyToId) {
        messageParts.push(`In-Reply-To: ${replyToId}`);
        messageParts.push(`References: ${replyToId}`);
    }

    messageParts.push('', body);
    const message = messageParts.join('\n');

    return Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function sendEmail(auth, to, nome, icebreaker, empresa) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Filtro e formatação para o nome ficar parecido com texto humano
    const nomeFormatado = formatFirstName(nome);
    const saudacao = nomeFormatado ? `Olá, ${nomeFormatado}, tudo bem?` : "Olá, tudo bem?";

    const isOptionA = Math.random() < 0.5;

    let subject;
    let body;

    // A/B Test for Email Copy
    if (isOptionA) {
        // Opção 1: Direta e Focada em Evitar Prejuízo
        subject = `sobre a ${empresa} / vigilância sanitária`;
        body = `${saudacao}

${icebreaker}

Acompanhando o mercado de vocês, sei que a pressão das fiscalizações de rotina acaba tirando o sono de muito dono de negócio que só quer focar em vender. Uma autuação boba pode travar a operação inteira.

Sou médico veterinário e atuo como Responsável Técnico, blindando a operação de empresas como a ${empresa} para que rodem 100% seguras contra multas sanitárias.

Vocês já possuem alguém cuidando da regularização técnica hoje, ou a porta ainda está aberta para conversarmos?

Um abraço,

Kiener | Médico Veterinário
Responsável Técnico`;
    } else {
        // Opção 2: Oferta de Valor Antecipado
        subject = `dúvida rápida (regularização da ${empresa})`;
        body = `${saudacao}

${icebreaker}

Escrevo direto ao ponto: tenho notado o crescimento da ${empresa} e sei que, no nosso setor, escalar sem tropeçar na burocracia técnica e nas normativas da vigilância é o maior gargalo.

Ajudo empresas do ramo a zerarem riscos de interdição através de Responsabilidade Técnica Veterinária especializada.

Faz sentido eu te enviar um material curto por aqui mostrando os 3 pontos cegos sanitários que mais geram multas para negócios do seu porte? Se não, agradeço a atenção!

Um abraço,

Kiener | Médico Veterinário
Responsável Técnico`;
    }

    const raw = createMimeMessage(to, subject, body);

    try {
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw },
        });

        // PARA ENGENHEIROS: Buscamos o Message-ID (header) real para threading perfeito
        const msg = await gmail.users.messages.get({ userId: 'me', id: res.data.id });
        const msgIdHeader = msg.data.payload.headers.find(h => h.name.toLowerCase() === 'message-id').value;

        console.log(`✅ E-mail enviado (Opção ${isOptionA ? 'A' : 'B'})! Thread ID: ${res.data.threadId}`);
        return { success: true, threadId: res.data.threadId, messageId: msgIdHeader };
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail inicial:', error.message);
        return { success: false };
    }
}

async function sendFollowUp(auth, to, nome, empresa, threadId, originalMsgId) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Filtro e formatação para o nome ficar parecido com texto humano
    const nomeFormatado = formatFirstName(nome);
    const saudacao = nomeFormatado ? `Olá, ${nomeFormatado}, tudo bem?` : "Olá, tudo bem?";

    let subject = `Re: Contato Kiener - Responsabilidade Técnica`; // Fallback emergencial
    let realThreadId = threadId;

    // Busca o assunto original para não quebrar a thread de respostas (Já que fazemos Teste A/B agora)
    if (originalMsgId) {
        try {
            // Buscamos a mensagem através do header Message-ID
            const listRes = await gmail.users.messages.list({ userId: 'me', q: `rfc822msgid:${originalMsgId}` });
            if (listRes.data.messages && listRes.data.messages.length > 0) {
                const internalId = listRes.data.messages[0].id;
                const originalMessage = await gmail.users.messages.get({ userId: 'me', id: internalId });
                const headers = originalMessage.data.payload.headers;
                const originalSubject = headers.find(h => h.name.toLowerCase() === 'subject')?.value;
                if (originalSubject) {
                    subject = originalSubject.toLowerCase().startsWith('re:') ? originalSubject : `Re: ${originalSubject}`;
                }
                realThreadId = originalMessage.data.threadId;
            } else {
                console.log(`Aviso: E-mail original com ID ${originalMsgId} não encontrado. Usando fallback.`);
            }
        } catch (e) {
            console.log("Aviso: Erro ao buscar o assunto original para o Bump. Usando fallback.", e.message);
        }
    }

    const body = `${saudacao}

Oi! Você conseguiu ver meu e-mail anterior sobre a proteção contra multas na ${empresa}?

Um abraço,

Kiener | Médico Veterinário
Responsável Técnico`;

    const raw = createMimeMessage(to, subject, body, realThreadId, originalMsgId);

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw,
                threadId: realThreadId // Usa o ID real obtido da mensagem original
            },
        });
        console.log(`🚀 Bump enviado com sucesso para: ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erro no Follow-up:', error.message);
        return false;
    }
}

async function checkReplies(auth, leads) {
    const gmail = google.gmail({ version: 'v1', auth });
    const respondedLeads = [];
    try {
        // Busca e-mails recebidos nos últimos 7 dias, lidos ou não lidos! (ignora os enviados por você mesmo)
        const res = await gmail.users.messages.list({ 
            userId: 'me', 
            q: 'newer_than:7d -from:me',
            maxResults: 200 
        });
        
        const messages = res.data.messages || [];
        for (const msg of messages) {
            const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });
            const headers = detail.data.payload.headers;
            const fromHeader = headers.find(h => h.name === 'From')?.value || '';
            const match = fromHeader.match(/<([^>]+)>/);
            const fromEmail = (match ? match[1] : fromHeader).toLowerCase().trim();

            const lead = leads.find(l => l.email.toLowerCase().trim() === fromEmail);
            
            // Previne erro caso a string não exista e não adiciona leads duplicados caso tenham respondido várias vezes na semana
            if (lead && !respondedLeads.includes(lead)) {
                console.log(`📩 Resposta da semana detectada de: ${fromEmail} (Lead: ${lead.nome})`);
                respondedLeads.push(lead);
            }
        }
        return respondedLeads;
    } catch (error) {
        console.error('Erro ao verificar respostas:', error.message);
        return [];
    }
}

module.exports = { sendEmail, sendFollowUp, checkReplies };
