const axios = require('axios');
const path = require('path');
const qs = require('qs');

// Carrega as variáveis de ambiente a partir da raiz do projeto (.env)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;

async function requestToken(url, clientId, clientSecret, scope) {
    const payload = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    };
    if (scope) {
        payload.scope = scope;
    }

    const response = await axios({
        method: 'post',
        url: url,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify(payload)
    });
    return response.data;
}

async function testUberAuth() {
    console.log("=================================================");
    console.log("🧪 INICIANDO TESTE DE AUTENTICAÇÃO UBER DIRECT");
    console.log(`Client ID: ${UBER_CLIENT_ID ? UBER_CLIENT_ID.substring(0, 6) + '...' + UBER_CLIENT_ID.substring(UBER_CLIENT_ID.length - 4) : 'NÃO DEFINIDO'}`);
    console.log(`Client Secret: ${UBER_CLIENT_SECRET ? UBER_CLIENT_SECRET.substring(0, 4) + '...' + UBER_CLIENT_SECRET.substring(UBER_CLIENT_SECRET.length - 4) : 'NÃO DEFINIDO'}`);
    console.log("=================================================\n");

    if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
        console.error("❌ ERRO: UBER_CLIENT_ID ou UBER_CLIENT_SECRET não configurados no arquivo .env");
        process.exit(1);
    }

    const urls = [
        'https://auth.uber.com/oauth/v2/token',
        'https://login.uber.com/oauth/v2/token'
    ];

    const scopes = ['eats.deliveries', 'delivery'];

    console.log("--- TESTE 1: Validando com as chaves do .env ---");
    for (const url of urls) {
        console.log(`\n🌐 Testando endpoint: ${url}`);
        for (const scope of scopes) {
            console.log(`🔑 Tentando escopo: "${scope}"...`);
            try {
                const tokenData = await requestToken(url, UBER_CLIENT_ID, UBER_CLIENT_SECRET, scope);
                console.log(`✅ AUTENTICAÇÃO BEM-SUCEDIDA!`);
                console.log(`Access Token obtido (abreviado): ${tokenData.access_token.substring(0, 15)}...`);
                console.log(`Expira em: ${tokenData.expires_in} segundos`);
                console.log(`Escopo concedido: ${tokenData.scope}`);
                return; // Sucesso absoluto!
            } catch (error) {
                console.error(`❌ Falha com escopo "${scope}":`);
                if (error.response) {
                    console.error(`Status: ${error.response.status}`);
                    console.error('Resposta de erro:', JSON.stringify(error.response.data, null, 2));
                } else {
                    console.error(`Erro: ${error.message}`);
                }
            }
        }
    }

    console.log("\n--- TESTE 2: Validando comportamento com CHAVES DUMMY (Inválidas) ---");
    const dummyClientId = "Kam_Fkwva2sNiosZGfMoH50fERsHTREk_DUMMY";
    const dummyClientSecret = "YG4NcOBppcfNgiOT5GmDyxyUCUc71RMkGGmaO1Tr_DUMMY";
    
    for (const url of urls) {
        console.log(`\n🌐 Testando endpoint com chaves dummy: ${url}`);
        try {
            await requestToken(url, dummyClientId, dummyClientSecret, 'eats.deliveries');
            console.log(`⚠️ Alerta: Conseguiu autenticar com chaves dummy?! (Estranho)`);
        } catch (error) {
            console.log(`✅ Resposta esperada de chaves dummy:`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log('Resposta de erro:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.log(`Erro: ${error.message}`);
            }
        }
    }
}

testUberAuth();

