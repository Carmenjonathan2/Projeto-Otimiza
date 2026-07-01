const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TOKEN = process.env.TOKEN;
const ID_Instagram = process.env.ID_Instagram;

console.log("Checking Instagram Token in .env...");
console.log("Token length:", TOKEN ? TOKEN.length : 0);
console.log("Token prefix:", TOKEN ? TOKEN.substring(0, 15) : "N/A");
console.log("Instagram User ID:", ID_Instagram);

if (!TOKEN || !ID_Instagram) {
    console.error("❌ TOKEN or ID_Instagram missing from .env");
    process.exit(1);
}

axios.get(`https://graph.instagram.com/me`, {
    params: {
        fields: 'id,username,name',
        access_token: TOKEN
    }
})
.then(res => {
    console.log("✅ TOKEN IS VALID!");
    console.log("Account Info:", res.data);
})
.catch(err => {
    console.error("❌ TOKEN IS INVALID OR EXPIRED!");
    if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Error Detail:", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error("Error Message:", err.message);
    }
});
