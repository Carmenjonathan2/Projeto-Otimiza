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
        mensagemInjetada: "[COMERCIAL:VET_CASA] Ofereça Vet em Casa (aplicação domiciliar): *Antirrábica R$60*, *V8/V9 R$70*, *V10 R$80*, *Gripe Felina R$90*, *Giardia R$97*. Pergunte o CEP."
    },
    UPSELL_LIBRELA_B2C: {
        detectores: ["librela", "osteoartrite", "dor articular", "artrite"],
        mensagemInjetada: "[COMERCIAL:UPSELL_LIBRELA] Ofereça 2 ampolas por R$350 cada (avulso R$380)."
    },
    UPSELL_SIMPARIC_B2C: {
        detectores: ["simparic", "antipulgas", "antipulga", "sarna", "carrapato", "pulga"],
        mensagemInjetada: "[COMERCIAL:UPSELL_SIMPARIC] Sugira caixa com 3 por R$269,90."
    },
    CROSS_SELL_METILFORAN_B2C: {
        detectores: ["metilforan", "renal", "rim", "doença renal", "insuficiencia renal"],
        mensagemInjetada: "[COMERCIAL:METILFORAN] Ofereça brindes (Dom Peridona + Alopurinol grátis) e até 8x sem juros."
    },
    FRETE_GRATIS_B2C: {
        detectores: ["frete", "entrega", "envio", "motoboy", "taxa de entrega", "moto"],
        mensagemInjetada: "[COMERCIAL:FRETE_GRATIS] Ofereça frete grátis na 1ª compra em BH/Nova Lima."
    },
    TAXA_CARTAO_B2C: {
        detectores: ["cartao", "cartão", "credito", "crédito", "link de pagamento", "parcelar", "parcela", "vezes"],
        mensagemInjetada: "[COMERCIAL:CARTÃO] Informe a taxa de 4,99% no cartão, e ofereça o Pix sem taxa informando a chave Pix *(31) 98793-6822* (C6 Bank) na mesma resposta."
    },
    CHAVE_PIX_B2C: {
        detectores: ["pix", "pagar", "pagamento", "transferencia", "transferência", "dados bancarios", "dados bancários", "conta"],
        mensagemInjetada: "[COMERCIAL:PIX] Chave Pix: *(31) 98793-6822* (C6 Bank)."
    },
    TICKET_MEDIO_B2C: {
        detectores: ["quanto fica", "valor total", "total", "resumo do pedido", "fechar", "fecha"],
        mensagemInjetada: "[COMERCIAL:TICKET] Ofereça petisco/suplemento (<R$20) para participar do Sorteio."
    },
    RECUSA_MANIPULADOS_B2C: {
        detectores: ["manipulado", "manipulados", "manipulacao", "manipulação", "formula", "fórmula", "mandar fazer", "aviamento"],
        mensagemInjetada: "[RECUSA_MANIPULADOS] Use exatamente: \"Olá! Agradecemos o contato. Nós não realizamos manipulação de medicamentos, mas desejamos melhoras rápidas para o pet! Se precisar de outros de fábrica, estamos aqui. 🐾\""
    },
    COMBO_VET_EM_CASA_MULTIPLAS_B2C: {
        detectores: ["vacina", "v8", "v10", "raiva", "gripe", "giardia", "antirrábica", "antirrabica", "vacinacao", "vacinação"],
        mensagemInjetada: "[COMERCIAL:COMBO_VET] Ofereça aplicar todas as vacinas na mesma visita sem taxa extra."
    }
};

// =========================================================================
// REGRAS B2B: Para Veterinários — Persona Dr. Kyenner 🩺
// =========================================================================
const REGRAS_B2B = {
    UPSELL_VACINA_COMBO_B2B: {
        detectores: ["vacina", "rabisin", "nobivac", "v8", "v10", "raiva", "gripe", "giardia", "antirrábica", "antirrabica", "injetavel", "injetável", "biológico", "biologico"],
        mensagemInjetada: "[COMERCIAL:VACINA_COMBO] Ofereça caixa fechada com desconto. Pergunte quantas doses/mês aplica. Inclua proativamente 100 seringas e agulhas para aplicação como excelente custo-benefício."
    },
    UPSELL_SERINGA_COMBO_B2B: {
        detectores: ["seringa", "agulha", "insumo", "insumos", "cateter", "scalp", "descartável"],
        mensagemInjetada: "[COMERCIAL:SERINGA_COMBO] Ofereça caixa de 100 seringas/agulhas e sugira o modelo ideal conforme a via de aplicação."
    },
    UPSELL_LIBRELA_B2B: {
        detectores: ["librela", "osteoartrite", "articular", "artrite", "osteoartrose"],
        mensagemInjetada: "[COMERCIAL:UPSELL_LIBRELA] Ofereça desconto progressivo a partir de 3 ampolas."
    },
    UPSELL_SIMPARIC_B2B: {
        detectores: ["simparic", "antipulgas", "antipulga", "nexgard", "bravecto", "isoxazolina"],
        mensagemInjetada: "[COMERCIAL:UPSELL_SIMPARIC] Ofereça caixa de 10 un no atacado."
    },
    NOTA_FISCAL_B2B: {
        detectores: ["nota fiscal", "nf", "cnpj", "faturar", "faturamento", "boleto", "prazo"],
        mensagemInjetada: "[COMERCIAL:NF] Emitimos NF completa para CNPJ."
    },
    CROSS_SELL_METILFORAN_B2B: {
        detectores: ["metilforan", "renal", "rim", "doença renal", "insuficiencia renal"],
        mensagemInjetada: "[COMERCIAL:METILFORAN] Ofereça em 30, 60 e 90 comp."
    },
    CHAVE_PIX_B2B: {
        detectores: ["pix", "pagar", "pagamento", "transferencia", "transferência", "conta bancaria"],
        mensagemInjetada: "[COMERCIAL:PAGAMENTO] Pix: *(31) 98793-6822*. Boleto para 15 dias disponível."
    },
    RECUSA_MANIPULADOS_B2B: {
        detectores: ["manipulado", "manipulação", "formula", "fórmula", "aviamento", "compounding"],
        mensagemInjetada: "[COMERCIAL:RECUSA_MANIPULADOS] Diga que não fazemos manipulação. Ofereça industrializados."
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
    verificarOportunidadeVenda,
    REGRAS_B2B,
    REGRAS_B2C
};
