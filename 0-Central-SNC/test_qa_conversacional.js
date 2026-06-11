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

// --- Módulos internos (para montar contexto igual ao server) ---
const vendas  = require('./src/comercial/estrategias_vendas');
const shopify = require('./src/integracoes/integracao_shopify');

// --- Config ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não encontrada no .env');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODELO_RESPOSTAS = 'gemini-2.0-flash';
const MODELO_JUIZ     = 'gemini-2.0-flash';
const DELAY_ENTRE_TESTES_MS = 2000; // Evitar rate-limit

const brandbookPath = path.resolve(__dirname, 'diretrizes-e-branding/brandbook_operacoes_otimiza.md');
const brandbookContent = fs.readFileSync(brandbookPath, 'utf8');

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
            'A resposta DEVE oferecer o serviço Vet em Casa (aplicação domiciliar pelo Dr. Kyenner)',
            'A resposta NÃO pode informar preços de custo de vacinas avulsas (como R$ 17,90 ou R$ 44,50)',
            'A resposta NÃO pode sugerir que o tutor compre a vacina para aplicar sozinho em casa',
            'Deve mencionar o valor da aplicação domiciliar (R$ 60,00 para antirrábica)'
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
            'A resposta DEVE mencionar o prazo de entrega (1 a 2 dias úteis)',
            'A resposta DEVE mencionar o preço: R$ 380,00 por ampola',
            'A resposta deve informar ou mencionar a promoção de 2 ampolas por R$ 350,00 cada'
        ]
    },
    {
        id: 4,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor pergunta sobre Simparic — upsell caixa 3 comprimidos',
        tipoCliente: 'B2C',
        contextoProduto: {
            tipo: 'estoque_normal',
            produto: 'Simparic 10mg',
            quantidade: 14,
            preco: 104.50
        },
        mensagem: 'Quero Simparic para meu golden de 18kg. Qual o preço?',
        regrasJuiz: [
            'A resposta deve informar o preço do Simparic (R$ 104,50 avulso)',
            'A resposta deve proativamente oferecer a caixa de 3 comprimidos (R$ 269,90) como melhor custo-benefício',
            'A resposta deve mencionar que a caixa de 3 garante 3 meses de proteção contínua'
        ]
    },
    {
        id: 5,
        grupo: '🐾 Aika B2C',
        descricao: 'Tutor confirma compra — deve confirmar e transferir para Dr. Kyenner',
        tipoCliente: 'B2C',
        contextoProdutoMencionado: 'Librela 15mg',
        mensagem: 'Quero comprar sim! Pode me passar o pix para pagar?',
        regrasJuiz: [
            'A resposta deve confirmar o pedido positivamente com entusiasmo',
            'A resposta deve mencionar que vai conectar com o Dr. Kyenner ou responsável para finalizar os detalhes',
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

    // ─── GRUPO 2: Persona B2B — Dr. Kyenner ──────────────────────────────
    {
        id: 7,
        grupo: '🩺 Dr. Kyenner B2B',
        descricao: 'Veterinária se identifica com CRMV — deve ser tratada como Doutora',
        tipoCliente: 'B2B',
        mensagem: 'Boa tarde, sou a Dra. Ana Lima, CRMV 15234. Gostaria de fazer um pedido de vacinas.',
        regrasJuiz: [
            'A resposta deve tratar a veterinária com o título "Doutora" ou "Dra."',
            'A resposta deve reconhecer o CRMV e prosseguir diretamente para cotação ou atendimento',
            'A resposta NÃO deve pedir CPF ou outros documentos pessoais de um vet que já informou CRMV',
            'Tom deve ser técnico, direto e de parceria profissional (persona Dr. Kyenner)'
        ]
    },
    {
        id: 8,
        grupo: '🩺 Dr. Kyenner B2B',
        descricao: 'Vet pede cotação de vacinas — preços de atacado, SEM mencionar domiciliar',
        tipoCliente: 'B2B',
        mensagem: 'Me passa o preço da Rabisin e do Nobivac V8, por favor.',
        regrasJuiz: [
            'A resposta DEVE informar os preços de atacado das vacinas (Rabisin R$ 17,90, Nobivac V8 R$ 44,50)',
            'A resposta NÃO pode mencionar preços de aplicação domiciliar (R$ 60, R$ 70, R$ 80) — isso é exclusivo B2C',
            'A resposta deve usar tom técnico e direto (persona Dr. Kyenner, não Aika)',
            'NÃO deve usar emojis infantis ou tom excessivamente afetivo'
        ]
    },
    {
        id: 9,
        grupo: '🩺 Dr. Kyenner B2B',
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
        descricao: 'Estoque zerado — deve perguntar lista de espera, NÃO transferir ainda',
        tipoCliente: 'B2C',
        contextoProduto: {
            tipo: 'estoque_zerado',
            produto: 'Bravecto',
            quantidade: 0,
            preco: 0
        },
        mensagem: 'Vocês têm Bravecto para cão de 15kg?',
        regrasJuiz: [
            'A resposta deve informar com empatia que o produto está momentaneamente fora de estoque',
            'A resposta DEVE perguntar se o cliente quer entrar na lista de espera para ser avisado',
            'A resposta NÃO deve dizer imediatamente que vai transferir para o Dr. Kyenner — deve aguardar resposta do cliente',
            'A resposta deve ser acolhedora e transmitir confiança de que o produto voltará em breve'
        ]
    },
    {
        id: 11,
        grupo: '⚙️ Cross-Persona',
        descricao: 'Urgência clínica — Safety Net deve acionar transferência imediata',
        tipoCliente: 'B2C',
        mensagem: 'Socorro! Meu cachorro está convulsionando, o que eu faço??',
        regrasJuiz: [
            'A resposta DEVE indicar transferência imediata para um humano (Dr. Kyenner)',
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
    }
];

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

async function chamarGemini(systemInstruction, mensagem) {
    const model = genAI.getGenerativeModel({
        model: MODELO_RESPOSTAS,
        systemInstruction
    });
    const result = await model.generateContent(mensagem);
    return result.response.text();
}

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

async function buildSystemInstruction(cenario) {
    let contextoExtra = '';

    // Contexto de produto/estoque
    if (cenario.contextoProduto) {
        const p = cenario.contextoProduto;
        if (p.tipo === 'pedido_especial') {
            contextoExtra += `\n[Produto Pedido Especial 📦]: '${p.produto}' NÃO fica em estoque físico próprio — fazemos o pedido ao fornecedor assim que o cliente confirma. Preço: R$ ${p.preco}. PRAZO DE ENTREGA: *${p.prazo}* após confirmação. Informe ao cliente que o produto está DISPONÍVEL normalmente, com entrega em ${p.prazo}.`;
        } else if (p.tipo === 'estoque_zerado') {
            contextoExtra += `\n[ESTOQUE ZERADO 🔴]: O produto '${p.produto}' está MOMENTANEAMENTE FORA DE ESTOQUE. Informe com empatia e pergunte se o cliente quer entrar na lista de espera. NÃO diga que vai transferir ainda — aguarde a resposta do cliente.`;
        } else {
            contextoExtra += `\n[Estoque Disponível]: '${p.produto}' — ${p.quantidade} unidades em estoque — R$ ${p.preco}.`;
        }
    }

    // Contexto de compra confirmada
    if (cenario.contextoProdutoMencionado) {
        contextoExtra += `\n[COMPRA CONFIRMADA B2C ✅]: O tutor confirmou que quer comprar '${cenario.contextoProdutoMencionado}'. Responda confirmando o pedido com entusiasmo e diga que vai conectá-lo com o Dr. Kyenner para finalizar endereço, pagamento e prazo.`;
    }

    // Estratégia comercial baseada na mensagem
    try {
        const estrategia = vendas.verificarOportunidadeVenda(cenario.mensagem, cenario.tipoCliente);
        if (estrategia) {
            contextoExtra += `\n[Estratégia Comercial Ativa (${cenario.tipoCliente})]: ${estrategia}`;
        }
    } catch (e) {
        // silencioso
    }

    // Instrução de persona
    const personaDir = cenario.tipoCliente === 'B2B'
        ? `[Persona]: Fale EXCLUSIVAMENTE como o Dr. Kyenner (Diretor Veterinário). Tom técnico, direto, de parceria. Use "Doutor/Doutora". Use "tu", "blza" se adequado. Sem emojis infantis.`
        : `[Persona]: Fale EXCLUSIVAMENTE como a Aika (Mascote Guardiã B2C). Tom acolhedor, carinhoso, empático. Use emojis 💜🐾. NUNCA use "Prezado", "Senhor", "Senhora".`;

    const formatacao = `[Formatação WhatsApp]: Use apenas UM asterisco para negrito (*texto*). Máximo 2 parágrafos curtos. Seja conciso e direto.`;

    return `${brandbookContent}\n\n${contextoExtra}\n\n${personaDir}\n${formatacao}`;
}

async function rodarCenario(cenario) {
    const prefixo = `  [${cenario.id.toString().padStart(2, '0')}] ${cenario.descricao}`;
    process.stdout.write(`${prefixo}... `);

    try {
        const systemInstruction = await buildSystemInstruction(cenario);
        const resposta = await chamarGemini(systemInstruction, cenario.mensagem);

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
    console.log(`⏱️  Estimativa: ~${Math.ceil(CENARIOS.length * 2 * 3 / 60)} min (inclui delays de rate-limit)`);
    console.log('═'.repeat(60));

    const resultados = [];

    // Agrupar e rodar por grupo
    const grupos = {};
    CENARIOS.forEach(c => {
        if (!grupos[c.grupo]) grupos[c.grupo] = [];
        grupos[c.grupo].push(c);
    });

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

    // Salvar log do resultado
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
    console.log(`📝 Resultado detalhado salvo em: qa_resultado.json\n`);

    // Exit code para CI/CD
    if (reprovados > 0) process.exit(1);
}

rodarQA().catch(e => {
    console.error('❌ Erro fatal no QA:', e);
    process.exit(1);
});
