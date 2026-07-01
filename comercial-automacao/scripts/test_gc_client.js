const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ACCESS_TOKEN = process.env.GESTAOCLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAOCLICK_SECRET_TOKEN;
const BASE_URL = "https://api.gestaoclick.com";

const headers = {
    'access-token': ACCESS_TOKEN,
    'secret-access-token': SECRET_TOKEN,
    'Content-Type': 'application/json'
};

async function testGC() {
    try {
        console.log("📡 Fetching first client via list endpoint...");
        const res = await axios.get(`${BASE_URL}/clientes?limit=1`, { headers });
        const list = res.data && res.data.data ? res.data.data : [];
        if (list.length > 0) {
            console.log("Keys in client object from list:", Object.keys(list[0]));
            console.log("Sample client from list:", JSON.stringify(list[0], null, 2));
        } else {
            console.log("No clients found in list.");
        }
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

testGC();
