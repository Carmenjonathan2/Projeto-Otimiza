/**
 * Extrator de Conversas WhatsApp Comercial
 * Extrai todas as conversas para análise e criação de material de treinamento
 */

const { Client, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const SAIDA_DIR = path.join(__dirname, 'dados_comercial');
const SAIDA_ARQUIVO = path.join(SAIDA_DIR, `conversas_${new Date().toISOString().split('T')[0]}.json`);
const SAIDA_TXT = path.join(SAIDA_DIR, `conversas_leitura_${new Date().toISOString().split('T')[0]}.txt`);

if (!fs.existsSync(SAIDA_DIR)) {
    fs.mkdirSync(SAIDA_DIR, { recursive: true });
}

// Configura o cliente para usar o mesmo perfil do Chrome (perfil_aika) das outras automações
const client = new Client({
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: path.resolve(__dirname, 'perfil_aika'),
        protocolTimeout: 120000,
        timeout: 0,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ],
    }
});

console.log('[EXTRATOR] Conectando ao WhatsApp comercial usando perfil_aika...');

client.on('ready', async () => {
    console.log('[EXTRATOR] Conectado com sucesso! Iniciando extração de conversas...');

    try {
        const chats = await client.getChats();
        console.log(`[EXTRATOR] Encontrei ${chats.length} conversas no total.`);

        const resultado = [];
        let txtOutput = `=== CONVERSAS WHATSAPP COMERCIAL ===\nExtraído em: ${new Date().toLocaleString('pt-BR')}\nTotal de conversas: ${chats.length}\n\n`;

        let processadas = 0;
        // Ordena por data do último chat para priorizar mais recentes se demorar
        chats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        for (const chat of chats) {
            try {
                // Pega as últimas 150 mensagens
                const mensagens = await chat.fetchMessages({ limit: 150 });
                
                if (mensagens.length === 0) continue;

                const nomeContato = chat.name || chat.id.user || 'Desconhecido';
                const isGroup = chat.isGroup;
                
                const conversa = {
                    id: chat.id._serialized,
                    nome: nomeContato,
                    isGrupo: isGroup,
                    totalMensagens: mensagens.length,
                    mensagens: mensagens.map(m => ({
                        de: m.fromMe ? 'LOJA' : nomeContato,
                        texto: m.body || (m.hasMedia ? `[MÍDIA: ${m.type}]` : '[SEM CONTEÚDO]'),
                        hora: new Date(m.timestamp * 1000).toLocaleString('pt-BR'),
                        tipo: m.type,
                    })).filter(m => m.texto && m.texto.trim() !== '')
                };

                // Verifica se há pelo menos um contato real (com mensagens de ambas partes)
                const mensagensDaLoja = conversa.mensagens.filter(m => m.de === 'LOJA');
                if (mensagensDaLoja.length >= 1) {
                    resultado.push(conversa);

                    // Formata para o arquivo de texto
                    txtOutput += `\n${'='.repeat(60)}\n`;
                    txtOutput += `CONVERSA: ${nomeContato}${isGroup ? ' [GRUPO]' : ''}\n`;
                    txtOutput += `Total de mensagens analisadas: ${mensagens.length}\n`;
                    txtOutput += `${'='.repeat(60)}\n\n`;
                    
                    conversa.mensagens.forEach(m => {
                        txtOutput += `[${m.hora}] ${m.de.toUpperCase()}:\n`;
                        txtOutput += `${m.texto}\n\n`;
                    });
                }

            } catch (errChat) {
                console.log(`[EXTRATOR] Erro ao carregar mensagens do chat ${chat.name}:`, errChat.message);
            }

            processadas++;
            if (processadas % 10 === 0 || processadas === chats.length) {
                console.log(`[EXTRATOR] Progresso: ${processadas}/${chats.length} conversas processadas...`);
            }
        }

        // Salva JSON
        fs.writeFileSync(SAIDA_ARQUIVO, JSON.stringify(resultado, null, 2), 'utf8');
        
        // Salva TXT
        fs.writeFileSync(SAIDA_TXT, txtOutput, 'utf8');

        console.log(`\n[EXTRATOR] ✅ Extração concluída!`);
        console.log(`[EXTRATOR] Conversas úteis encontradas: ${resultado.length}`);
        console.log(`[EXTRATOR] Arquivo JSON: ${SAIDA_ARQUIVO}`);
        console.log(`[EXTRATOR] Arquivo TXT: ${SAIDA_TXT}`);

        const totalMsgs = resultado.reduce((acc, c) => acc + c.mensagens.length, 0);
        console.log(`[EXTRATOR] Total de mensagens gravadas: ${totalMsgs}`);

    } catch (err) {
        console.error('[EXTRATOR] Erro crítico na extração:', err);
    } finally {
        await client.destroy();
        console.log('[EXTRATOR] Sessão encerrada.');
        process.exit(0);
    }
});

client.on('auth_failure', (msg) => {
    console.error('[EXTRATOR] Falha de autenticação do perfil_aika:', msg);
    process.exit(1);
});

client.initialize().catch(err => {
    console.error('[EXTRATOR] Erro fatal na inicialização:', err);
    process.exit(1);
});
