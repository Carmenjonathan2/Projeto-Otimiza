const axios = require('axios');

async function testGupy() {
    // Tentativa 1: portal.gupy.io api/v1/jobs
    // URL usada no portal público da Gupy para busca de vagas
    const url = 'https://portal.gupy.io/api/v1/jobs?name=suporte&limit=10';
    console.log("Fetching: " + url);
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log("Success! Data keys:", Object.keys(response.data));
        console.log("Total jobs returned:", response.data.data ? response.data.data.length : 0);
        if (response.data.data && response.data.data.length > 0) {
            console.log("First job name:", response.data.data[0].name);
            console.log("First job company:", response.data.data[0].careerPageName);
            console.log("First job code:", response.data.data[0].id);
        }
    } catch (e) {
        console.error("Error Fetching Gupy:", e.message);
    }
}

testGupy();
