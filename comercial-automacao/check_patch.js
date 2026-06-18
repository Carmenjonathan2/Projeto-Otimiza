const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'whatsapp-web.js', 'src', 'util', 'Injected', 'Utils.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Show lines 545-560 to confirm the patch is in place
for (let i = 544; i <= 562; i++) {
    console.log(`[${i+1}] ${lines[i]}`);
}
