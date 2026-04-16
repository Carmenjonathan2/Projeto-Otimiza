const fs = require('fs');
const XLSX = require('xlsx');
const https = require('https');

// ============================================
// 1. CONFIGURAÇÕES
// ============================================
const ARQUIVO_VENDAS = 'vendas_vets_e_tutores.json';
const ARQUIVO_CLIENTES = 'relatorio_clientes.xlsx';
const ARQUIVO_HTML = 'painel_aika.html';
const ARQUIVO_RESULTADO = 'disparos_whatsapp_hoje.json';

const TELEGRAM_TOKEN = '8648823461:AAE748hHKu8J7Nbsfevas8lxcu1IQ1wmTlI';
const TELEGRAM_CHAT_IDS = [
    '6823632451', // Carmen Silva
    '868045878'  // Oliveira (Kyenner)
];

const HOJE = new Date();

const REGRAS = {
    VACCINE:          { dias: 365, msg: "Olá, Dr(a). {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. Notamos que faz cerca de 1 ano desde o último pedido de {produtos}. Precisando repor o estoque da clínica, é só nos chamar!" },
    ANTIPARASITIC_1M: { dias: 30,  msg: "Olá, {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. Passando para lembrar que está na hora da nova dose de {produtos}. Podemos separar para você?" },
    ANTIPARASITIC_3M: { dias: 90,  msg: "Olá, {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. A proteção de 3 meses do {produtos} está vencendo. Vamos garantir a continuidade do tratamento?" },
    ANTIPARASITIC_4M: { dias: 120, msg: "Olá, {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. A proteção da coleira {produtos} está chegando ao fim. Podemos reservar a próxima para você?" },
    ANTIPARASITIC_6M: { dias: 180, msg: "Olá, {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. A proteção de 6 meses do {produtos} está chegando ao fim. Que tal garantir a próxima antes de ficar desprotegido?" },
    ANTIPARASITIC_8M: { dias: 240, msg: "Olá, {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. A proteção de 8 meses do {produtos} está chegando ao fim. Vamos renovar a proteção?" },
    CHRONIC:          { dias: 30,  msg: "Olá, {nome}! Aqui é a Aika da Otimiza FarmaVet 🐾. O {produtos} deve estar chegando ao fim. Gostaria que separássemos um novo para você?" },
    // ESTRATÉGIA DE REATIVAÇÃO (CLIENTES DORMINHOCOS)
    SAUDADES: { dias: 120, msg: "Olá, {nome} 🐾 aqui é a Aika! Notei que já faz algum tempo desde a sua última compra e estamos sentindo sua falta. Preparamos um presente de 10% OFF para você, que tal nos fazer uma visita?" }
};

function identificarCategoria(nomeProduto) {
    const p = nomeProduto.toUpperCase();
    
    // 1. Vacinas (Fidelização 12 meses)
    if (p.includes('VACINA') || p.includes('NOBIVAC') || p.includes('RABISIN') || p.includes('VANGUARD') || p.includes('V8') || p.includes('V10')) return 'VACCINE';
    
    // 2. Pulga e Carrapato
    if (p.includes('BRAVECTO')) return 'ANTIPARASITIC_3M';
    if (p.includes('NEXGARD') || p.includes('SIMPARIC') || p.includes('CREDELI') || p.includes('FRONTLINE') || p.includes('REVOLUTION')) return 'ANTIPARASITIC_1M';
    
    // 3. Leishmaniose (Coleiras)
    if (p.includes('SCALIBOR')) return 'ANTIPARASITIC_4M';
    if (p.includes('LEEVRE')) return 'ANTIPARASITIC_6M';
    if (p.includes('FRONTMAX')) return 'ANTIPARASITIC_8M';
    if (p.includes('SERESTO')) return 'ANTIPARASITIC_8M'; // Geralmente 8 meses, mesmo se não trabalhado no momento

    // 4. Medicamentos Crônicos
    if (p.includes('ZELOTRIL') || p.includes('GARDENAL') || p.includes('FENOBARBITAL') || p.includes('CHRONIC')) return 'CHRONIC';
    
    return null;
}

function enviarTelegram(texto) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    TELEGRAM_CHAT_IDS.forEach(chatId => {
        const data = JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' });
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } });
        req.on('error', (e) => console.error(`Erro Telegram (chat ${chatId}):`, e));
        req.write(data);
        req.end();
    });
}

function processarar() {
    console.log('🐾 Aika está aplicando a Estratégia de Fidelização e Reativação...');
    
    if (!fs.existsSync(ARQUIVO_CLIENTES) || !fs.existsSync(ARQUIVO_VENDAS)) return console.error('Arquivos não achados!');

    const workbook = XLSX.readFile(ARQUIVO_CLIENTES);
    const rawClientes = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    const agenda = {}; 
    rawClientes.slice(11).forEach(row => {
        if (row[1]) agenda[row[1].trim().toUpperCase()] = { tel: row[11] || '', isVet: (row[7] && row[7].toString().includes('CRMV')) };
    });

    const vendas = JSON.parse(fs.readFileSync(ARQUIVO_VENDAS, 'utf8'));
    const lembretesRaw = [];
    const ultimasVendasPorCliente = {};

    vendas.forEach(v => {
        const clienteInfo = agenda[v.cliente.trim().toUpperCase()];
        if (!clienteInfo || !clienteInfo.tel) return;

        const [dia, mes, ano] = v.data.split('/');
        const dataVenda = new Date(ano, mes - 1, dia);

        // Guarda a data da venda mais recente DO CLIENTE em geral (para reativação)
        if (!ultimasVendasPorCliente[v.cliente] || dataVenda > ultimasVendasPorCliente[v.cliente].data) {
            ultimasVendasPorCliente[v.cliente] = { 
                data: dataVenda, 
                tel: clienteInfo.tel, 
                name: v.cliente, 
                isVet: clienteInfo.isVet,
                produtos: v.produtos.join(', ') // <--- Agora salvamos o que ele comprou
            };
        }

        v.produtos.forEach(prod => {
            const cat = identificarCategoria(prod);
            if (!cat) return;

            const regra = REGRAS[cat];
            const dataProxima = new Date(dataVenda);
            dataProxima.setDate(dataProxima.getDate() + regra.dias);

            const diff = Math.floor((dataProxima - HOJE) / 86400000);
            if (diff >= -5 && diff <= 10) {
                lembretesRaw.push({ cliente: v.cliente, vencimento: dataProxima, tipo: clienteInfo.isVet ? 'Veterinário' : 'Tutor', produto: prod, categoria: cat, tel: clienteInfo.tel, dataOriginal: dataVenda });
            }
        });
    });

    // --- REATIVAÇÃO DE CLIENTES DORMINHOCOS ---
    Object.keys(ultimasVendasPorCliente).forEach(cli => {
        const ult = ultimasVendasPorCliente[cli];
        const diffDormindo = Math.floor((HOJE - ult.data) / 86400000);

        // Se o cliente comprou há mais de 120 dias e não tem nenhum lembrete de dose agendada
        if (diffDormindo >= 120 && diffDormindo <= 150) {
            const jaTemLembrete = lembretesRaw.some(l => l.cliente === cli);
            if (!jaTemLembrete) {
                lembretesRaw.push({
                    cliente: cli,
                    vencimento: HOJE,
                    tipo: ult.isVet ? 'Veterinário' : 'Tutor',
                    produto: ult.produtos, // <--- Agora trazemos os produtos reais para o painel
                    categoria: 'SAUDADES',
                    tel: ult.tel,
                    dataOriginal: ult.data
                });
            }
        }
    });

    const agrupamento = {};
    lembretesRaw.forEach(l => {
        const chave = `${l.cliente}_${l.categoria}`;
        if (!agrupamento[chave] || l.dataOriginal > agrupamento[chave].dataOriginal) agrupamento[chave] = l;
    });

    const lembretesFinais = Object.values(agrupamento).map(l => {
        const regra = REGRAS[l.categoria];
        const msg = regra.msg.replace('{nome}', l.cliente.split(' ')[0]).replace('{produtos}', l.produto);
        const urlWhats = `https://web.whatsapp.com/send?phone=55${l.tel.replace(/\D/g,'')}&text=${encodeURIComponent(msg)}`;
        
        const msgTelegram = `🐾 *Dose Pendente da Aika!*\n\n👤 *${l.cliente}* (${l.tipo})\n📦 *${l.produto}*\n📅 *Vencimento: ${l.vencimento.toLocaleDateString('pt-BR')}*\n\n📲 [Enviar no WhatsApp](${urlWhats})`;
        enviarTelegram(msgTelegram);

        return { cliente: l.cliente, vencimento: (l.categoria === 'SAUDADES' ? 'Dorminhoco' : l.vencimento.toLocaleDateString('pt-BR')), tipo: l.tipo, produto: l.produto, mensagem: msg, url: urlWhats, cat: l.categoria };
    });

    const htmlTemplate = `<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Painel Aika 🐾</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><style>body{background:#f0f2f5;padding-bottom:50px}.aika-header{background:#ffde59;padding:30px;text-align:center;border-bottom:5px solid #e6c64d}.card-v{border-left:8px solid #007bff}.card-t{border-left:8px solid #28a745}.card-s{border-left:8px solid #dc3545; background: #fff5f5;}.btn-w{background:#25d366;color:white;font-weight:bold;transition:0.3s}.btn-w:hover{background:#128c7e;color:white;transform:scale(1.02)}</style></head><body><div class="aika-header mb-5"><h1>🐾 Painel de Envios da Aika</h1><p>Notificações enviadas para o Telegram do Jonathas!</p></div><div class="container"><div class="row" id="root"></div></div><script>const data = ${JSON.stringify(lembretesFinais)};const root = document.getElementById('root');if(data.length===0){root.innerHTML="<h3>🐾 Nenhum envio pendente hoje!</h3>"}else{data.forEach(l=>{root.innerHTML+=\`<div class="col-md-4 mb-4"><div class="card p-3 h-100 \${l.cat==='SAUDADES'?'card-s':(l.tipo==='Veterinário'?'card-v':'card-t')} shadow-sm"><div class="d-flex justify-content-between"><span class="badge \${l.cat==='SAUDADES'?'bg-danger':(l.tipo==='Veterinário'?'bg-primary':'bg-success')}">\${l.cat==='SAUDADES'?'SAUDADES 💔':l.tipo}</span><small>\${l.vencimento}</small></div><h5 class="mt-2">\${l.cliente}</h5><p class="small text-muted">\${l.produto}</p><div class="p-2 bg-light mb-3" style="font-size:0.9rem;border-radius:5px;font-style:italic">"\${l.mensagem}"</div><a href="\${l.url}" target="_blank" class="btn btn-w mt-auto">Enviar WhatsApp</a></div></div>\`})}<\/script></body></html>`;

    fs.writeFileSync(ARQUIVO_RESULTADO, JSON.stringify(lembretesFinais, null, 2));
    fs.writeFileSync(ARQUIVO_HTML, htmlTemplate);
    console.log(`✅ Processo Finalizado! Painel gerado com ${lembretesFinais.length} disparos. Reativação incluída!`);
}

processarar();
