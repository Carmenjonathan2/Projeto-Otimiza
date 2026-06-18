const PRE_APPROVED_CRMVS = new Set((process.env.CRMV_TEST_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean));

/**
 * Valida a regularidade de um CRMV.
 * Como o portal oficial do Siscad CFMV possui barreiras de CAPTCHA, a validação síncrona
 * em tempo real em produção é delegada para verificação humana por segurança comercial.
 */
async function validarCRMV(crmv, uf = 'MG') {
    console.log(`[CFMV] Validando CRMV: ${crmv} (${uf})...`);
    
    // 1. Validar formato básico (deve conter apenas números e ter entre 3 e 6 dígitos)
    const crmvLimpo = crmv.replace(/\D/g, '');
    if (!/^\d{3,6}$/.test(crmvLimpo)) {
        return { valido: false, motivo: "Formato de CRMV inválido (deve conter apenas de 3 a 6 dígitos numéricos)." };
    }

    // 2. Liberar de forma instantânea CRMVs conhecidos/usados nos testes (APENAS em ambiente de teste)
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.MODO_TESTE === 'true';
    if (isTestEnv && PRE_APPROVED_CRMVS.has(crmvLimpo)) {
        console.log(`[CFMV] CRMV ${crmvLimpo} pré-aprovado para testes de integração.`);
        return { valido: true, nome: null, fonte: 'whitelist-teste' };
    }



    // 4. Em produção real, por segurança de compliance contra fraude cadastral,
    // exige-se validação manual posterior caso seja um CRMV desconhecido
    console.warn(`[CFMV] CRMV ${crmvLimpo} não localizado nos registros rápidos. Encaminhando para verificação manual.`);
    return { valido: false, motivo: "Cadastro pendente de validação humana direta no portal do CFMV." };
}

module.exports = {
    validarCRMV
};
