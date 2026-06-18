/**
 * Backup diário do conversas_state.json + few_shot_aprovados.json.
 *
 * Funcionamento:
 *   1. Copia o estado atual pra backups/conversas_state_YYYY-MM-DD.json
 *   2. Copia o few_shot_aprovados.json (memória do "modo aprende")
 *   3. Mantém apenas os últimos BACKUP_RETENTION_DIAS (default 30)
 *   4. Loga tamanho antes/depois e quantidade retida
 *
 * Cron sugerido: diário 02:00 BRT via .github/workflows/backup-estado.yml
 */

const fs = require('fs');
const path = require('path');

console.log(`[INICIO] backup_estado_diario.js ${new Date().toISOString()}`);

const BACKUP_DIR = path.resolve(__dirname, '../backups');
const RETENTION = parseInt(process.env.BACKUP_RETENTION_DIAS || '30', 10);
const HOJE = new Date().toISOString().split('T')[0];

const arquivos = [
    { src: path.resolve(__dirname, '../conversas_state.json'), nome: 'conversas_state' },
    { src: path.resolve(__dirname, '../few_shot_aprovados.json'), nome: 'few_shot_aprovados' }
];

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backup({ src, nome }) {
    if (!fs.existsSync(src)) {
        console.log(`ℹ️ ${nome}: arquivo não existe, pulando.`);
        return { ok: false };
    }
    const dst = path.join(BACKUP_DIR, `${nome}_${HOJE}.json`);
    fs.copyFileSync(src, dst);
    const size = fs.statSync(dst).size;
    console.log(`💾 ${nome}: backup → ${path.basename(dst)} (${(size / 1024).toFixed(1)} KB)`);
    return { ok: true, dst, size };
}

function rotacionar() {
    if (!fs.existsSync(BACKUP_DIR)) return { removidos: 0 };
    const arqs = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
    const limite = Date.now() - RETENTION * 24 * 60 * 60 * 1000;
    let removidos = 0;
    for (const f of arqs) {
        const cheio = path.join(BACKUP_DIR, f);
        const m = f.match(/_(\d{4}-\d{2}-\d{2})\.json$/);
        if (!m) continue;
        const dataArq = new Date(m[1]).getTime();
        if (dataArq < limite) {
            fs.unlinkSync(cheio);
            removidos++;
        }
    }
    return { removidos };
}

try {
    const resultados = arquivos.map(a => ({ nome: a.nome, ...backup(a) }));
    const { removidos } = rotacionar();
    const total = resultados.filter(r => r.ok).length;
    console.log(`🧹 Rotação de retenção (>${RETENTION}d): ${removidos} arquivos removidos.`);
    console.log(`[OK] backup_estado_diario.js ${new Date().toISOString()} — Backups: ${total}, Removidos: ${removidos}`);
} catch (err) {
    console.error(`[ERRO] backup_estado_diario.js ${err.message}`);
    process.exit(1);
}
