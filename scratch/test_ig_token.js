const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TOKEN = 'IGAAWy4yCigIRBZAGJTQTkxTndMMGgyRXJXbEtmZA1ZAMNUppSHgtT2xaX2x1cFA3MkVvb3RUT2V1QjZAjVEJBbUdZAQnBRRzcwODlNaU9sWnR1NWJPdmVTQUlsV0YwZA3NGajQxcDQ2eVlEQm1SM0tJTUE2VUxVSzRITkw3VnJvUFE4awZDZD';
const ID_Instagram = process.env.ID_Instagram;

console.log("=== TESTANDO TOKEN DO INSTAGRAM ===");
console.log("ID_Instagram:", ID_Instagram);
console.log("Token a ser testado:", TOKEN.substring(0, 15) + "...");

async function testToken() {
    try {
        console.log("Consultando informações da conta do Instagram...");
        const response = await axios.get(`https://graph.instagram.com/v19.0/${ID_Instagram}`, {
            params: {
                fields: 'id,username,name,biography',
                access_token: TOKEN
            }
        });
        console.log("✅ Token Válido! Detalhes da Conta:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("❌ Falha na validação do token:");
        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

testToken();
