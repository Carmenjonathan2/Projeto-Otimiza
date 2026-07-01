const axios = require('axios');

async function test() {
    try {
        console.log("Fazendo requisição para a raiz da URL de produção...");
        const res = await axios.get("https://projeto-otimiza-production.up.railway.app/status");
        console.log("Resposta raiz:", res.status, res.data);
    } catch (e) {
        console.error("Erro raiz:", e.message, e.response?.data);
    }

    try {
        console.log("\nFazendo POST de teste (vazio) para o webhook do Z-API...");
        const res = await axios.post("https://projeto-otimiza-production.up.railway.app/webhook/zapi", {});
        console.log("Resposta webhook:", res.status, res.data);
    } catch (e) {
        console.error("Erro webhook:", e.message, e.response?.data);
    }
}

test();
