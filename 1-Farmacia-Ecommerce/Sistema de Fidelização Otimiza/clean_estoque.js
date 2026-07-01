const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const jsonPath = path.join(__dirname, 'estoque_extraido_gestaoclick.json');
const outJsonPath = path.join(__dirname, 'estoque_limpo_gestaoclick.json');
const outXlsxPath = path.join(__dirname, 'estoque_limpo_gestaoclick.xlsx');

function limparDados() {
    if (!fs.existsSync(jsonPath)) {
        console.error("Arquivo estoque_extraido_gestaoclick.json não encontrado!");
        return;
    }

    console.log("Reading raw JSON data...");
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    console.log(`Processing ${rawData.length} items...`);
    const cleanData = rawData.map(item => {
        const newItem = {};
        for (const [key, value] of Object.entries(item)) {
            // Clean the key by removing newlines and "Click to sort" info
            let cleanKey = key.split('\n')[0].trim();
            
            // Clean the value (trim whitespaces)
            let cleanValue = typeof value === 'string' ? value.trim() : value;
            
            if (cleanKey.toLowerCase() !== 'ações' && cleanKey !== '') {
                newItem[cleanKey] = cleanValue;
            }
        }
        return newItem;
    });

    // Write clean JSON
    fs.writeFileSync(outJsonPath, JSON.stringify(cleanData, null, 2), 'utf-8');
    console.log(`Saved clean JSON to: ${outJsonPath}`);

    // Write clean Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(cleanData);
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, outXlsxPath);
    console.log(`Saved clean Excel to: ${outXlsxPath}`);
}

limparDados();
