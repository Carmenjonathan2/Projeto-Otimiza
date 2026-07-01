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

async function testFilters() {
    try {
        console.log("1. Buscando 1 página de clientes padrão...");
        const resList = await axios.get(`${BASE_URL}/clientes?limit=5`, { headers });
        const list = resList.data.data || [];
        if (list.length === 0) {
            console.log("Nenhum cliente cadastrado.");
            return;
        }
        const c = list[0];
        console.log(`Cliente de teste: Nome="${c.nome}", Celular="${c.celular}", Telefone="${c.telefone}"`);

        // Testar filtros
        if (c.celular) {
            const cleanCel = c.celular.replace(/\D/g, '');
            console.log(`\n2. Testando filtro celular=${cleanCel}...`);
            const resCel = await axios.get(`${BASE_URL}/clientes?celular=${cleanCel}`, { headers });
            console.log(`Encontrados com celular: ${resCel.data.data?.length || 0}`);
            
            console.log(`\n3. Testando filtro telefone=${cleanCel}...`);
            const resTel = await axios.get(`${BASE_URL}/clientes?telefone=${cleanCel}`, { headers });
            console.log(`Encontrados com telefone: ${resTel.data.data?.length || 0}`);

            console.log(`\n3b. Testando filtro telefone com número inexistente '00000000000'...`);
            const resTelFake = await axios.get(`${BASE_URL}/clientes?telefone=00000000000`, { headers });
            console.log(`Encontrados com telefone inexistente: ${resTelFake.data.data?.length || 0}`);

            console.log(`\n4. Testando filtro search=${cleanCel}...`);
            const resSearch = await axios.get(`${BASE_URL}/clientes?search=${cleanCel}`, { headers });
            console.log(`Encontrados com search: ${resSearch.data.data?.length || 0}`);
        }

        console.log(`\n5. Testando filtro nome=${c.nome}...`);
        const resNome = await axios.get(`${BASE_URL}/clientes?nome=${encodeURIComponent(c.nome)}`, { headers });
        console.log(`Encontrados com nome: ${resNome.data.data?.length || 0}`);

    } catch (e) {
        console.error("❌ Erro no teste de busca:", e.message, e.response?.data);
    }
}

testFilters();
