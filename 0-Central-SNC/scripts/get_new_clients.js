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

// Target date ranges (3 months ago from today, June 29, 2026)
const CUTOFF_DATE = new Date("2026-03-29T00:00:00");
const TODAY = new Date("2026-06-29T23:59:59");

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

async function getNewClients() {
    console.log(`🚀 [ANALISE] Buscando novos clientes cadastrados desde ${CUTOFF_DATE.toLocaleDateString('pt-BR')}...`);
    
    if (!ACCESS_TOKEN || !SECRET_TOKEN) {
        console.error('❌ Credenciais do GestãoClick não encontradas no arquivo .env.');
        process.exit(1);
    }

    let newClients = [];
    let page = 1;
    let keepFetching = true;

    while (keepFetching) {
        try {
            console.log(`📡 Buscando página ${page} de novos clientes...`);
            const url = `${BASE_URL}/clientes?limit=100&page=${page}&ordenacao=cadastrado_em&direcao=desc`;
            const response = await axios.get(url, { headers });
            const list = response.data && response.data.data ? response.data.data : [];
            
            if (list.length === 0) {
                console.log('ℹ️ Sem mais registros.');
                break;
            }

            for (const c of list) {
                if (!c.cadastrado_em) continue;
                
                // GestãoClick format is "YYYY-MM-DD HH:MM:SS"
                const registrationDate = new Date(c.cadastrado_em.replace(' ', 'T'));
                
                if (registrationDate >= CUTOFF_DATE && registrationDate <= TODAY) {
                    newClients.push({
                        id: c.id,
                        nome: c.nome ? c.nome.trim() : 'N/A',
                        razao_social: c.razao_social ? c.razao_social.trim() : 'N/A',
                        cnpj_cpf: c.cnpj || c.cpf || 'N/A',
                        telefone: c.celular || c.telefone || 'N/A',
                        email: c.email || 'N/A',
                        crmv: extrairCrmv(c) || 'N/A',
                        cadastrado_em: c.cadastrado_em
                    });
                } else if (registrationDate < CUTOFF_DATE) {
                    console.log(`ℹ️ Encontrado cliente antigo cadastrado em ${c.cadastrado_em} (antes do limite de ${CUTOFF_DATE.toLocaleDateString('pt-BR')}). Parando a busca.`);
                    keepFetching = false;
                    break;
                }
            }

            if (list.length < 100) {
                console.log('ℹ️ Fim dos registros da API.');
                break;
            }

            page++;
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
            console.error(`❌ Erro ao buscar clientes na página ${page}:`, e.message);
            keepFetching = false;
        }
    }

    console.log(`\n🎉 [CONCLUIDO] Total de novos clientes encontrados: ${newClients.length}`);

    // Grouping by calendar month
    const monthlyGroups = {
        'Junho/2026': [],
        'Maio/2026': [],
        'Abril/2026': [],
        'Março/2026': []
    };

    newClients.forEach(c => {
        const dateStr = c.cadastrado_em; // "YYYY-MM-DD HH:MM:SS"
        const month = parseInt(dateStr.substring(5, 7));
        const year = parseInt(dateStr.substring(0, 4));

        if (year === 2026) {
            if (month === 6) monthlyGroups['Junho/2026'].push(c);
            else if (month === 5) monthlyGroups['Maio/2026'].push(c);
            else if (month === 4) monthlyGroups['Abril/2026'].push(c);
            else if (month === 3) monthlyGroups['Março/2026'].push(c);
        }
    });

    // Generate Markdown report
    let md = `# 📈 Relatório de Novos Clientes - GestãoClick\n\n`;
    md += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n`;
    md += `*Período Analisado: ${CUTOFF_DATE.toLocaleDateString('pt-BR')} a ${TODAY.toLocaleDateString('pt-BR')} (Últimos 3 meses)*\n\n`;

    md += `## 📊 Indicadores Gerais\n`;
    md += `| Período | Novos Clientes | % do Total |\n`;
    md += `| :--- | :---: | :---: |\n`;
    md += `| **Junho/2026** | ${monthlyGroups['Junho/2026'].length} | ${(monthlyGroups['Junho/2026'].length / newClients.length * 100).toFixed(1)}% |\n`;
    md += `| **Maio/2026** | ${monthlyGroups['Maio/2026'].length} | ${(monthlyGroups['Maio/2026'].length / newClients.length * 100).toFixed(1)}% |\n`;
    md += `| **Abril/2026** | ${monthlyGroups['Abril/2026'].length} | ${(monthlyGroups['Abril/2026'].length / newClients.length * 100).toFixed(1)}% |\n`;
    md += `| **Março/2026 (a partir do dia 29)** | ${monthlyGroups['Março/2026'].length} | ${(monthlyGroups['Março/2026'].length / newClients.length * 100).toFixed(1)}% |\n`;
    md += `| **TOTAL** | **${newClients.length}** | **100.00%** |\n\n`;

    md += `## 👥 Detalhe dos Clientes Novos\n`;
    md += `*Lista de clientes cadastrados nos últimos 3 meses, ordenada do mais recente para o mais antigo.*\n\n`;
    md += `| Rank | Cliente | Razão Social | CRMV | Data Cadastro | Contato | E-mail |\n`;
    md += `| :---: | :--- | :--- | :---: | :---: | :--- | :--- |\n`;

    newClients.forEach((c, idx) => {
        const dateFmt = c.cadastrado_em.split(' ')[0].split('-').reverse().join('/');
        md += `| ${idx + 1} | ${c.nome} | ${c.razao_social !== 'N/A' ? c.razao_social : '-'} | ${c.crmv} | ${dateFmt} | ${c.telefone} | ${c.email} |\n`;
    });

    const outputPathArg = process.argv[2];
    const defaultOutputPath = path.join(__dirname, '..', 'relatorio_novos_clientes.md');
    const finalOutputPath = outputPathArg || defaultOutputPath;

    fs.writeFileSync(finalOutputPath, md, 'utf-8');

    console.log(`📄 Relatório gerado com sucesso em: ${finalOutputPath}`);
    console.log(`- Junho: ${monthlyGroups['Junho/2026'].length}`);
    console.log(`- Maio: ${monthlyGroups['Maio/2026'].length}`);
    console.log(`- Abril: ${monthlyGroups['Abril/2026'].length}`);
    console.log(`- Março (fim): ${monthlyGroups['Março/2026'].length}`);
}

getNewClients().catch(e => {
    console.error('❌ Falha ao buscar novos clientes:', e);
    process.exit(1);
});
