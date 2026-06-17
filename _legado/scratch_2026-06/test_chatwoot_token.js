const axios = require('axios');

const TOKEN = "2S9t4gGhGQf3MqsaXrCWNTS4";
const BASE_URL = "https://app.chatwoot.com";

async function testToken() {
    console.log(`Checking token on ${BASE_URL}...`);
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/profile`, {
            headers: {
                'api_access_token': TOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log("✅ Chatwoot Token is VALID!");
        console.log("Profile Data:", {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            accounts: response.data.accounts.map(a => ({ id: a.id, name: a.name, role: a.role }))
        });
    } catch (e) {
        console.log("❌ Chatwoot Token is INVALID on official Cloud:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
    }
}

testToken();
