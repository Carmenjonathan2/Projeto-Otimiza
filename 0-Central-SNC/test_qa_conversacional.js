/**
 * OTIMIZA FARMAVET — SUITE DE QA CONVERSACIONAL v1.0
 * =====================================================
 * Testa o comportamento da IA em 12 cenários reais sem precisar de WhatsApp.
 * Usa o Gemini como "Juiz" para avaliar compliance das respostas.
 *
 * Como funciona:
 *  1. Para cada cenário, monta o systemInstruction (brandbook + contexto)
 *  2. Chama o Gemini com a mensagem do cenário (IA respondendo como faria no WhatsApp)
 *  3. Chama o Gemini novamente como Juiz para verificar se a resposta viola as regras
 *  4. Gera relatório final com taxa de conformidade
 *
 * Uso: node 0-Central-SNC/test_qa_conversacional.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs   = require('fs');
const path = require('path');

// --- Módulos de Produção ---
const { processarMensagem } = require('./server_integracao');
const zapi = require('./src/integracoes/integracao_zapi');
const gestaoclick = require('./src/integracoes/integracao_gestaoclick');

// Capturar resposta enviada pelo robô
let ultimaMensagemEnviada = "";
zapi.enviarMensagemTexto = async (phone, text) => {
    ultimaMensagemEnviada = text;
    return { status: 200, data: { messageId: "mock_id_123" } };
};

// --- Config ---
process.env.NODE_ENV = 'test';
process.env.MODO_SILENCIOSO = 'false'; // Garantir que os testes de QA sempre rodem em modo ativo
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não encontrada no .env');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODELO_JUIZ     = 'gemini-2.5-flash';
const DELAY_ENTRE_TESTES_MS = 4000; // Evitar rate-limit

// =========================================================================
// CENÁRIOS DE TESTE (12 casos de qualidade)
// =========================================================================
const CENARIOS = [

    // ─── GRUPO 1: Persona B2C — Aika ─────────────────────────────────────
    {
        id: 1,
        grupo: '🐾 Aika B2C',
        descricao: 'Primeira mensagem de tutor sem contexto',
        tipoCliente: 'B2C',
        mensagem: 'Oi, tudo bem?',
        regrasJuiz: [
            'A resposta deve ser acolhedora, calorosa e usar pelo menos 1 emoji',
            'Deve perguntar o nome do tutor e/ou do pet para personalizar o atendimento',
            'NÃO deve usar termos formais como Prezado, Senhor, Senhora, Estimado'
        ]
    },
    {
        id: 2,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor pergunta sobre vacina — deve oferecer Vet em Casa',
        tipoCliente: 'B2C',
        mensagem: 'Oi! Meu cachorro precisa tomar vacina antirrábica. Vocês vendem?',
        regrasJuiz: [
            'A resposta DEVE oferecer o serviço Vet em Casa (aplicação domiciliar pelo nosso veterinário)',
            'A resposta NÃO pode informar preços de custo de vacinas avulsas (como R$ 17,90 ou R$ 44,50)',
            'A resposta NÃO pode sugerir que o tutor compre a vacina para aplicar sozinho em casa',
            'Deve mencionar o valor da aplicação domiciliar (R$ 60,00 para antirrábica)',
            'A resposta NÃO deve referir-se ao veterinário como diretor ou diretor veterinário (pode chamá-lo de nosso veterinário ou Kyenner)'
        ]
    },
    {
        id: 3,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor pergunta sobre Librela — produto pedido especial',
        tipoCliente: 'B2C',
        contextoProduto: {
            tipo: 'pedido_especial',
            produto: 'Librela 15mg',
            preco: 380.00,
            prazo: '1 a 2 dias úteis'
        },
        mensagem: 'Minha cachorra tem artrite. O veterinário receitou Librela. Vocês têm em estoque?',
        regrasJuiz: [
            'A resposta DEVE informar que o produto está disponível (nunca dizer "fora de estoque" para pedido especial)',
            'A resposta DEVE mencionar que a entrega é prevista para 1 ou 2 dias',
            'A resposta DEVE mencionar que daremos a previsão de entrega após verificar a disponibilidade ou confirmar o pedido',
            'A resposta NÃO pode mencionar distribuidor, fornecedor, terceiros ou que fará pedido a eles',
            'A resposta DEVE mencionar o preço: R$ 380,00 por ampola',
            'A resposta deve informar ou mencionar a promoção de 2 ampolas por R$ 350,00 cada'
        ]
    },
    {
        id: 4,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor pergunta sobre Simparic (outros produtos) — deve transferir para Kyenner sem dar o preço',
        tipoCliente: 'B2C',
        contextoProduto: {
            tipo: 'estoque_normal',
            produto: 'Simparic 10mg',
            quantidade: 14,
            preco: 104.50
        },
        mensagem: 'Quero Simparic para meu golden de 18kg. Qual o preço?',
        regrasJuiz: [
            'A resposta NÃO deve informar o preço do Simparic',
            'A resposta DEVE informar de forma acolhedora que o produto está disponível',
            'A resposta DEVE informar que vai transferir a conversa para o Kyenner para ele passar os valores',
            'A resposta NÃO deve propor ofertas ou combos (regra de outros produtos B2C em estoque)'
        ]
    },
    {
        id: 5,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor confirma compra — deve confirmar e transferir para Kyenner',
        tipoCliente: 'B2C',
        contextoProdutoMencionado: 'Librela 15mg',
        mensagem: 'Quero comprar sim! Pode me passar o pix para pagar?',
        regrasJuiz: [
            'A resposta deve confirmar o pedido positivamente com entusiasmo',
            'A resposta deve mencionar que vai conectar com o Kyenner ou Kiki para finalizar os detalhes',
            'A resposta deve informar ou mencionar a chave Pix: (31) 98793-6822'
        ]
    },
    {
        id: 6,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor pede medicamento manipulado — recusa empática obrigatória',
        tipoCliente: 'B2C',
        mensagem: 'Boa tarde! Vocês fazem remédio manipulado para gatos?',
        regrasJuiz: [
            'A resposta DEVE usar a recusa empática padronizada da Otimiza (não realizamos manipulação + deseja melhoras ao pet)',
            'A resposta NÃO pode sugerir que a empresa faz ou pode arranjar manipulados',
            'A resposta deve ser carinhosa e positiva, desejando melhoras ao pet'
        ]
    },

    // ─── GRUPO 2: Persona B2B — Kyenner ──────────────────────────────
    {
        id: 7,
        grupo: '🩺 Kyenner B2B',
        descricao: 'Veterinária se identifica com CRMV — deve ser tratada pelo nome',
        tipoCliente: 'B2B',
        mensagem: 'Boa tarde, sou a Dra. Ana Lima, CRMV 15234. Gostaria de fazer um pedido de vacinas.',
        regrasJuiz: [
            'A resposta NÃO deve usar títulos formais ou honoríficos como Doutor, Doutora, Dr., ou Dra.',
            'A resposta deve reconhecer o CRMV e prosseguir diretamente para cotação ou atendimento',
            'A resposta NÃO deve pedir CPF ou outros documentos pessoais de um vet que já informou CRMV',
            'Tom deve ser técnico, direto e de parceria profissional (persona Kyenner)'
        ]
    },
    {
        id: 8,
        grupo: '🩺 Kyenner B2B',
        descricao: 'Vet pede cotação de vacinas — preços de atacado, SEM mencionar domiciliar',
        tipoCliente: 'B2B',
        mensagem: 'Me passa o preço da Rabisin e do Nobivac V8, por favor.',
        regrasJuiz: [
            'A resposta DEVE informar os preços de atacado das vacinas (Rabisin R$ 17,90, Nobivac V8 R$ 44,50)',
            'A resposta NÃO pode mencionar preços de aplicação domiciliar (R$ 60, R$ 70, R$ 80) — isso é exclusivo B2C',
            'A resposta deve usar tom técnico e direto (persona Kyenner, não Aika)',
            'NÃO deve usar emojis infantis ou tom excessivamente afetivo'
        ]
    },
    {
        id: 9,
        grupo: '🩺 Kyenner B2B',
        descricao: 'Vet pede vacinas — bot deve proativamente sugerir combo seringa/agulha',
        tipoCliente: 'B2B',
        mensagem: 'Quero fechar 20 doses de Rabisin.',
        regrasJuiz: [
            'A resposta DEVE proativamente perguntar ou oferecer seringas e agulhas como complemento ao pedido de vacinas',
            'A resposta deve mencionar a caixa fechada de insumos como opção de custo-benefício',
            'A resposta deve perguntar a quantidade para sugerir o lote ideal (ex: quantas doses por mês?)'
        ]
    },

    // ─── GRUPO 3: Cenários Cross-Persona ─────────────────────────────────
    {
        id: 10,
        grupo: '⚙️ Cross-Persona',
        descricao: 'Estoque zerado (outros produtos B2C) — deve informar que não temos, NÃO oferecer lista de espera e NÃO transferir',
        tipoCliente: 'B2C',
        contextoProduto: {
            tipo: 'estoque_zerado',
            produto: 'Bravecto',
            quantidade: 0,
            preco: 0
        },
        mensagem: 'Vocês têm Bravecto para cão de 15kg?',
        regrasJuiz: [
            'A resposta DEVE informar com polidez que não temos o produto em estoque',
            'A resposta NÃO deve oferecer lista de espera ou perguntar se deseja entrar na lista de espera',
            'A resposta NÃO deve dizer que vai transferir para o Kyenner ou outro atendente',
            'A resposta NÃO deve informar preços'
        ]
    },
    {
        id: 11,
        grupo: '⚙️ Cross-Persona',
        descricao: 'Urgência clínica — Safety Net deve acionar transferência imediata',
        tipoCliente: 'B2C',
        mensagem: 'Socorro! Meu cachorro está convulsionando, o que eu faço??',
        regrasJuiz: [
            'A resposta DEVE indicar transferência imediata para um humano (Kyenner)',
            'A resposta NÃO deve tentar dar diagnóstico clínico ou recomendar medicamentos',
            'A resposta NÃO deve tentar vender nada neste contexto',
            'A resposta deve ser empática, curta e indicar contato urgente com veterinário'
        ]
    },
    {
        id: 12,
        grupo: '⚙️ Cross-Persona',
        descricao: 'Pergunta sobre pagamento com cartão — deve avisar taxa de 4,99%',
        tipoCliente: 'B2C',
        mensagem: 'Posso pagar no cartão de crédito?',
        regrasJuiz: [
            'A resposta DEVE avisar sobre a taxa operacional de 4,99% para cartão de crédito',
            'A resposta deve oferecer o Pix como alternativa sem taxa adicional',
            'A resposta deve informar a chave Pix: (31) 98793-6822'
        ]
    },
    {
        id: 13,
        grupo: '⚙️ Cross-Persona',
        descricao: 'Mensagem de propaganda/spam — deve recusar com polidez e brevidade, sem tentar vender',
        tipoCliente: 'B2C',
        mensagem: 'Olá! Sou da agência VetMarketing e ofereço serviços de tráfego pago e captação de clientes para clínicas e farmácias pet. Vocês teriam interesse em agendar uma apresentação de 15 minutos esta semana?',
        regrasJuiz: [
            'A resposta deve recusar a oferta de forma polida e curta',
            'A resposta NÃO deve perguntar se a pessoa é tutor ou veterinário, nem pedir CPF ou CRMV',
            'A resposta NÃO deve tentar vender medicamentos, vacinas ou sugerir o serviço Vet em Casa',
            'A resposta NÃO deve apresentar chave Pix ou tentar conduzir uma venda'
        ]
    },
    {
        id: 14,
        grupo: '⚙️ Cross-Persona',
        descricao: 'Mensagem ambígua/sem contexto claro — deve perguntar como ajudar de forma natural e contextualizada',
        tipoCliente: 'B2C',
        mensagem: 'Vocês conseguem me ajudar com uma dúvida?',
        regrasJuiz: [
            'A resposta deve ser prestativa, educada e perguntar qual é a dúvida de forma acolhedora',
            'A resposta NÃO deve perguntar de imediato se o cliente é tutor ou veterinário',
            'A resposta NÃO deve solicitar CPF ou CRMV nesta primeira mensagem sem contexto'
        ]
    }
];

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

async function avaliarComJuiz(resposta, cenario) {
    const judgeModel = genAI.getGenerativeModel({ model: MODELO_JUIZ });

    const prompt = `Você é um avaliador de qualidade de atendimento para a farmácia veterinária Otimiza FarmaVet.

TAREFA: Avalie se a resposta da IA viola alguma das regras de compliance listadas abaixo.

CENÁRIO: ${cenario.descricao}
PERSONA ESPERADA: ${cenario.grupo}

REGRAS A VERIFICAR:
${cenario.regrasJuiz.map((r, i) => `${i + 1}. ${r}`).join('\n')}

RESPOSTA DA IA PARA AVALIAR:
"""
${resposta}
"""

Responda APENAS com JSON válido (sem markdown, sem explicações extras) no formato exato:
{"aprovado": true, "violacoes": [], "nota": "comentário breve"}
ou
{"aprovado": false, "violacoes": ["violação 1", "violação 2"], "nota": "comentário breve"}`;

    try {
        const result = await judgeModel.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { aprovado: false, violacoes: ['Juiz não retornou JSON válido'], nota: text.substring(0, 200) };
    } catch (e) {
        return { aprovado: false, violacoes: [`Erro no juiz: ${e.message}`], nota: '' };
    }
}

async function rodarCenario(cenario) {
    const prefixo = `  [${cenario.id.toString().padStart(2, '0')}] ${cenario.descricao}`;
    process.stdout.write(`${prefixo}... `);

    const originalConsultarEstoque = gestaoclick.consultarEstoque;
    try {
        const phone = `553190000${cenario.id.toString().padStart(3, '0')}`;
        const stateFilePath = path.resolve(__dirname, 'conversas_state.json');

        // Configurar o estado inicial no arquivo JSON antes de rodar
        const states = fs.existsSync(stateFilePath) ? JSON.parse(fs.readFileSync(stateFilePath, 'utf8')) : {};
        
        states[phone] = {
            owner: "AI",
            history: [],
            cpf: cenario.tipoCliente === 'B2B' ? '9999' : null,
            crmv: cenario.tipoCliente === 'B2B' ? '12345' : null,
            tipo_cliente: cenario.tipoCliente,
            nome_cadastro: cenario.tipoCliente === 'B2B' ? 'Marcos Medvet' : null,
            aguardando_crmv: false,
            aguardando_receita: false,
            receita_validada: (cenario.id === 3 || cenario.id === 5) ? true : false, // Librela B2C já com receita validada para cotar
            medicamento_restrito: (cenario.id === 3 || cenario.id === 5) ? "librela" : null,
            produto_sem_estoque: null,
            produto_mencionado: cenario.id === 5 ? "Librela 15mg" : null,
            aguardando_confirmar_lista_espera: false
        };
        fs.writeFileSync(stateFilePath, JSON.stringify(states, null, 4), 'utf8');

        // Resetar o capturador de resposta do Z-API
        ultimaMensagemEnviada = "";

        // Mockar gestaoclick.consultarEstoque com base no cenario.contextoProduto se fornecido
        if (cenario.contextoProduto) {
            gestaoclick.consultarEstoque = async (nome, tipo) => {
                if (nome.toLowerCase().includes(cenario.contextoProduto.produto.toLowerCase()) || cenario.contextoProduto.produto.toLowerCase().includes(nome.toLowerCase())) {
                    return {
                        quantidade: cenario.contextoProduto.quantidade,
                        preco: cenario.contextoProduto.preco,
                        tipo: cenario.contextoProduto.tipo,
                        prazo: cenario.contextoProduto.prazo
                    };
                }
                return originalConsultarEstoque(nome, tipo);
            };
        }

        // Chamar a função real de produção do servidor
        const payload = {
            phone,
            senderName: cenario.tipoCliente === 'B2B' ? "Dra. Ana Lima" : "Vander Luiz",
            messageId: `msg_${Date.now()}_${cenario.id}`,
            text: { message: cenario.mensagem }
        };
        
        await processarMensagem(payload);

        const resposta = ultimaMensagemEnviada;

        if (!resposta) {
            console.log('❌ REPROVADO (Nenhuma resposta enviada pelo Z-API)');
            return { id: cenario.id, grupo: cenario.grupo, descricao: cenario.descricao, aprovado: false, erro: 'Sem resposta do Z-API' };
        }

        await new Promise(r => setTimeout(r, 800)); // pequena pausa antes do juiz

        const avaliacao = await avaliarComJuiz(resposta, cenario);

        if (avaliacao.aprovado) {
            console.log('✅ APROVADO');
            if (avaliacao.nota) {
                console.log(`       💬 ${avaliacao.nota}`);
            }
        } else {
            console.log('❌ REPROVADO');
            (avaliacao.violacoes || []).forEach(v => console.log(`       ⚠️  ${v}`));
            if (avaliacao.nota) console.log(`       💬 ${avaliacao.nota}`);
            // Mostra um trecho da resposta para debug
            const trechoResposta = resposta.replace(/\n/g, ' ').substring(0, 180);
            console.log(`       🤖 "${trechoResposta}${resposta.length > 180 ? '...' : ''}"`);
        }

        return { id: cenario.id, grupo: cenario.grupo, descricao: cenario.descricao, aprovado: avaliacao.aprovado, avaliacao, resposta };

    } catch (e) {
        console.log(`💥 ERRO: ${e.message}`);
        return { id: cenario.id, grupo: cenario.grupo, descricao: cenario.descricao, aprovado: false, erro: e.message };
    } finally {
        gestaoclick.consultarEstoque = originalConsultarEstoque;
    }
}

// =========================================================================
// RUNNER PRINCIPAL
// =========================================================================
async function rodarQA() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧪  OTIMIZA FARMAVET — QA CONVERSACIONAL v1.0');
    console.log('═'.repeat(60));
    console.log(`📋 Total de cenários: ${CENARIOS.length}`);
    console.log(`🤖 Cada cenário faz 2 chamadas ao Gemini (resposta + juiz)`);
    console.log(`⏱️  Estimativa: ~2 min (inclui delays de rate-limit)`);
    console.log('═'.repeat(60));

    // Backup de conversas_state.json
    const stateFilePath = path.resolve(__dirname, 'conversas_state.json');
    let stateBackup = "";
    if (fs.existsSync(stateFilePath)) {
        stateBackup = fs.readFileSync(stateFilePath, 'utf8');
    }

    const resultados = [];

    // Agrupar e rodar por grupo
    const grupos = {};
    CENARIOS.forEach(c => {
        if (!grupos[c.grupo]) grupos[c.grupo] = [];
        grupos[c.grupo].push(c);
    });

    try {
        for (const [nomeGrupo, cenarios] of Object.entries(grupos)) {
            console.log(`\n${nomeGrupo}`);
            console.log('─'.repeat(55));
            for (const cenario of cenarios) {
                const resultado = await rodarCenario(cenario);
                resultados.push(resultado);
                // Delay entre testes para respeitar rate-limit da API
                await new Promise(r => setTimeout(r, DELAY_ENTRE_TESTES_MS));
            }
        }
    } finally {
        // Restaurar backup do estado original
        if (stateBackup) {
            fs.writeFileSync(stateFilePath, stateBackup, 'utf8');
        } else if (fs.existsSync(stateFilePath)) {
            try { fs.unlinkSync(stateFilePath); } catch (e) {}
        }
    }

    // ─── RELATÓRIO FINAL ──────────────────────────────────────────────────
    const aprovados  = resultados.filter(r => r.aprovado).length;
    const reprovados = resultados.filter(r => !r.aprovado).length;
    const taxa = Math.round((aprovados / CENARIOS.length) * 100);

    console.log('\n' + '═'.repeat(60));
    console.log('📊  RELATÓRIO FINAL DE QUALIDADE');
    console.log('═'.repeat(60));
    console.log(`✅ Aprovados:   ${aprovados}/${CENARIOS.length}`);
    console.log(`❌ Reprovados:  ${reprovados}/${CENARIOS.length}`);
    console.log(`🎯 Conformidade: ${taxa}%`);

    if (reprovados > 0) {
        console.log('\n🔴 Cenários que precisam de atenção:');
        resultados
            .filter(r => !r.aprovado)
            .forEach(r => console.log(`   • #${r.id}: ${r.descricao}`));
    }

    console.log('\n' + '─'.repeat(60));
    if (taxa >= 90) {
        console.log('🟢 STATUS: SISTEMA APROVADO PARA PRODUÇÃO');
    } else if (taxa >= 70) {
        console.log('🟡 STATUS: SISTEMA NECESSITA AJUSTES MENORES');
    } else {
        console.log('🔴 STATUS: SISTEMA NECESSITA REVISÃO URGENTE');
    }
    console.log('═'.repeat(60) + '\n');

    // Salvar log do resultado em JSON
    const logPath = path.resolve(__dirname, 'qa_resultado.json');
    fs.writeFileSync(logPath, JSON.stringify({
        executadoEm: new Date().toISOString(),
        aprovados,
        reprovados,
        taxa,
        resultados: resultados.map(r => ({
            id: r.id,
            grupo: r.grupo,
            descricao: r.descricao,
            aprovado: r.aprovado,
            violacoes: r.avaliacao?.violacoes || [],
            nota: r.avaliacao?.nota || r.erro || ''
        }))
    }, null, 2));
    console.log(`📝 Resultado detalhado salvo em: qa_resultado.json`);

    // Gerar Relatório Humano em Markdown
    let mdContent = `# 🧪 Relatório Detalhado de Conversas do QA - Otimiza FarmaVet\n\n`;
    mdContent += `* **Executado em:** ${new Date().toLocaleString('pt-BR')}\n`;
    mdContent += `* **Taxa de Conformidade:** ${taxa}%\n`;
    mdContent += `* **Cenários Aprovados:** ${aprovados}/${CENARIOS.length}\n\n`;
    mdContent += `## 💬 Conversas por Cenário\n\n`;

    for (const r of resultados) {
        const cenarioObj = CENARIOS.find(c => c.id === r.id);
        mdContent += `### 🎬 Cenário ${r.id}: ${r.descricao}\n`;
        mdContent += `* **Grupo:** ${r.grupo}\n`;
        mdContent += `* **Status:** ${r.aprovado ? '✅ Aprovado' : '❌ Reprovado'}\n\n`;
        mdContent += `**👤 Cliente:** ${cenarioObj ? cenarioObj.mensagem : ''}\n\n`;
        mdContent += `**🤖 Bot:**\n> ${r.resposta ? r.resposta.replace(/\n/g, '\n> ') : '*(Sem resposta)*'}\n\n`;
        mdContent += `**⚖️ Veredicto do Juiz Gemini:**\n`;
        if (r.avaliacao && r.avaliacao.violacoes && r.avaliacao.violacoes.length > 0) {
            mdContent += `* ⚠️ **Violações encontradas:**\n`;
            r.avaliacao.violacoes.forEach(v => {
                mdContent += `  - ${v}\n`;
            });
        }
        mdContent += `* 💬 **Nota:** ${r.avaliacao?.nota || r.erro || 'N/A'}\n\n`;
        mdContent += `---\n\n`;
    }

    const mdPath = path.resolve(__dirname, 'qa_relatorio_conversas.md');
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`📝 Relatório de conversas em Markdown gerado em: qa_relatorio_conversas.md\n`);

    // Exit code para CI/CD
    if (reprovados > 0) process.exit(1);
}

rodarQA().catch(e => {
    console.error('❌ Erro fatal no QA:', e);
    process.exit(1);
});
