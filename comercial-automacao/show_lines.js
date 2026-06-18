const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'whatsapp-web.js', 'src', 'util', 'Injected', 'Utils.js');
if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('canCheckStatusRanking')) {
            console.log(`Line ${i + 1}: ${lines[i].trim()}`);
            // Print context
            for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 10); j++) {
                console.log(`[${j + 1}] ${lines[j]}`);
            }
        }
    }
} else {
    console.log("File not found:", filePath);
}
