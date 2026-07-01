/**
 * OTIMIZA FARMAVET — DETECTOR DE INJEÇÃO E SEGURANÇA (SNC-SHIELD)
 *
 * Filtro estático (Camada 1) que analisa se a mensagem de entrada do cliente
 * contém assinaturas ou tentativas de "prompt injection" (white prompt, jailbreaks, 
 * instruções de override do sistema, etc.).
 */

const BLACKLIST_INJECAO = [
    "ignore as instrucoes",
    "ignore todas as instrucoes",
    "esqueça as regras",
    "esqueça tudo",
    "ignore tudo o que foi dito",
    "ignore tudo o que foi escrito",
    "voce agora e",
    "você agora é",
    "aja como",
    "system override",
    "prompt de sistema",
    "instruction override",
    "regras de sistema",
    "developer mode",
    "modo desenvolvedor",
    "esqueça que você é",
    "desconsidere as instrucoes",
    "ignore o prompt",
    "ignore as instrucoes anteriores",
    "ignore as instruções anteriores"
];

function normalizarTexto(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .trim();
}

/**
 * Analisa a mensagem do cliente.
 * Retorna { detectado: boolean, motivo: string|null }
 */
function analisarMensagem(mensagem) {
    if (!mensagem || typeof mensagem !== 'string') {
        return { detectado: false, motivo: null };
    }

    const textoNormalizado = normalizarTexto(mensagem);

    // 1. Verificar termos na blacklist
    for (const termo of BLACKLIST_INJECAO) {
        const termoNormalizado = normalizarTexto(termo);
        if (textoNormalizado.includes(termoNormalizado)) {
            return { 
                detectado: true, 
                motivo: `Tentativa de injeção de prompt: termo proibido "${termo}" localizado.` 
            };
        }
    }

    // 2. Limitar tamanho máximo de caracteres da mensagem de entrada como proteção (DoS / Copypasta injection)
    if (mensagem.length > 800) {
        return { 
            detectado: true, 
            motivo: `Tamanho de payload suspeito (${mensagem.length} caracteres, limite máximo 800).` 
        };
    }

    return { detectado: false, motivo: null };
}

module.exports = {
    analisarMensagem,
    normalizarTexto
};
