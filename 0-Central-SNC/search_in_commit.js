const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\jonat\\.gemini\\antigravity\\brain\\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\\.system_generated\\steps\\366\\content.md';
if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    console.log("Total lines in commit file:", lines.length);
    let found = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('canCheckStatus') || lines[i].includes('canCheck') || lines[i].includes('Gating')) {
            console.log(`Line ${i + 1}: ${lines[i].trim()}`);
            found++;
            if (found < 20) {
                // Print context
                for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
                    console.log(`[${j + 1}] ${lines[j]}`);
                }
                console.log('---');
            }
        }
    }
} else {
    console.log("File not found:", filePath);
}
