/**
 * Mascaramento de PII (Personally Identifiable Information).
 *
 * Aplicado antes de salvar mensagens em `conversas_log.jsonl` e no
 * `pares_treinamento.jsonl`. Conformidade com LGPD: farmácia veterinária
 * lida com CPF/CRMV e o log fica em disco sem criptografia.
 *
 * O que mascara:
 *   - CPF (123.456.789-00 ou 12345678900)         → ***.***.***-00
 *   - CNPJ (12.345.678/0001-90 ou 12345678000190) → **.***.***/****-90
 *   - CRMV (CRMV-MG 12345 ou CRMV 12345)          → CRMV ****5
 *   - Email                                         → ***@dominio
 *   - CEP (12345-678)                              → *****-***
 *   - Telefone dentro de mensagem (extra)          → (**) ****-1234
 *
 * NÃO mascara o campo `phone` do log estruturado — esse é necessário pra
 * cruzar com Chatwoot e pro motor de recompra. Phone é PII também mas o
 * mascaramento aplica ao CONTEÚDO de mensagens, não ao identificador.
 */

const REGEX_CPF = /\b(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})\b/g;
const REGEX_CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?(\d{2})\b/g;
const REGEX_CRMV = /\bcrmv[\s\-\/]*(?:[a-z]{2})?[\s\-\/]*(\d{2,5})(\d)\b/gi;
const REGEX_EMAIL = /([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})/gi;
const REGEX_CEP = /\b\d{5}-?\d{3}\b/g;
const REGEX_TELEFONE = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\s?\d{4}-?\d{4}\b/g;

function mascararTexto(s) {
    if (!s || typeof s !== 'string') return s;
    return s
        .replace(REGEX_CPF, '***.***.***-$2')
        .replace(REGEX_CNPJ, '**.***.***/****-$1')
        .replace(REGEX_CRMV, 'CRMV ****$2')
        .replace(REGEX_EMAIL, '***@$2')
        .replace(REGEX_CEP, '*****-***')
        .replace(REGEX_TELEFONE, (m) => {
            // Mantém últimos 4 dígitos
            const ultimos = m.replace(/\D/g, '').slice(-4);
            return `(**)****-${ultimos}`;
        });
}

/**
 * Aplica mascaramento em campos comuns do log estruturado.
 * NÃO toca em `phone`, `timestamp`, `persona`, `owner` — só nos textos.
 */
function mascararLog(dados) {
    if (!dados || typeof dados !== 'object') return dados;
    const enabled = (process.env.MASCARAR_PII_ENABLED || 'true') === 'true';
    if (!enabled) return dados;

    const copia = { ...dados };
    if (copia.clientMessage) copia.clientMessage = mascararTexto(copia.clientMessage);
    if (copia.responseText) copia.responseText = mascararTexto(copia.responseText);
    if (copia.clientName) {
        // Nome também pode ter sobrenome pessoal — mantém só primeiro nome
        copia.clientName = copia.clientName.split(/\s+/)[0];
    }
    return copia;
}

module.exports = {
    mascararTexto,
    mascararLog
};
