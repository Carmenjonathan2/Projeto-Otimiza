const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN;
const BASE_URL = "https://api.gestaoclick.com";

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

const MAX_PAGES = 15;
const PER_PAGE = 100;

// Helper to check if a product is a vaccine
function isVaccine(name) {
    const n = name.toLowerCase();
    return n.includes('vacina') || 
           n.includes('nobivac') || 
           n.includes('recombitek') || 
           n.includes('giardiavax') || 
           n.includes('vanguard') || 
           n.includes('dhppi') || 
           n.includes('bronchiguard') ||
           n.includes('rabisin') ||
           n.includes('leish-tec');
}

// Helper to extract CRMV from client fields
function extrairCrmv(c) {
    let crmv = c.crmv || null;
    if (!crmv && c.rg && c.rg.toLowerCase().includes('crmv')) {
        const match = c.rg.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    if (!crmv && c.inscricao_municipal && c.inscricao_municipal.toLowerCase().includes('crmv')) {
        const match = c.inscricao_municipal.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    if (!crmv && c.responsavel && c.responsavel.toLowerCase().includes('crmv')) {
        const match = c.responsavel.match(/crmv\D*(\d+)/i);
        if (match) crmv = match[1];
    }
    return crmv;
}

async function runBuyerAnalysis() {
    console.log(`🚀 [ANALISE] Carregando cadastro de clientes do GestãoClick...`);
    
    // 1. Fetch all clients to build contact details map
    const clientsMap = {};
    let clientPage = 1;
    let keepClients = true;
    
    while (keepClients && clientPage <= 15) {
        try {
            console.log(`📡 Buscando página ${clientPage} de clientes...`);
            const response = await axios.get(`${BASE_URL}/clientes?limit=100&page=${clientPage}`, { headers });
            const list = response.data && response.data.data ? response.data.data : [];
            
            if (list.length === 0) {
                keepClients = false;
                break;
            }
            
            list.forEach(c => {
                clientsMap[c.id] = {
                    celular: c.celular || 'N/A',
                    telefone: c.telefone || 'N/A',
                    email: c.email || 'N/A',
                    crmv: extrairCrmv(c) || 'N/A',
                    tags: c.tags || ''
                };
            });
            
            if (list.length < 100) {
                keepClients = false;
                break;
            }
            
            clientPage++;
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`❌ Erro ao buscar clientes na página ${clientPage}:`, e.message);
            keepClients = false;
        }
    }
    
    console.log(`✅ Cadastro de ${Object.keys(clientsMap).length} clientes carregado na memória.`);
    
    // 2. Fetch sales history
    let allSales = [];
    let page = 1;
    let keepSales = true;
    
    console.log(`\n🚀 [ANALISE] Carregando histórico de vendas...`);
    while (keepSales && page <= MAX_PAGES) {
        try {
            console.log(`📡 Buscando página ${page} de vendas...`);
            const response = await axios.get(`${BASE_URL}/vendas?limit=${PER_PAGE}&page=${page}`, { headers });
            const salesPage = response.data && response.data.data ? response.data.data : [];
            
            if (salesPage.length === 0) {
                keepSales = false;
                break;
            }
            
            allSales.push(...salesPage);
            
            if (salesPage.length < PER_PAGE) {
                keepSales = false;
                break;
            }
            
            page++;
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`❌ Erro ao buscar vendas na página ${page}:`, e.message);
            keepSales = false;
        }
    }
    
    console.log(`✅ Adicionadas ${allSales.length} vendas no total.`);
    
    // Filter active sales
    const activeSales = allSales.filter(v => {
        const sit = (v.nome_situacao || '').toLowerCase();
        return !sit.includes('cancelad') && !sit.includes('excluid');
    });
    
    // 3. Group vaccine purchases by customer
    const buyers = {};
    
    activeSales.forEach(venda => {
        const clienteId = venda.cliente_id;
        const nomeCliente = venda.nome_cliente ? venda.nome_cliente.trim() : 'N/A';
        const dataVenda = venda.data; // e.g. "2026-06-17"
        
        const produtos = venda.produtos || [];
        
        produtos.forEach(pObj => {
            const prod = pObj.produto;
            if (prod && prod.nome_produto && isVaccine(prod.nome_produto)) {
                const nomeProd = prod.nome_produto.trim();
                const qtd = parseFloat(prod.quantidade) || 0;
                const totalVal = parseFloat(prod.valor_total) || 0;
                
                if (!buyers[clienteId]) {
                    buyers[clienteId] = {
                        id: clienteId,
                        nome: nomeCliente,
                        doses: 0,
                        faturamento: 0,
                        compras: [],
                        produtos: {}
                    };
                }
                
                buyers[clienteId].doses += qtd;
                buyers[clienteId].faturamento += totalVal;
                
                // Track products breakdown
                buyers[clienteId].produtos[nomeProd] = (buyers[clienteId].produtos[nomeProd] || 0) + qtd;
                
                // Track this transaction date
                if (!buyers[clienteId].compras.includes(dataVenda)) {
                    buyers[clienteId].compras.push(dataVenda);
                }
            }
        });
    });
    
    const today = new Date("2026-06-17"); // Using execution context date
    const buyersList = Object.values(buyers);
    
    // 4. Calculate metrics and profile for each buyer
    buyersList.forEach(b => {
        // Sort purchase dates
        b.compras.sort((a, b) => new Date(a) - new Date(b));
        
        b.primeiraCompra = b.compras[0];
        b.ultimaCompra = b.compras[b.compras.length - 1];
        
        const diffTime = Math.abs(today - new Date(b.ultimaCompra));
        b.diasSemComprar = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate average purchase interval (frequency)
        if (b.compras.length > 1) {
            const first = new Date(b.primeiraCompra);
            const last = new Date(b.ultimaCompra);
            const totalDays = Math.ceil(Math.abs(last - first) / (1000 * 60 * 60 * 24));
            b.intervaloMedio = (totalDays / (b.compras.length - 1)).toFixed(1);
        } else {
            b.intervaloMedio = 'Compra Única';
        }
        
        // Determine Profile/Status based on recency and frequency
        if (b.diasSemComprar <= 60) {
            if (b.compras.length >= 3) {
                b.status = 'Super Ativo';
            } else {
                b.status = 'Ativo';
            }
        } else if (b.diasSemComprar <= 120) {
            b.status = 'Resfriando';
        } else {
            if (b.compras.length === 1) {
                b.status = 'Compra Única Antiga';
            } else {
                b.status = 'Inativo / Churn';
            }
        }
        
        // Enrich with contact details from clientsMap
        const contacts = clientsMap[b.id] || { celular: 'N/A', telefone: 'N/A', email: 'N/A', crmv: 'N/A', tags: '' };
        b.celular = contacts.celular;
        b.telefone = contacts.telefone;
        b.email = contacts.email;
        b.crmv = contacts.crmv;
        b.tags = contacts.tags;
    });
    
    // Sort buyers by total doses purchased (descending)
    buyersList.sort((a, b) => b.doses - a.doses);
    
    // 5. Generate Markdown Report
    let md = `# 🎯 Lead List - Potenciais Assinantes de Vacinas (Veterinários Volantes)\n\n`;
    md += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n`;
    md += `*Análise com base nas últimas 1.500 transações e cadastro completo de clientes.*\n\n`;
    
    md += `> [!TIP]\n`;
    md += `> Este relatório agrupa veterinários e clínicas que já compram vacinas da Otimiza. Ele indica **quem**, **o que** e **com que frequência** compram, permitindo ofertar planos de assinatura personalizados (ex: reposição programada de vacinas com desconto progressivo no volume).\n\n`;
    
    md += `## 📊 Métricas de Compradores de Vacina\n`;
    const totalBuyers = buyersList.length;
    const superAtivos = buyersList.filter(b => b.status === 'Super Ativo').length;
    const ativos = buyersList.filter(b => b.status === 'Ativo').length;
    const resfriando = buyersList.filter(b => b.status === 'Resfriando').length;
    const inativos = buyersList.filter(b => b.status === 'Inativo / Churn' || b.status === 'Compra Única Antiga').length;
    
    md += `- **Total de Clientes que já Compraram Vacinas:** ${totalBuyers}\n`;
    md += `- **Clientes Super Ativos (compraram nos últimos 60 dias, >= 3 compras):** ${superAtivos}\n`;
    md += `- **Clientes Ativos (compraram nos últimos 60 dias, < 3 compras):** ${ativos}\n`;
    md += `- **Clientes Resfriando (sem compras há 61-120 dias - Alerta de Churn):** ${resfriando}\n`;
    md += `- **Clientes Inativos/Perdidos (sem compras há mais de 120 dias):** ${inativos}\n\n`;
    
    md += `## 🏆 Lista de Contatos e Histórico de Compras\n`;
    md += `*Ordenado pelo volume total de doses compradas (Indicadores de Veterinários de Alta Demanda)*\n\n`;
    
    md += `| Rank | Cliente | CRMV | Perfil | Doses Totais | Gasto Total | Última Compra | Dias Inativo | Frequência Média | Contato | E-mail |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |\n`;
    
    buyersList.forEach((b, idx) => {
        const contatoVal = b.celular !== 'N/A' ? b.celular : b.telefone;
        const gastoFmt = `R$ ${b.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const dataFmt = b.ultimaCompra.split('-').reverse().join('/');
        const freqVal = b.intervaloMedio === 'Compra Única' ? 'Única' : `${b.intervaloMedio} dias`;
        
        md += `| ${idx + 1} | ${b.nome} | ${b.crmv} | **${b.status}** | ${b.doses.toFixed(0)} | ${gastoFmt} | ${dataFmt} | ${b.diasSemComprar} | ${freqVal} | ${contatoVal} | ${b.email} |\n`;
    });
    
    md += `\n\n## 💡 Como Usar Estes Dados para Vender a Assinatura (Estratégia GIO)\n\n`;
    
    md += `### 1. Oferta para o Grupo "Super Ativo" (Top Leads)\n`;
    md += `- **Quem são:** Veterinários como **${buyersList[0]?.nome || 'N/A'}** e **${buyersList[1]?.nome || 'N/A'}** que compram com altíssima frequência.\n`;
    md += `- **Estratégia:** Foco em **conveniência financeira e de logística**. Veterinários volantes não têm espaço para estocar muito e não querem ficar sem estoque no meio da semana. Ofereça uma assinatura onde eles garantem um preço promocional fixo por dose (ex: Nobivac V8 a preço de atacado) com entregas fracionadas semanais ou quinzenais automáticas.\n\n`;
    
    md += `### 2. Campanha de Reativação para o Grupo "Resfriando" & "Inativo"\n`;
    md += `- **Quem são:** Clientes com status **Resfriando** ou **Inativo / Churn**.\n`;
    md += `- **Estratégia:** Eles já conhecem a Otimiza, mas pararam de comprar (talvez por irem para a concorrência ou flutuação de demanda). Faça um contato consultivo informando que a Otimiza agora tem o **"Clube de Assinatura de Vacinas Otimiza para Veterinários Volantes"**, onde na primeira entrega da assinatura eles ganham uma caixa térmica de transporte ou gelox reutilizável grátis, além de frete grátis nas primeiras 3 entregas programadas.\n\n`;
    
    md += `### 3. Argumento de Vendas para Volantes (Script Recomendado)\n`;
    md += `> *"Olá [Nome do Veterinário], tudo bem? Vimos que você costuma repor suas vacinas conosco. Sabemos que a rotina de veterinário volante é corrida e exige que as vacinas estejam sempre frescas e na temperatura ideal. Para facilitar, lançamos a Assinatura de Vacinas: você define quantas Nobivac V8 ou Raiva precisa por mês, garantimos o preço promocional de lote fechado, e entregamos fracionado de acordo com a sua agenda de atendimento. Assim, você não imobiliza capital de giro em estoque grande e não corre o risco de faltar vacina para os seus clientes. Vamos fechar o seu cronograma para este mês?"*\n`;
    
    const outputPathArg = process.argv[2];
    const defaultOutputPath = path.join(__dirname, '..', 'relatorio_compradores_vacinas.md');
    const finalOutputPath = outputPathArg || defaultOutputPath;
    
    fs.writeFileSync(finalOutputPath, md, 'utf-8');
    
    console.log(`\n🎉 [CONCLUIDO] Análise de compradores de vacina concluída!`);
    console.log(`📄 Relatório gerado em: ${finalOutputPath}`);
    console.log(`👥 Total de compradores identificados: ${totalBuyers}`);
}

runBuyerAnalysis().catch(e => {
    console.error('❌ Falha na execução da análise de compradores:', e);
    process.exit(1);
});
