require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testImageGen() {
    console.log("Teste de geração de imagem com a SDK...");
    try {
        const model3 = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
        const result3 = await model3.generateContent("A cute dog in the park");
        console.log("Resultado com gemini-2.5-flash-image:");
        const parts = result3.response.candidates[0].content.parts;
        console.log(JSON.stringify(parts, null, 2));
        
        // Let's check if it has inlineData
        if (parts[0] && parts[0].inlineData) {
            console.log("Found inlineData length:", parts[0].inlineData.data.length);
        } else if (parts[0] && parts[0].text) {
            console.log("Found text length:", parts[0].text.length);
        }
    } catch(e2) {
        console.error("Erro secundário:", e2.message);
    }
}

testImageGen();
