require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CRM_URL = process.env.CRM_URL || 'http://localhost:3001/api/evento';

function notificarCRM(evento) {
    try {
        const corpo = JSON.stringify(evento);
        const url = new URL(CRM_URL);
        const mod = url.protocol === 'https:' ? https : http;
        const req = mod.request({
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(corpo) }
        });
        req.on('error', () => {}); // CRM offline não interrompe o monitor
        req.write(corpo);
        req.end();
    } catch (_) {}
}

// ============================================
// 1. CONFIGURAÇÕES E PASTAS
// ============================================
const ARQUIVO_HISTORICO = 'historico_comercial.json';
const PASTA_AUDIOS = 'audios_comercial';
const ARQUIVO_QR = 'conexao_comercial.png';
const PALAVRAS_CHAVE = [
    'orçamento', 'preco', 'preço', 'quanto ta', 'valor', 'pix', 'boleto', 
    'prazo', 'entrega', 'frete', 'disponibilidade', 'estoque', 'fechado',
    'confirmado', 'pedido', 'pagamento', 'amanhã', 'semana', 'quinta', 'sexta',
    'quarta', 'segunda', 'terça', 'terca', 'sabado', 'domingo', 'hoje',
    'bravecto', 'nexgard', 'simparic', 'credeli', 'seresto', 'scalibor', 'frontmax', 'leevre'
];

// Garante que a pasta de áudios existe
if (!fs.existsSync(PASTA_AUDIOS)) {
    fs.mkdirSync(PASTA_AUDIOS);
}

// Inicializa ou carrega histórico
let historico = [];
if (fs.existsSync(ARQUIVO_HISTORICO)) {
    try {
        historico = JSON.parse(fs.readFileSync(ARQUIVO_HISTORICO, 'utf8'));
    } catch (e) {
        console.error('Erro ao ler histórico, iniciando novo.');
    }
}

// ============================================
// 2. INICIALIZAÇÃO DO WHATSAPP
// ============================================
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('🐾 MONITOR COMERCIAL: Um novo QR Code foi gerado!');
    
    // 1. Salva como imagem
    try {
        await QRCode.toFile(ARQUIVO_QR, qr);
        console.log(`🖼️  OK! Abra o arquivo [${ARQUIVO_QR}] na sua pasta do projeto e escaneie agora.`);
    } catch (err) {
        console.error('Erro ao gerar imagem do QR:', err);
    }

    // 2. Backup no terminal
    qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Monitor Comercial Pronto e Escutando (Texto + Áudio)!');
    // Remove o arquivo de QR após conectar para não confundir
    if (fs.existsSync(ARQUIVO_QR)) fs.unlinkSync(ARQUIVO_QR);
});

client.on('authenticated', () => {
    console.log('🔓 Autenticado com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
});

// ============================================
// 3. LÓGICA DE MONITORAMENTO (TEXTO E ÁUDIO)
// ============================================
client.on('message_create', async (msg) => {
    const texto = msg.body ? msg.body.toLowerCase() : '';
    const isComercial = msg.fromMe;
    
    // 3.1. TRATAMENTO DE ÁUDIO
    let audioPath = null;
    let isAudio = (msg.type === 'ptt' || msg.type === 'audio');

    if (isAudio && msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            if (media) {
                const contato = await msg.getContact();
                const nomeSeguro = (contato.pushname || contato.number || 'contato').replace(/[^a-z0-9]/gi, '_');
                const dataStr = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `audio_${nomeSeguro}_${dataStr}.${media.mimetype.split('/')[1]}`;
                audioPath = path.join(PASTA_AUDIOS, fileName);
                
                fs.writeFileSync(audioPath, media.data, 'base64');
                console.log(`🎤 Áudio capturado de ${nomeSeguro} -> ${fileName}`);
            }
        } catch (err) {
            console.error('❌ Erro ao baixar áudio:', err.message);
        }
    }

    // 3.2. FILTRAGEM COMERCIAL
    const temInteressePalavra = PALAVRAS_CHAVE.some(palavra => texto.includes(palavra));
    
    if (temInteressePalavra || isAudio) {
        try {
            const contato = await msg.getContact();
            const chat = await msg.getChat();
            
            const evento = {
                timestamp: new Date().toISOString(),
                id: msg.id.id,
                quem: isComercial ? 'COMERCIAL' : (contato.pushname || contato.number),
                telefone: contato.number,
                mensagem: isAudio ? '[ MENSAGEM DE ÁUDIO ]' : msg.body,
                chat_nome: chat.name,
                comercial_respondeu: isComercial,
                audio_local: audioPath,
                possivel_prazo: extrairPrazos(texto)
            };

            salvarEvento(evento);
            notificarCRM(evento);

            if (!isComercial) {
                console.log(`💼 [INTERESSE] ${evento.quem}: ${isAudio ? 'Enviou Áudio' : msg.body.substring(0, 50)}...`);
            }
        } catch (err) {
            console.error('Erro ao processar mensagem comercial:', err.message);
        }
    }
});

// ============================================
// 4. FUNÇÕES AUXILIARES
// ============================================
function extrairPrazos(texto) {
    const diaMatch = texto.match(/(segunda|terça|terca|quarta|quinta|sexta|sabado|sábado|domingo|amanhã|semana que vem|hoje)/);
    return diaMatch ? diaMatch[0] : null;
}

function salvarEvento(evento) {
    historico.push(evento);
    if (historico.length > 5000) historico.shift();
    
    fs.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(historico, null, 2));
}

// Ligar o motor
client.initialize();
