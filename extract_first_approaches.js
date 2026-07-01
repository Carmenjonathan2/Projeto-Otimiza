const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, '1-Farmacia-Ecommerce/6-Comercial-Operacoes/dados_comercial/conversas_leitura_2026-05-20.txt');

if (!fs.existsSync(logPath)) {
    console.error("Arquivo não encontrado:", logPath);
    process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

let currentChat = '';
let messages = [];

console.log("=== ANÁLISE DE PRIMEIRAS ABORDAGENS DA LOJA ===");

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('CONVERSA:')) {
        currentChat = line;
        messages = [];
    } else if (line.match(/^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/)) {
        messages.push(line);
        // Se for a primeira ou segunda mensagem da loja na conversa
        if (messages.length <= 5 && line.includes('LOJA:')) {
            let msgContent = '';
            let j = i + 1;
            while (j < lines.length && !lines[j].trim().startsWith('CONVERSA:') && !lines[j].trim().match(/^\[\d{2}\/\d{2}\/\d{4}/)) {
                msgContent += lines[j].trim() + ' ';
                j++;
            }
            if (msgContent.trim().length > 0) {
                console.log(`\nChat: ${currentChat}`);
                console.log(`Msg LOJA: "${msgContent.trim()}"`);
            }
        }
    }
}
