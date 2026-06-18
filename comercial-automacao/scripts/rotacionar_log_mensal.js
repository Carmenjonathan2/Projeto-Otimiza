/**
 * Rotaciona conversas_log.jsonl e validacoes_reprovadas.jsonl mensalmente.
 *
 * Funcionamento:
 *   1. Lê o JSONL atual.
 *   2. Separa entradas do mês anterior em arquivo `<base>_YYYY-MM.jsonl.gz`.
 *   3. Mantém só entradas do mês atual no arquivo principal.
 *   4. Comprime os arquivos arquivados com gzip pra economizar disco.
 *
 * Rodar no dia 1 de cada mês via cron / GitHub Actions.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log(`[INICIO] rotacionar_log_mensal.js ${new Date().toISOString()}`);

const arquivosAlvo = [
    { path: path.resolve(__dirname, '../conversas_log.jsonl'), base: 'conversas_log' },
    { path: path.resolve(__dirname, '../validacoes_reprovadas.jsonl'), base: 'validacoes_reprovadas' }
];

const archiveDir = path.resolve(__dirname, '../log_archive');
if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
}

function rotacionar({ path: filePath, base }) {
    if (!fs.existsSync(filePath)) {
        console.log(`ℹ️ ${base}: arquivo não existe, pulando.`);
        return { rotated: 0, kept: 0 };
    }

    const conteudo = fs.readFileSync(filePath, 'utf8').trim();
    if (!conteudo) {
        console.log(`ℹ️ ${base}: arquivo vazio, pulando.`);
        return { rotated: 0, kept: 0 };
    }

    const linhas = conteudo.split('\n').filter(Boolean);
    const mesAtual = new Date().toISOString().substring(0, 7); // YYYY-MM

    // Agrupar por mês
    const porMes = new Map();
    const linhasManter = [];
    const linhasInvalidas = [];

    for (const linha of linhas) {
        try {
            const entry = JSON.parse(linha);
            const mes = (entry.timestamp || '').substring(0, 7);
            if (!mes || mes === mesAtual) {
                linhasManter.push(linha);
            } else {
                if (!porMes.has(mes)) porMes.set(mes, []);
                porMes.get(mes).push(linha);
            }
        } catch (e) {
            linhasInvalidas.push(linha);
        }
    }

    let rotated = 0;
    for (const [mes, linhasMes] of porMes.entries()) {
        const arquivoArq = path.join(archiveDir, `${base}_${mes}.jsonl.gz`);
        const novoConteudo = linhasMes.join('\n') + '\n';

        // Se já existe arquivo do mês, concatena (caso a rotação tenha rodado 2x)
        let conteudoFinal = novoConteudo;
        if (fs.existsSync(arquivoArq)) {
            try {
                const existente = zlib.gunzipSync(fs.readFileSync(arquivoArq)).toString('utf8');
                conteudoFinal = existente + novoConteudo;
            } catch (e) {
                console.warn(`⚠️ ${base}: falha ao ler arquivo arquivado de ${mes}: ${e.message}`);
            }
        }

        const gz = zlib.gzipSync(Buffer.from(conteudoFinal, 'utf8'));
        fs.writeFileSync(arquivoArq, gz);
        console.log(`📦 ${base}: ${linhasMes.length} linhas de ${mes} arquivadas em ${path.basename(arquivoArq)} (${(gz.length / 1024).toFixed(1)} KB).`);
        rotated += linhasMes.length;
    }

    // Sobrescrever arquivo principal apenas com entradas do mês atual
    if (rotated > 0) {
        const novoConteudoPrincipal = linhasManter.length > 0 ? linhasManter.join('\n') + '\n' : '';
        fs.writeFileSync(filePath, novoConteudoPrincipal, 'utf8');
        console.log(`✅ ${base}: arquivo principal compactado, mantidas ${linhasManter.length} linhas do mês ${mesAtual}.`);
    }

    if (linhasInvalidas.length > 0) {
        console.warn(`⚠️ ${base}: ${linhasInvalidas.length} linhas inválidas ignoradas.`);
    }

    return { rotated, kept: linhasManter.length };
}

try {
    const resultados = arquivosAlvo.map(alvo => ({
        base: alvo.base,
        ...rotacionar(alvo)
    }));

    const totalRotated = resultados.reduce((s, r) => s + r.rotated, 0);
    const resumo = resultados.map(r => `${r.base}: ${r.rotated} arq / ${r.kept} mant`).join(' | ');
    console.log(`[OK] rotacionar_log_mensal.js ${new Date().toISOString()} Resumo: ${resumo}`);

    // Notificar Telegram se configurado
    if (totalRotated > 0 && process.env.TELEGRAM_BOT_TOKEN) {
        const axios = require('axios');
        const chatId = process.env.TELEGRAM_CHAT_ID
            || (process.env.TELEGRAM_CHAT_IDS && process.env.TELEGRAM_CHAT_IDS.split(',')[0]);
        if (chatId) {
            axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: `🗂️ <b>Rotação mensal de logs</b>\n\n${resumo}`,
                parse_mode: 'HTML'
            }).catch(e => console.error('Telegram falhou:', e.message));
        }
    }
} catch (err) {
    console.error(`[ERRO] rotacionar_log_mensal.js ${err.message}`);
    process.exit(1);
}
