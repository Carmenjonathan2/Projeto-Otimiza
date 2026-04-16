const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function run() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    if (data.models) {
        const names = data.models.map(m => m.name);
        console.log("Model names:", names.join("\\n"));
    } else {
        console.log("Error or no models format:", data);
    }
}
run();
