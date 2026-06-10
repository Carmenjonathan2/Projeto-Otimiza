const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dirPath = path.join(__dirname, 'notas_farmavet');
const outputCsv = path.join(__dirname, 'historico_limpo_xlsx.csv');
const outputJson = path.join(__dirname, 'historico_limpo_xlsx.json');

function processarPlanilhas() {
    if (!fs.existsSync(dirPath)) {
        console.error(`A pasta '${dirPath}' não foi encontrada.`);
        return;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.xlsx'));
    
    if (files.length === 0) {
        console.log("Nenhum arquivo .xlsx encontrado.");
        return;
    }

    const historico = [];

    for (const file of files) {
        console.log(`Lendo arquivo: ${file}`);
        const filePath = path.join(dirPath, file);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Carrega interpretando tudo como array (para garantir que leremos as posições exatas)
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        if (data.length < 2) continue;
        
        // As planilhas da SEFAZ/ERP costumam ter os cabeçalhos na linha 2 (index 1) 
        // Dadas as nossas checagens, a coluna 0 é 'Nº', 2 é 'Data', 3 é 'Razão social/Nome'
        // E a última geralmente é a Situação.
        
        for (let i = 2; i < data.length; i++) {
            const row = data[i];
            
            if (!row || row.length === 0) continue;

            const nNF = row[0]; 
            // Ignora linhas de cabeçalho perdidas, rodapés ou somatórios (que não tem numero de NF válido)
            if (!nNF || String(nNF).trim() === '' || isNaN(parseInt(nNF))) continue; 
            
            const status = String(row[row.length - 1] || '').trim().toLowerCase();
            if (status.includes('cancelada') || status.includes('inutilizada')) {
                continue; // Pula notas canceladas como requisitado
            }

            const dataEmissao = row[2]; // Data
            const nomeCliente = row[3]; // Razão social/Nome
            
            historico.push({
                nNF: String(nNF),
                nomeCliente: nomeCliente ? String(nomeCliente) : 'Consumidor Final',
                dataEmissao: dataEmissao ? String(dataEmissao) : 'Sem Data',
                produtos: [], // INFO: As planilhas não possuem essa coluna!
            });
        }
    }

    // ----- SALVAR ARQUIVO JSON -----
    fs.writeFileSync(outputJson, JSON.stringify(historico, null, 2), 'utf-8');
    
    // ----- SALVAR ARQUIVO CSV -----
    if (historico.length > 0) {
        const header = ['Número NF', 'Nome Cliente', 'Data Emissão', 'Produtos (Aviso)'];
        const csvLines = [header.join(';')];
        
        for (const item of historico) {
            const numNf = item.nNF.replace(/"/g, '""');
            const cliente = item.nomeCliente.replace(/"/g, '""');
            const dataEmi = item.dataEmissao.replace(/"/g, '""');
            
            csvLines.push(`"${numNf}";"${cliente}";"${dataEmi}";"NÃO CONSTA NAS PLANILHAS"`);
        }
        
        fs.writeFileSync(outputCsv, '\ufeff' + csvLines.join('\n'), 'utf-8');
    }

    console.log(`\n🎉 Processamento concluído!`);
    console.log(`==========================================`);
    console.log(`Total de arquivos lidos: ${files.length}`);
    console.log(`Total de notas válidas extraídas: ${historico.length}`);
    console.log(`✔️ Arquivo JSON gerado: historico_limpo_xlsx.json`);
    console.log(`✔️ Arquivo CSV gerado: historico_limpo_xlsx.csv`);
    console.log(`\n⚠️  ATENÇÃO: Diferente do XML, estes relatórios em Excel NÃO possuem a lista de produtos comprados em cada nota. Apenas os totais (Capas de Lote).`);
}

processarPlanilhas();
