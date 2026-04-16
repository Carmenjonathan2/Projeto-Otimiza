const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function list() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no listModels in the SDK for JS easily accessible this way usually,
    // we'd used the REST API or another package, but we can try to find one.
    // Actually, let's try 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    try {
        const result = await model.generateContent("hello");
        console.log("gemini-1.5-flash-latest success!");
    } catch (e) {
        console.log("gemini-1.5-flash-latest failed:", e.message);
    }
}
list();
