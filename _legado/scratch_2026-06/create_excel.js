const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', '1-Farmacia-Ecommerce', 'Manual-Semanal', 'calendario_posts_pinterest.json');
const excelPath = path.join(__dirname, '..', '1-Farmacia-Ecommerce', 'Manual-Semanal', 'calendario_posts_pinterest.xlsx');
const devExcelPath = path.join(__dirname, '..', '1-Farmacia-Ecommerce', 'projeto-pinterest', 'calendario_posts_pinterest.xlsx');

function main() {
    if (!fs.existsSync(jsonPath)) {
        console.error(`[ERROR] JSON path not found: ${jsonPath}`);
        return;
    }

    const posts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`[OK] Loaded ${posts.length} posts for Excel generation.`);

    // 1. Format Sheet 1 (Agendamento Buffer)
    const sheet1Data = posts.map(post => ({
        "text": post.titulo_pin,
        "image_url": post.image_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
        "board_name": "Dicas tutores",
        "tags": "",
        "posting_time": post.posting_time,
        "title": post.titulo_pin,
        "description": post.descricao_pin,
        "alt_text": post.titulo_pin,
        "link": post.whatsapp_link
    }));
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data);

    // 2. Format Sheet 2 (JSON Infograficos)
    const sheet2Data = posts.map(post => {
        const info = post.infographic_data || {};
        return {
            "Tema / Título": (info.header && info.header.title) ? info.header.title : post.titulo_pin,
            "Categoria": (info.header && info.header.category) ? info.header.category : "",
            "Horário": post.posting_time,
            "Estrutura JSON do Infográfico": JSON.stringify(info, null, 2)
        };
    });
    const ws2 = XLSX.utils.json_to_sheet(sheet2Data);

    // 3. Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Agendamento Buffer");
    XLSX.utils.book_append_sheet(wb, ws2, "JSON Infograficos");

    // 4. Save file
    XLSX.writeFile(wb, excelPath);
    console.log(`[OK] Excel saved in Manual-Semanal: ${excelPath}`);

    // Also copy to development directory
    XLSX.writeFile(wb, devExcelPath);
    console.log(`[OK] Excel saved in development folder: ${devExcelPath}`);
}

main();
