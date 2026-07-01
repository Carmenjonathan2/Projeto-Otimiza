const fs = require('fs');
const path = require('path');

function searchModels(dir) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.vscode' && file !== '.pytest_cache') {
                searchModels(fullPath);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.py')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const matches = content.match(/gemini-[a-zA-Z0-9\.\-]+/g);
                    if (matches) {
                        console.log(`Found models in ${fullPath}:`, [...new Set(matches)]);
                    }
                } catch(e) {}
            }
        }
    }
}

searchModels('C:\\Users\\jonat\\OneDrive\\Desktop\\Otimiza');
