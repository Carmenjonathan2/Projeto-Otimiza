const axios = require('axios');
const fs = require('fs');
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

const TARGET_NAME = "Gustavo Caeiro Diniz";

async function getHistory() {
    console.log(`🔍 [HISTORICO] Buscando cadastro para "${TARGET_NAME}"...`);
    
    if (!ACCESS_TOKEN || !SECRET_TOKEN) {
        console.error('❌ Credenciais do GestãoClick não encontradas no arquivo .env.');
        process.exit(1);
    }

    try {
        // Step 1: Find client ID
        const clientRes = await axios.get(`${BASE_URL}/clientes?nome=${encodeURIComponent(TARGET_NAME)}`, { headers });
        const clients = clientRes.data && clientRes.data.data ? clientRes.data.data : [];
        
        let client = null;
        if (clients.length > 0) {
            client = clients.find(c => c.nome.toLowerCase().includes(TARGET_NAME.toLowerCase())) || clients[0];
        }

        if (!client) {
            console.warn(`⚠️ Cliente "${TARGET_NAME}" não encontrado na busca direta por nome. Paginando cadastros para localizá-lo...`);
            // Fallback: Page through clients to find him
            let page = 1;
            let found = false;
            while (page <= 10) {
                const listRes = await axios.get(`${BASE_URL}/clientes?limit=100&page=${page}`, { headers });
                const list = listRes.data && listRes.data.data ? listRes.data.data : [];
                if (list.length === 0) break;

                const match = list.find(c => c.nome && c.nome.toLowerCase().includes(TARGET_NAME.toLowerCase()));
                if (match) {
                    client = match;
                    found = true;
                    break;
                }
                if (list.length < 100) break;
                page++;
            }
        }

        if (!client) {
            console.error(`❌ Cliente "${TARGET_NAME}" não foi encontrado no GestãoClick.`);
            process.exit(1);
        }

        console.log(`✅ Cliente localizado! ID: ${client.id} | Nome: ${client.nome} | CPF/CNPJ: ${client.cpf || client.cnpj || 'N/A'}`);

        // Step 2: Fetch and filter sales
        console.log(`📡 Buscando histórico de vendas...`);
        let sales = [];
        let page = 1;
        let keepFetching = true;

        while (keepFetching && page <= 15) {
            // We fetch sales. Some APIs support `cliente_id` parameter, we can try using it.
            // If it returns sales only for that client, great. If not, we filter in memory.
            const url = `${BASE_URL}/vendas?limit=100&page=${page}&cliente_id=${client.id}`;
            const res = await axios.get(url, { headers });
            const list = res.data && res.data.data ? res.data.data : [];

            if (list.length === 0) break;

            // Check if the API respected the filter or if we need to filter in memory
            const hasOtherClients = list.some(v => v.cliente_id && v.cliente_id.toString() !== client.id.toString());
            
            if (hasOtherClients) {
                // Filter in memory
                const clientSales = list.filter(v => v.cliente_id && v.cliente_id.toString() === client.id.toString());
                sales.push(...clientSales);
                console.log(`- Página ${page}: encontradas ${clientSales.length} vendas para o cliente (filtrado na memória).`);
            } else {
                // Filter was respected by the API
                sales.push(...list);
                console.log(`- Página ${page}: encontradas ${list.length} vendas para o cliente.`);
            }

            if (list.length < 100) break;
            page++;
            await new Promise(r => setTimeout(r, 200));
        }

        console.log(`\n🎉 Total de vendas localizadas para ${client.nome}: ${sales.length}`);

        // Sort sales by date descending
        sales.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Step 3: Write report
        let md = `# 🛍️ Histórico de Compras - ${client.nome}\n\n`;
        md += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n`;
        md += `*ID do Cliente: ${client.id}*\n`;
        md += `*Contato: ${client.celular || client.telefone || 'N/A'} | E-mail: ${client.email || 'N/A'}*\n`;
        md += `*CRMV cadastrado: ${client.rg && client.rg.toLowerCase().includes('crmv') ? client.rg : (client.responsavel || 'N/A')}*\n\n`;

        if (sales.length === 0) {
            md += `> [!WARNING]\n`;
            md += `> Este cliente **não possui nenhuma compra** registrada no GestãoClick até o momento.\n`;
        } else {
            let totalSpent = 0;
            let activeSalesCount = 0;

            sales.forEach(s => {
                const total = parseFloat(s.valor_total) || 0;
                const sit = (s.nome_situacao || '').toLowerCase();
                if (!sit.includes('cancelad') && !sit.includes('excluid')) {
                    totalSpent += total;
                    activeSalesCount++;
                }
            });

            md += `## 💰 Resumo Financeiro\n`;
            md += `- **Total Gasto (Vendas Concretizadas):** R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            md += `- **Total de Pedidos:** ${sales.length} (${activeSalesCount} ativos, ${sales.length - activeSalesCount} cancelados/excluídos)\n\n`;

            md += `## 📜 Detalhamento dos Pedidos\n\n`;

            sales.forEach((s, idx) => {
                const dateFmt = s.data.split('-').reverse().join('/');
                const totalVal = parseFloat(s.valor_total) || 0;
                md += `### ${idx + 1}. Pedido #${s.codigo || s.id} (${dateFmt})\n`;
                md += `- **Status:** **${s.nome_situacao}**\n`;
                md += `- **Valor do Pedido:** R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
                md += `- **Itens do Pedido:**\n`;

                const prods = s.produtos || [];
                if (prods.length === 0) {
                    md += `  - *Nenhum produto listado no pedido.*\n`;
                } else {
                    prods.forEach(pObj => {
                        const p = pObj.produto;
                        if (p) {
                            const qty = parseFloat(p.quantidade) || 0;
                            const unitPrice = parseFloat(p.valor_venda) || 0;
                            const totalItem = parseFloat(p.valor_total) || 0;
                            md += `  - **${p.nome_produto}**: ${qty} un x R$ ${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} = R$ ${totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
                        }
                    });
                }
                md += `\n---\n\n`;
            });
        }

        const outputPathArg = process.argv[2];
        const defaultOutputPath = path.join(__dirname, '..', `historico_${client.id}.md`);
        const finalOutputPath = outputPathArg || defaultOutputPath;

        fs.writeFileSync(finalOutputPath, md, 'utf-8');
        console.log(`📄 Relatório do histórico gerado em: ${finalOutputPath}`);

    } catch (e) {
        console.error('❌ Falha ao buscar histórico do cliente:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
        }
    }
}

getHistory();
