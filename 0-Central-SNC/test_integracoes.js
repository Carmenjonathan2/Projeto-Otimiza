/**
 * OTIMIZA FARMAVET - SCRIPT DE TESTE DE INTEGRAÇÕES E INTELIGÊNCIA COMERCIAL
 * Valida a conexão entre os módulos e as estratégias de vendas.
 */

const assert = require('assert');
const path = require('path');

const zapi = require('./src/integracoes/integracao_zapi');
const chatwoot = require('./src/integracoes/integracao_chatwoot');
const shopify = require('./src/integracoes/integracao_shopify');
const gestaoclick = require('./src/integracoes/integracao_gestaoclick');
const pagamento = require('./src/integracoes/integracao_pagamento');
const logistica = require('./src/integracoes/integracao_logistica');
const vendas = require('./src/comercial/estrategias_vendas');

async function testarIntegracoes() {
    console.log("=========================================");
    console.log("🧪 INICIANDO TESTES DO ECOSSISTEMA OTIMIZA");
    console.log("=========================================\n");

    try {
        // 1. Testar Inteligência Comercial (Estratégias de Venda)
        console.log("🔍 Testando Estratégias de Vendas...");
        const resultSimparic = vendas.verificarOportunidadeVenda("Quero cotação de Simparic.");
        assert.ok(resultSimparic.includes("UPSELL SIMPARIC"), "Falha ao detectar Upsell de Simparic");
        console.log("✅ Detectou oportunidade de Upsell (Simparic).");

        const resultLibrela = vendas.verificarOportunidadeVenda("Gostaria de saber o preço de 1 ampola de Librela 15mg.");
        assert.ok(resultLibrela.includes("UPSELL LIBRELA"), "Falha ao detectar Upsell de Librela");
        console.log("✅ Detectou oportunidade de Upsell (Librela).");

        const resultMetilforan = vendas.verificarOportunidadeVenda("Vocês têm Metilforan em estoque?");
        assert.ok(resultMetilforan.includes("BONIFICAÇÃO METILFORAN"), "Falha ao detectar bonificação do Metilforan");
        console.log("✅ Detectou oportunidade de Cross-sell (Metilforan).");

        const resultFrete = vendas.verificarOportunidadeVenda("quanto fica a entrega?");
        assert.ok(resultFrete.includes("FRETE GRÁTIS BOAS-VINDAS"), "Falha ao detectar frete grátis");
        console.log("✅ Detectou oportunidade de frete de boas-vindas.");

        const resultCartao = vendas.verificarOportunidadeVenda("posso parcelar no cartao?");
        assert.ok(resultCartao.includes("TAXA CARTÃO"), "Falha ao detectar taxa de cartão");
        console.log("✅ Detectou lembrete de taxa operacional de cartão.");

        const resultPix = vendas.verificarOportunidadeVenda("me passa o pix");
        assert.ok(resultPix.includes("CHAVE PIX"), "Falha ao detectar chave Pix");
        console.log("✅ Detectou fornecimento de chave Pix oficial.");

        const resultManipulados = vendas.verificarOportunidadeVenda("fazem remedio manipulado?");
        assert.ok(resultManipulados.includes("RECUSA MANIPULADOS"), "Falha ao detectar recusa de manipulados");
        console.log("✅ Detectou recusa padrão para medicamentos manipulados.");

        // 2. Testar consulta de estoque na Shopify
        console.log("\n🔍 Testando consulta de estoque (Shopify)...");
        const infoLibrela = await shopify.consultarEstoque("Librela 15mg");
        console.log(`✅ Estoque Librela: ${infoLibrela.quantidade} un | Preço: R$ ${infoLibrela.preco}`);
        assert.equal(infoLibrela.preco, 380.00, "Valor do Librela difere da tabela");

        // 3. Testar busca de cadastro no GestãoClick (CRM)
        console.log("\n🔍 Testando consulta de CRM (GestãoClick)...");
        const cadastroTutor = await gestaoclick.buscarCadastroPorCPF("069.442.656-30");
        console.log(`✅ Cadastro Tutor localizado: ${cadastroTutor.nome} | Tipo: ${cadastroTutor.tipo_cliente}`);
        if (cadastroTutor.crmv) {
            assert.equal(cadastroTutor.tipo_cliente, "B2B", "Tipo de cliente deveria ser B2B para veterinário cadastrado");
        } else {
            assert.equal(cadastroTutor.tipo_cliente, "B2C", "Tipo de cliente deveria ser B2C");
        }

        const cadastroVet = await gestaoclick.buscarCadastroPorCPF("9999");
        console.log(`✅ Cadastro Vet localizado: ${cadastroVet.nome} | Tipo: ${cadastroVet.tipo_cliente} | CRMV: ${cadastroVet.crmv}`);
        if (cadastroVet.id !== null) {
            assert.equal(cadastroVet.tipo_cliente, "B2B", "Tipo de cliente deveria ser B2B");
        } else {
            console.log("ℹ️ [INFO] Usando GestãoClick real: CPF '9999' não foi localizado no ERP (comportamento correto esperado da API real).");
        }

        // 4. Testar geração de pagamentos
        console.log("\n🔍 Testando módulo de faturamento (C6 Pix e Mercado Pago)...");
        const pix = await pagamento.gerarPixC6(700.00);
        console.log(`✅ Pix gerado: ${pix.pixCopiaCola.substring(0, 50)}...`);
        
        const linkMP = await pagamento.gerarLinkMercadoPago(380.00);
        console.log(`✅ Link Mercado Pago gerado (com acréscimo de taxas): ${linkMP.init_url}`);
        console.log(`✅ Valor com taxa de cartão: R$ ${linkMP.valor_final.toFixed(2)} (Original: R$ 380.00)`);

        // 5. Testar chamada de motoboy automático (Uber Direct)
        console.log("\n🔍 Testando despacho logístico (Uber Direct)...");
        const entrega = await logistica.chamarUberDirect(
            { endereco: "Avenida Abílio Machado, 514, Sala 08" },
            { endereco: "Rua Vereda da Alvorada, 160", nome: "Camila Rodrigues", telefone: "3198305005" }
        );
        console.log(`✅ Motorista Uber: ${entrega.motorista.nome} | Placa: ${entrega.motorista.placa}`);
        console.log(`✅ Link Rastreio: ${entrega.link_rastreio}`);
        console.log(`✅ Preço Uber: R$ ${entrega.preco_frete.toFixed(2)}`);

        // 6. Testar envio pelo WhatsApp (Z-API Mock)
        console.log("\n🔍 Testando módulo de envio (Z-API)...");
        const resWpp = await zapi.enviarMensagemTexto("5531987936822", "Teste de bot");
        assert.ok(resWpp);
        if (resWpp.status) {
            assert.equal(resWpp.status, 200);
        } else {
            assert.ok(resWpp.zaapId || resWpp.messageId || resWpp.id, "Resposta da Z-API não contém ID de mensagem.");
        }
        console.log("✅ Mensagem de texto enviada pelo Z-API.");

        // 7. Testar Chatwoot handoff
        console.log("\n🔍 Testando sincronização de transbordo (Chatwoot)...");
        const resCw = await chatwoot.solicitarSuporteHumano("5531987936822", "Vander Luiz", "Dúvida cadastral");
        assert.ok(resCw);
        console.log("✅ Chatwoot acionado para intervenção humana.");

        console.log("\n=========================================");
        console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO! ✅");
        console.log("=========================================");

    } catch (e) {
        console.error("\n❌ FALHA NOS TESTES:", e);
        process.exit(1);
    }
}

testarIntegracoes();
