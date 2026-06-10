const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TOKEN = process.env.TOKEN;
const ID_Instagram = process.env.ID_Instagram;

console.log("=== TESTANDO TOKEN E ENDPOINTS DO INSTAGRAM ===");
console.log("ID_Instagram:", ID_Instagram);
console.log("Token (.env):", TOKEN ? TOKEN.substring(0, 15) + "..." : "NÃO DEFINIDO");

async function runTest() {
    // Test 1: Instagram Basic Display API (graph.instagram.com)
    try {
        console.log("\n--- Teste 1: Instagram Basic Display API (graph.instagram.com) ---");
        const res = await axios.get(`https://graph.instagram.com/v19.0/${ID_Instagram}`, {
            params: { fields: 'id,username', access_token: TOKEN }
        });
        console.log("✅ Sucesso em graph.instagram.com:", res.data);
    } catch (err) {
        console.error("❌ Falha em graph.instagram.com:");
        console.error(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }

    // Test 2: Instagram Graph API (graph.facebook.com)
    try {
        console.log("\n--- Teste 2: Instagram Graph API (graph.facebook.com) ---");
        const res = await axios.get(`https://graph.facebook.com/v19.0/${ID_Instagram}`, {
            params: { fields: 'id,username,name', access_token: TOKEN }
        });
        console.log("✅ Sucesso em graph.facebook.com:", res.data);
    } catch (err) {
        console.error("❌ Falha em graph.facebook.com:");
        console.error(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }

    // Test 3: Debug token info (graph.facebook.com/debug_token)
    try {
        console.log("\n--- Teste 3: Depurando Token (graph.facebook.com/debug_token) ---");
        // Using the token itself to debug itself
        const res = await axios.get(`https://graph.facebook.com/debug_token`, {
            params: {
                input_token: TOKEN,
                access_token: TOKEN
            }
        });
        console.log("✅ Sucesso na depuração do token:", res.data);
    } catch (err) {
        console.error("❌ Falha na depuração do token:");
        console.error(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
}

runTest();
