/**
 * OTIMIZA FARMAVET - MÓDULO DE INTELIGÊNCIA COMERCIAL E ESTRATÉGIAS DE VENDAS
 * Mapeia ganchos mentais, gatilhos de dor, e oportunidades de Upsell/Cross-sell
 * Segmentado por tipo de cliente: B2B (Veterinários — Dr. Kyenner) e B2C (Tutores — Aika)
 */

// =========================================================================
// REGRAS B2C: Para Tutores — Persona Aika 🐾
// =========================================================================
const REGRAS_B2C = {
    VET_EM_CASA_VACINA: {
        detectores: ["vacina", "injetavel", "injetável", "v8", "v10", "raiva", "gripe", "giardia", "antirrábica", "antirrabica"],
        mensagemInjetada: "[MODO VENDEDOR B2C - VET EM CASA 🏠]: Venda direta de vacinas para tutores é PROIBIDA por compliance regulatório. Em vez disso, ofereça o serviço premium *Vet em Casa*: o Dr. Kyenner vai até a residência aplicar a vacina com segurança e cuidado técnico total. Pergunte o CEP para calcular o deslocamento. Tabela com aplicação inclusa: *Antirrábica R$60*, *V8/V9 R$70*, *V10 R$80*, *Gripe Felina R$90*, *Giardia R$97*. Destaque a comodidade e segurança do serviço domiciliar como vantagem exclusiva."
    },
    UPSELL_LIBRELA_B2C: {
        detectores: ["librela", "osteoartrite", "dor articular", "artrite"],
        mensagemInjetada: "[MODO VENDEDOR B2C - UPSELL LIBRELA 💊]: Ofereça 2 ampolas por R$350 cada (vs R$380 unitário) — economia de R$60 e garantia de tratamento contínuo sem interrupções. Explique que o tratamento da osteoartrite é mensal e que a consistência é fundamental para o resultado clínico do pet."
    },
    UPSELL_SIMPARIC_B2C: {
        detectores: ["simparic", "antipulgas", "antipulga", "sarna", "carrapato", "pulga"],
        mensagemInjetada: "[MODO VENDEDOR B2C - UPSELL SIMPARIC 🐛]: Sugira a caixa de 3 comprimidos por R$269,90 (3 meses de proteção contínua, economia de R$43,60 vs compra avulsa). Reforce que a proteção contínua é muito mais eficaz do que o tratamento pontual."
    },
    CROSS_SELL_METILFORAN_B2C: {
        detectores: ["metilforan", "renal", "rim", "doença renal", "insuficiencia renal"],
        mensagemInjetada: "[MODO VENDEDOR B2C - METILFORAN BRINDES 🎁]: Na compra de Metilforan (qualquer tamanho), destaque os brindes exclusivos da Otimiza: *Dom Peridona grátis* + *Alopurinol grátis*, e parcelamento facilitado em até *8x sem juros*. Mencione que esses brindes têm valor terapêutico complementar para o tratamento renal do pet."
    },
    FRETE_GRATIS_B2C: {
        detectores: ["frete", "entrega", "envio", "motoboy", "taxa de entrega", "moto"],
        mensagemInjetada: "[MODO VENDEDOR B2C - FRETE GRÁTIS 🛵]: Ofereça Frete Grátis de boas-vindas válido para a 1ª compra na região de Belo Horizonte e Nova Lima. Diga que normalmente calculamos o frete pelo CEP, mas que esse benefício especial cobre o cliente como presente de boas-vindas da Otimiza."
    },
    TAXA_CARTAO_B2C: {
        detectores: ["cartao", "cartão", "credito", "crédito", "link de pagamento", "parcelar", "parcela", "vezes"],
        mensagemInjetada: "[INFO B2C - PAGAMENTO CARTÃO 💳]: Avise educadamente sobre a taxa operacional de 4,99% para pagamentos via cartão de crédito/link de pagamento. Sugira o Pix como alternativa sem taxas adicionais para economizar."
    },
    CHAVE_PIX_B2C: {
        detectores: ["pix", "pagar", "pagamento", "transferencia", "transferência", "dados bancarios", "dados bancários", "conta"],
        mensagemInjetada: "[INFO B2C - CHAVE PIX 📲]: Forneça a chave Pix oficial: telefone *(31) 98793-6822* (C6 Bank | Solução Farmacêutica Otimiza). Nunca informe CPF ou contas pessoais."
    },
    TICKET_MEDIO_B2C: {
        detectores: ["quanto fica", "valor total", "total", "resumo do pedido", "fechar", "fecha"],
        mensagemInjetada: "[MODO VENDEDOR B2C - TICKET MÉDIO 🎟️]: Se o valor total do pedido estiver abaixo de R$150, sugira adicionar um petisco funcional ou suplemento vitamínico acessível (abaixo de R$20) para o pet participar do Sorteio Especial da Otimiza (prêmio: procedimento de estética e liberação miofascial). Faça parecer uma oportunidade exclusiva e com prazo limitado."
    },
    RECUSA_MANIPULADOS_B2C: {
        detectores: ["manipulado", "manipulados", "manipulacao", "manipulação", "formula", "fórmula", "mandar fazer", "aviamento"],
        mensagemInjetada: "[RECUSA B2C - MANIPULADOS ❌]: Use exatamente este template carinhoso: 'Oi [Nome]! Agradecemos o contato. No momento nós não realizamos manipulação de medicamentos, mas desejamos melhoras rápidas para o [Pet]! Que ele fique bem logo — estamos na torcida aqui com muita energia positiva! 🐾'"
    }
};

// =========================================================================
// REGRAS B2B: Para Veterinários — Persona Dr. Kyenner 🩺
// =========================================================================
const REGRAS_B2B = {
    UPSELL_VACINA_CAIXA_B2B: {
        detectores: ["vacina", "rabisin", "nobivac", "v8", "v10", "raiva", "gripe", "giardia", "antirrábica", "antirrabica", "injetavel", "injetável", "biológico", "biologico"],
        mensagemInjetada: "[MODO VENDEDOR B2B - VACINA ATACADO 💉]: Informe os preços avulsos da tabela de parceiros. Logo em seguida, PROATIVAMENTE ofereça a compra de caixa fechada com desconto especial de volume. Faça a pergunta consultiva: 'Quantas doses você aplica por mês, Doutor(a)?' para calcular o lote ideal e maximizar o desconto. Mencione disponibilidade de nota fiscal completa e condição de prazo para parceiros."
    },
    UPSELL_SERINGA_B2B: {
        detectores: ["seringa", "agulha", "insumo", "insumos", "cateter", "scalp", "descartável"],
        mensagemInjetada: "[MODO VENDEDOR B2B - INSUMOS ATACADO 💊]: Para seringas e agulhas, ofereça sempre a caixa fechada com 100 unidades (melhor custo-benefício para uso clínico). Pergunte a calibração preferida de agulha (ex: 40x12, 25x7, 25x8) para o tipo de aplicação que o veterinário realiza. Destaque a economia por unidade vs. compras avulsas."
    },
    UPSELL_LIBRELA_B2B: {
        detectores: ["librela", "osteoartrite", "articular", "artrite", "osteoartrose"],
        mensagemInjetada: "[MODO VENDEDOR B2B - LIBRELA ATACADO 💊]: Ofereça tabela de desconto progressivo por volume (3+ ampolas). Pergunte quantos pacientes com OA o consultório atende mensalmente para calcular o estoque ideal. Reforce o protocolo mensal e a fidelização do paciente no consultório."
    },
    UPSELL_SIMPARIC_B2B: {
        detectores: ["simparic", "antipulgas", "antipulga", "nexgard", "bravecto", "isoxazolina"],
        mensagemInjetada: "[MODO VENDEDOR B2B - ANTIPULGAS ATACADO 🐛]: Ofereça a caixa clínica (10 unidades) com preço de atacado. Compare o custo por dose com o avulso para mostrar a economia real. Pergunte o porte dos pets atendidos para indicar a dosagem correta (10mg, 40mg, etc.) e maximizar o pedido."
    },
    NOTA_FISCAL_B2B: {
        detectores: ["nota fiscal", "nf", "cnpj", "faturar", "faturamento", "boleto", "prazo"],
        mensagemInjetada: "[INFO B2B - NOTA FISCAL/FATURAMENTO 🧾]: Confirme que emitimos NF completa para CNPJ. Se ainda não tem conta de parceiro oficial, mencione os benefícios: tabela exclusiva de atacado, prazo de pagamento e entrega prioritária. Convide-o a formalizar a parceria para ter acesso a todas as condições especiais."
    },
    CROSS_SELL_METILFORAN_B2B: {
        detectores: ["metilforan", "renal", "rim", "doença renal", "insuficiencia renal"],
        mensagemInjetada: "[MODO VENDEDOR B2B - METILFORAN 💊]: Ofereça Metilforan em diferentes apresentações (30, 60, 90 comprimidos). Pergunte a demanda mensal do consultório para sugerir o estoque adequado. Destaque a qualidade do produto e disponibilidade consistente."
    },
    CHAVE_PIX_B2B: {
        detectores: ["pix", "pagar", "pagamento", "transferencia", "transferência", "conta bancaria"],
        mensagemInjetada: "[INFO B2B - PAGAMENTO 📲]: Chave Pix oficial: *(31) 98793-6822* (C6 Bank | Solução Farmacêutica Otimiza). Para parceiros com cadastro ativo, disponibilizamos também boleto com prazo de 15 dias mediante aprovação comercial."
    },
    RECUSA_MANIPULADOS_B2B: {
        detectores: ["manipulado", "manipulação", "formula", "fórmula", "aviamento", "compounding"],
        mensagemInjetada: "[RECUSA B2B - MANIPULADOS ❌]: Explique de forma direta que não realizamos manipulação. Redirecione para os produtos industrializados disponíveis no portfólio que possam atender a necessidade terapêutica mencionada."
    }
};

/**
 * Analisa a mensagem do cliente e injeta orientações comerciais dinâmicas no prompt da IA.
 * @param {string} mensagemCliente - Mensagem do cliente
 * @param {string} tipoCliente - "B2B" (veterinário) ou "B2C" (tutor). Padrão: "B2C"
 */
function verificarOportunidadeVenda(mensagemCliente, tipoCliente = "B2C") {
    const msg = mensagemCliente.toLowerCase();
    let contextoComercial = "";

    const regras = tipoCliente === "B2B" ? REGRAS_B2B : REGRAS_B2C;

    for (let key in regras) {
        const estrategia = regras[key];
        const ativou = estrategia.detectores.some(d => msg.includes(d));
        if (ativou) {
            console.log(`🎯 [INTELIGÊNCIA COMERCIAL] Estratégia ativada: ${key} (${tipoCliente})`);
            contextoComercial += `\n${estrategia.mensagemInjetada}`;
        }
    }

    return contextoComercial;
}

module.exports = {
    verificarOportunidadeVenda
};
