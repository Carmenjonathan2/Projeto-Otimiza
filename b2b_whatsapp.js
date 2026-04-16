const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');

// ===================================
// 1. CONFIGURAÇÕES
// ===================================
const CSV_FILE = path.join(__dirname, 'scraper-condominios-bh', 'condominios_bh.csv');
const JSON_CONTATADOS = path.join(__dirname, 'b2b_contatados.json');
const MAX_ENVIOS_DIA = 15; // Trava de segurança Anti-Spam
const DELAY_MIN = 12000; // 12 segs
const DELAY_MAX = 35000; // 35 segs
const ARQUIVO_QR = 'conexao_comercial.png';

// ===================================
// 2. MEMÓRIA DE DADOS
// ===================================
let contatados = [];
if (fs.existsSync(JSON_CONTATADOS)) {
    contatados = JSON.parse(fs.readFileSync(JSON_CONTATADOS, 'utf8'));
} else {
    fs.writeFileSync(JSON_CONTATADOS, JSON.stringify([], null, 2));
}

// Delay com Jitter
const delayAleatorio = () => {
    const ms = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
    console.log(`  ⏳ Jitter Ativo: Simulando digitação humana (${Math.round(ms/1000)}s)...`);
    return new Promise(r => setTimeout(r, ms));
};

const limparTelefone = (tel) => {
    let limpo = tel.replace(/\D/g, '');
    if(!limpo || limpo === '') return null;
    
    // Tratamento para números de celular MG e fixos
    if(limpo.length === 10 || limpo.length === 11) {
        return `55${limpo}@c.us`; 
    }
    return null;
};

// Parser básico manual de CSV
const carregarLeads = () => {
    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const linhas = content.split('\n');
    const leads = [];
    
    for(let i=1; i<linhas.length; i++){
        try {
            let linha = linhas[i].trim();
            if(!linha) continue;
            
            // Divide ignorando aspas (CSV base)
            const match = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if(match.length >= 3) {
                let nome = match[0].replace(/^"|"$/g, '').trim();
                let tel = match[1].replace(/^"|"$/g, '').trim();
                let endereco = match[2].replace(/^"|"$/g, '').trim();
                
                // FILTRO GEOGRÁFICO RIGOROSO: Apenas BH
                if (!endereco.toLowerCase().includes("belo horizonte")) {
                    console.log(`  ⏩ Ignorando ${nome} (Local fora de BH: ${endereco})`);
                    continue;
                }
                
                // Extrai o bairro como ponto de referência
                let bairro = "BH";
                const partesEndereco = endereco.split(/[,-]/);
                if (partesEndereco.length > 1) {
                    bairro = partesEndereco[1].trim();
                }
                
                leads.push({nome, tel, bairro});
            }
        } catch(e) {}
    }
    return leads;
};

// ===================================
// 3. WHATSAPP WEB ENGINE (PERFIL PERMANENTE)
// ===================================
console.log("\n🚀 Inicializando Máquina de Vendas B2B: 'Vet em casa e agora no seu condomínio'");

const client = new Client({
    puppeteer: {
        headless: false, // Abrir visível para você logar
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir: 'c:\\Users\\jonat\\OneDrive\\Desktop\\Projeto Otimiza\\perfil_aika',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log("\n⚠️ ATENÇÃO: Sessão expirou!");
    try {
        await QRCode.toFile('conexao_comercial.png', qr);
        await QRCode.toFile('conexao_comercial.jpg', qr);
        console.log(`🖼️  Escaneie o arquivo [conexao_comercial.jpg] para iniciar os disparos B2B.`);
        qrcodeTerminal.generate(qr, { small: true });
    } catch (err) {
        console.error('Erro ao gerar QR:', err);
    }
});

client.on('ready', async () => {
    console.log("✅ Conexão Criptografada P2P Estabelecida.");
    if (fs.existsSync('conexao_comercial.png')) fs.unlinkSync('conexao_comercial.png');
    if (fs.existsSync('conexao_comercial.jpg')) fs.unlinkSync('conexao_comercial.jpg');
    
    const leads = carregarLeads();
    console.log(`📊 Base de Leads Analisada: ${leads.length} leads de BH qualificados.`);
    
    let enviosLocais = 0;
    
    for (let lead of leads) {
        if (enviosLocais >= MAX_ENVIOS_DIA) {
            console.log(`\n🛑 PROTOLOCO ANTI-BAN: Limite diário máximo de ${MAX_ENVIOS_DIA} atingido.`);
            break;
        }

        const zapId = limparTelefone(lead.tel);
        if(!zapId) continue; 
        
        const jaFoiContatado = contatados.some(c => c.telLimpo === zapId);
        if(jaFoiContatado) continue;

        // Nome curto para tratamento
        const nomeCurto = lead.nome.split(/[-|]/)[0].trim(); 
        
        const mensagemCopy = 
`Olá, tudo bem? 🐾 Sou da equipe da Otimiza FarmaVet.

Estamos lançando a campanha *"Vet em casa e agora no seu condomínio"* e gostaria de falar com o responsável por parcerias ou benefícios aos condomínios da rede de vocês.

Oferecemos campanhas de Vacinação Veterinária em Domicílio sem custo algum para a administradora. Com quem consigo falar sobre isso para apresentar rapidinho?`;

        console.log(`\n🎯 [Disparo ${enviosLocais+1}/${MAX_ENVIOS_DIA}] -> Lead: ${nomeCurto}`);
        
        try {
            await delayAleatorio();
            
            await client.sendMessage(zapId, mensagemCopy); 
            console.log(`  ✔️ Sucesso! Mensagem enviada.`);
            
            // Salvar no Banco
            contatados.push({
                nome: lead.nome,
                telOriginal: lead.tel,
                telLimpo: zapId,
                status: "Quebra-Gelo B2B Enviado",
                data: new Date().toISOString()
            });
            fs.writeFileSync(JSON_CONTATADOS, JSON.stringify(contatados, null, 2));
            
            enviosLocais++;

        } catch(e) {
            console.error(`  ❌ Erro ao enviar para ${nomeCurto}:`, e.message);
        }
    }
    
    console.log("\n🏁 Varredura finalizada.");
    process.exit(0);
});

client.initialize();
