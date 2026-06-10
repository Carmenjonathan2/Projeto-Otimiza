/**
 * OTIMIZA FARMAVET - MÓDULO DE INTELIGÊNCIA COMERCIAL E ESTRATÉGIAS DE VENDAS
 * Mapeia ganchos mentais, gatilhos de dor, e oportunidades de Upsell/Cross-sell
 */

const REGRAS_ESTRATEGICAS = {
    UPSELL_LIBRELA: {
        detectores: ["librela", "osteoartrite", "dor articular"],
        regra: "Se o cliente cotar 1 ampola de Librela (R$ 380,00), ofereça ativamente a compra de 2 ampolas para conseguir o desconto especial de atacado B2C por R$ 350,00 cada ampola (Economia total de R$ 60,00 e garante o tratamento sem interrupções).",
        mensagemInjetada: "[GATILHO COMERCIAL - UPSELL LIBRELA]: O cliente tem interesse em Librela. Ofereça 2 ampolas por R$ 350 cada, economizando R$ 60 total."
    },
    UPSELL_SIMPARIC: {
        detectores: ["simparic", "antipulgas", "sarna", "carrapato"],
        regra: "Se o cliente cotar Simparic unitário (1 comprimido de 10mg por R$ 104,50), sugira a caixa de 3 comprimidos (tratamento completo para 3 meses) por R$ 269,90, enfatizando a economia de R$ 43,60 e proteção contínua.",
        mensagemInjetada: "[GATILHO COMERCIAL - UPSELL SIMPARIC]: O cliente tem interesse em Simparic. Sugira a caixa de 3 comprimidos por R$ 269,90, detalhando a economia de R$ 43,60 contra a dose única."
    },
    CROSS_SELL_METILFORAN: {
        detectores: ["metilforan", "renal", "rins"],
        regra: "Na compra de qualquer caixa de Metilforan (30, 60 ou 90 comprimidos), informe o tutor que ele ganha como bonificação comercial da Otimiza: 1 caixa de Dom Peridona grátis e 1 caixa de Alopurinol grátis, além do parcelamento facilitado em até 8x sem juros.",
        mensagemInjetada: "[GATILHO COMERCIAL - BONIFICAÇÃO METILFORAN]: Destaque os brindes inclusos de Dom Peridona + Alopurinol e parcelamento em 8x sem juros."
    },
    CROSS_SELL_PETISCOS: {
        detectores: ["shampoo", "ração", "racao", "suplemento", "apoquel"],
        regra: "Se o cliente estiver fechando a compra e o valor estiver próximo de R$ 150,00, sugira adicionar um sachê/petisco funcional de alta qualidade (abaixo de R$ 20,00) para atingir o valor mínimo de R$ 150,00 e entrar automaticamente no Sorteio Especial dos Namorados (que dá direito a concorrer a procedimentos de estética e liberação miofascial).",
        mensagemInjetada: "[GATILHO COMERCIAL - TICKET MÉDIO E SORTEIO]: Se o valor da compra estiver próximo de R$ 150, sugira adicionar um petisco/sachê menor (abaixo de R$ 20) para o cliente participar do Sorteio dos Namorados."
    },
    VET_EM_CASA_CROSS: {
        detectores: ["vacina", "injetavel", "injetável", "v8", "v10", "raiva", "gripe", "giardia"],
        regra: "Tutores (B2C) não podem comprar vacinas ou injetáveis diretamente devido às regras de compliance. Se um tutor cotar vacinas, impeça a venda e ofereça o serviço 'Vet em Casa' em que o Dr. Kyenner vai até a residência aplicar a vacina com segurança técnica.",
        mensagemInjetada: "[GATILHO COMERCIAL - SERVIÇO DOMICILIAR]: Venda de vacinas direta para tutores é proibida. Bloqueie a venda física e ofereça a aplicação domiciliar com Dr. Kyenner (Vet em Casa) consultando o CEP."
    },
    FRETE_GRATIS_PRIMEIRA_COMPRA: {
        detectores: ["frete", "entrega", "envio", "moto", "entregar", "motoboy", "taxa"],
        regra: "Se o cliente B2C cotar o frete ou perguntar sobre a entrega, ofereça o Frete Grátis de boas-vindas válido para a primeira compra na região de Belo Horizonte (BH) e Nova Lima.",
        mensagemInjetada: "[GATILHO COMERCIAL - FRETE GRÁTIS BOAS-VINDAS]: Ofereça Frete Grátis na primeira compra (B2C) para BH e Nova Lima."
    },
    TAXA_CARTAO: {
        detectores: ["cartao", "cartão", "credito", "crédito", "link de pagamento", "parcelar", "vezes", "parcelado"],
        regra: "Se o cliente preferir pagar no cartão de crédito, lembre-o educadamente de que a taxa de transação operacional de 4.99% da operadora de cartão será repassada a ele. Avise antes de faturar.",
        mensagemInjetada: "[GATILHO COMERCIAL - TAXA CARTÃO]: Avise educadamente sobre a taxa operacional de 4.99% para pagamentos no cartão de crédito/link de pagamento."
    },
    CHAVE_PIX_INFO: {
        detectores: ["pix", "copia e cola", "pagar", "pagamento", "transferencia", "transferência", "dados bancarios"],
        regra: "Se o cliente desejar pagar via Pix, forneça a Chave PIX única oficial da Otimiza: telefone (31) 98793-6822 (Banco C6 Bank, Solução Farmacêutica). Nunca passe contas ou CPFs pessoais.",
        mensagemInjetada: "[GATILHO COMERCIAL - CHAVE PIX]: Passe a chave Pix oficial: telefone (31) 98793-6822 (C6 Bank, Solução Farmacêutica)."
    },
    RECUSA_MANIPULADOS: {
        detectores: ["manipulado", "manipulados", "manipulacao", "manipulação", "formula", "fórmula", "mandar fazer"],
        regra: "A Otimiza FarmaVet não manipula fórmulas. Use obrigatoriamente a recusa carinhosa padrão: 'Oi [Nome]! Agradecemos o contato. No momento nós não realizamos manipulação de medicamentos, mas desejamos melhoras rápidas para o [Pet]! Que ele fique bem logo — estamos na torcida aqui com muita energia positiva! 🐾'",
        mensagemInjetada: "[GATILHO COMERCIAL - RECUSA MANIPULADOS]: Recuse manipulações carinhosamente usando o template padrão: 'Oi [Nome]! Agradecemos o contato. No momento nós não realizamos manipulação de medicamentos, mas desejamos melhoras rápidas para o [Pet]! Que ele fique bem logo — estamos na torcida aqui com muita energia positiva! 🐾'"
    }
};

/**
 * Analisa a mensagem do cliente e injeta orientações comerciais dinâmicas no prompt da IA.
 */
function verificarOportunidadeVenda(mensagemCliente) {
    const msg = mensagemCliente.toLowerCase();
    let contextoComercial = "";

    for (let key in REGRAS_ESTRATEGICAS) {
        const estrategia = REGRAS_ESTRATEGICAS[key];
        const ativou = estrategia.detectores.some(d => msg.includes(d));
        if (ativou) {
            console.log(`🎯 [INTELIGÊNCIA COMERCIAL] Estratégia ativada: ${key}`);
            contextoComercial += `\n${estrategia.mensagemInjetada}`;
        }
    }

    return contextoComercial;
}

module.exports = {
    verificarOportunidadeVenda
};
