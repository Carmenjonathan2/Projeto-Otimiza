const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-pro"];

    for (const m of models) {
        console.log(`Checking ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hello");
            console.log(`${m} success!`);
        } catch (e) {
            console.log(`${m} failed: ${e.message}`);
        }
    }
}

run();
