const validator = require("email-validator");
const dns = require("dns").promises;

/**
 * Valida se um e-mail é sintaticamente correto e se o domínio possui registros MX (servidor de e-mail).
 * @param {string} email 
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
async function validateEmail(email) {
    if (!email || email.trim() === "") {
        return { valid: false, reason: "E-mail vazio" };
    }

    // 1. Validação de Sintaxe
    if (!validator.validate(email)) {
        return { valid: false, reason: "Sintaxe inválida" };
    }

    // 2. Validação de Domínio (MX Records)
    const domain = email.split("@")[1];
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
            return { valid: false, reason: "Domínio sem servidor de e-mail" };
        }
        return { valid: true };
    } catch (error) {
        console.error(`Erro ao resolver MX para ${domain}:`, error.message);
        return { valid: false, reason: "Domínio inexistente ou inacessível" };
    }
}

module.exports = { validateEmail };
