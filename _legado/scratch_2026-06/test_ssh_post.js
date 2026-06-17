const axios = require('axios');

async function testPost() {
    const url = "https://a9e02f48153c4b.lhr.life/webhook/zapi";
    console.log(`Sending mock POST request to new SSH tunnel ${url}...`);
    try {
        const response = await axios.post(url, {
            phone: "5531987936822",
            senderName: "Tutor Teste",
            value: "Olá Aika, gostaria de saber o preço de 1 ampola de Librela",
            fromMe: false
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);
    } catch (e) {
        console.log("❌ POST request failed through SSH tunnel:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
    }
}

testPost();
