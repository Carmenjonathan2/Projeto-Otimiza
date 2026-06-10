const xlsx = require('xlsx');
const path = require('path');

const files = ['relatorio_vendas.xlsx', 'relatorio_produtos_vendidos.xlsx'];

for (const f of files) {
  console.log(`\n==========================================`);
  console.log(`Lendo arquivo: ${f}`);
  try {
    const filePath = path.join(__dirname, 'notas_farmavet', f);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length > 2) {
        console.log("Linha 1:", data[0]);
        console.log("Cabecalho:", data[1]);
        console.log("Exemplo de Dado:", data[2]);
    } else {
        console.log("Arquivo muito pequeno", data);
    }
  } catch (err) {
    console.error(`Erro ao ler ${f}:`, err.message);
  }
}
