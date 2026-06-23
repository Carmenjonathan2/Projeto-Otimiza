const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

// Carrega as variáveis de ambiente a partir da raiz do projeto (.env)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.LALAMOVE_API_KEY;
const API_SECRET = process.env.LALAMOVE_API_SECRET;
const BASE_URL = 'https://rest.sandbox.lalamove.com';

if (!API_KEY || !API_SECRET) {
    console.error("❌ ERRO: Credenciais da Lalamove não encontradas no arquivo .env");
    console.error("Por favor, preencha as variáveis LALAMOVE_API_KEY e LALAMOVE_API_SECRET no arquivo .env");
    process.exit(1);
}

/**
 * Gera a assinatura HMAC SHA256 exigida pela Lalamove API v3
 */
function generateSignature(apiSecret, timestamp, method, path, body = '') {
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
    return crypto
        .createHmac('sha256', apiSecret)
        .update(rawSignature)
        .digest('hex');
}

/**
 * Realiza uma chamada HTTP autenticada à API da Lalamove
 */
async function callLalamove(method, path, data = null) {
    const timestamp = Date.now().toString();
    const bodyStr = data ? JSON.stringify(data) : '';
    const signature = generateSignature(API_SECRET, timestamp, method, path, bodyStr);
    const requestId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${API_KEY}:${timestamp}:${signature}`,
        'Market': 'BR', // Mercado Brasil
        'Request-ID': requestId
    };

    console.log(`📡 [LALAMOVE] Chamando ${method} ${path}...`);
    try {
        const config = {
            method,
            url: `${BASE_URL}${path}`,
            headers
        };
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ [LALAMOVE] Erro na requisição: ${error.message}`);
        if (error.response && error.response.data) {
            console.error('Resposta de erro da Lalamove:', JSON.stringify(error.response.data, null, 2));
            if (error.response.data.errors) {
                console.error('Erros detalhados:', error.response.data.errors);
            }
        }
        throw error;
    }
}

async function runTests() {
    console.log("=================================================");
    console.log("🧪 INICIANDO TESTE SANDBOX LALAMOVE (V3)");
    console.log(`Public Key: ${API_KEY}`);
    console.log("=================================================\n");

    try {
        // Teste 1: Buscar informações de Cidades/Serviços
        console.log("--- TESTE 1: Buscar Cidades e Serviços Disponíveis ---");
        const cities = await callLalamove('GET', '/v3/cities');
        console.log("✅ Conexão bem-sucedida com o Sandbox da Lalamove!");
        console.log(`Encontradas ${cities.data.length} cidades.`);

        // Identificar se há um tipo de serviço cadastrado para o Brasil na resposta
        let serviceType = 'MOTORCYCLE';
        if (cities && cities.data && cities.data.length > 0) {
            const brCities = cities.data.filter(c => c.locode && c.locode.startsWith('BR'));
            if (brCities.length > 0 && brCities[0].services && brCities[0].services.length > 0) {
                serviceType = brCities[0].services[0].key;
                console.log(`💡 Tipo de serviço sugerido pelo Sandbox: ${serviceType}`);
            }
        }

        // Teste 2: Solicitar uma cotação de entrega em Belo Horizonte, MG (Aika FarmaVet)
        console.log("\n--- TESTE 2: Solicitar Cotação de Entrega (Quotations) ---");
        const quotationPayload = {
            data: {
                serviceType: serviceType,
                language: 'pt_BR', // Obrigatório no payload da v3
                specialRequests: [],
                stops: [
                    {
                        coordinates: {
                            lat: "-19.902660",
                            lng: "-44.004450"
                        },
                        address: "Avenida Abílio Machado, 514, Alípio de Melo, Belo Horizonte - MG"
                    },
                    {
                        coordinates: {
                            lat: "-19.932012",
                            lng: "-43.938090"
                        },
                        address: "Praça da Liberdade, Funcionários, Belo Horizonte - MG"
                    }
                ],
                item: {
                    quantity: "1", // Deve ser string
                    weight: "LESS_THAN_3KG"
                }
            }
        };

        const quotation = await callLalamove('POST', '/v3/quotations', quotationPayload);
        console.log("✅ Cotação obtida com sucesso!");
        console.log("\nResposta Completa da Cotação:");
        console.log(JSON.stringify(quotation, null, 2));

    } catch (e) {
        console.error("\n❌ Falha ao executar os testes no Sandbox da Lalamove.");
        console.error(e.message);
    }
}

runTests();
