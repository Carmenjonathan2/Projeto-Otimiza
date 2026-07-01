const { env } = require('process');
require('dotenv').config();

async function list() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
        } else {
            console.error("Error from API:", data);
        }
    } catch (e) {
        console.error("Failed to list models:", e.message);
    }
}
list();
