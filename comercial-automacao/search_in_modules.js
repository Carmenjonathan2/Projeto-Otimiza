const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory does not exist: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath, query);
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                console.log(`Found in: ${fullPath}`);
            }
        }
    }
}

const targetDir = path.join(__dirname, 'node_modules', 'whatsapp-web.js');
console.log("Searching in:", targetDir);
searchDir(targetDir, "canCheckStatusRanking");
console.log("Search finished.");
