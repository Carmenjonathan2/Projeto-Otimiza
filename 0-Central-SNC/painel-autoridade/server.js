const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const { v4: uuidv4 } = require('uuid');
const googleCalendar = require('./google_calendar');

const app = express();
const PORT = 4000;
const DB_FILE = path.join(__dirname, 'contexto_mestre.json');
const GIO_STRATEGY_FILE = path.join(__dirname, '..', 'GIO-CENTRAL', 'data', 'current_strategy.json');
const GIO_ABC_FILE = path.join(__dirname, '..', 'GIO-CENTRAL', 'data', 'dados_vendas_gio.json');
const GIO_NOTIFY_FILE = path.join(__dirname, '..', 'GIO-CENTRAL', 'data', 'notifications.json');

// GET /api/gio (Inteligência do Cérebro)
app.get('/api/gio', (req, res) => {
    try {
        const strategy = fs.existsSync(GIO_STRATEGY_FILE) ? JSON.parse(fs.readFileSync(GIO_STRATEGY_FILE, 'utf8')) : null;
        const abc = fs.existsSync(GIO_ABC_FILE) ? JSON.parse(fs.readFileSync(GIO_ABC_FILE, 'utf8')) : [];
        const alerts = fs.existsSync(GIO_NOTIFY_FILE) ? JSON.parse(fs.readFileSync(GIO_NOTIFY_FILE, 'utf8')) : [];
        
        res.json({
            strategy,
            abc: abc.slice(0, 5),
            alerts: alerts.reverse().slice(0, 3), // Últimos 3 alertas
            ultima_leitura: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: "Erro ao ler inteligência GIO" });
    }
});

// --- SEGURANÇA NÍVEL HARD ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "cdn.jsdelivr.net", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"]
        },
    },
})); 
// Removido xss-clean global porque causava erro de query read-only. 
// Usaremos a sanitização dirigida no endpoint de agendamento.
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate Limit: Máximo 30 requisições por IP a cada 15 minutos nas rotas de API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Muitas solicitações deste IP, tente novamente mais tarde.' }
});
app.use('/api/', apiLimiter);

// Rate Limit agressivo para agendamentos (10 por hora)
const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Limite de agendamentos por hora excedido para este IP.' }
});

// Helper para ler DB
const readDB = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const initialData = { 
                versao: "1.0", 
                tarefas: [],
                campanhas: [],
                agendamentos: []
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (!data.campanhas) data.campanhas = [];
        if (!data.agendamentos) data.agendamentos = [];
        return data;
    } catch (err) {
        console.error("Erro ao ler o banco de dados", err);
        return { tarefas: [], campanhas: [], agendamentos: [] };
    }
};

// Helper para salvar DB
const writeDB = (data) => {
    try {
        // Preserva a versão atual se existir, senão define como 1.0
        data.versao = data.versao || "1.0";
        data.ultima_atualizacao = new Date().toISOString();
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Erro ao salvar o banco de dados", err);
    }
};

// GET /api/contexto (Retorna tudo, incluindo a memória)
app.get('/api/contexto', (req, res) => {
    const data = readDB();
    res.json(data);
});

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
    const data = readDB();
    res.json(data.tarefas);
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
    const data = readDB();
    const newTask = {
        id: Date.now().toString(),
        titulo: req.body.titulo || "Nova Tarefa",
        descricao: req.body.descricao || "",
        coluna: req.body.coluna || "cofre", // motor, gargalo, cofre
        tags: Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? [req.body.tags] : []),
        projeto: req.body.projeto || "Geral",
        autonomia: req.body.autonomia || "manual", // manual, semi, auto
        proxima_revisao: req.body.proxima_revisao || "",
        criado_em: new Date().toISOString()
    };
    data.tarefas.push(newTask);
    writeDB(data);

    // Sincronização Automática com Google Calendar (se houver data válida)
    if (newTask.proxima_revisao && googleCalendar.isConnected()) {
        googleCalendar.syncTasks([newTask]).catch(err => console.error("Erro no Auto-Sync Google:", err));
    }

    res.status(201).json(newTask);
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
    const data = readDB();
    const taskIndex = data.tarefas.findIndex(t => t.id === req.params.id);
    if (taskIndex === -1) {
        return res.status(404).json({ error: "Tarefa não encontrada" });
    }
    
    // Mesclar dados garantindo que o ID não mude e as tags sejam tratadas como array
    const updatedTask = {
        ...data.tarefas[taskIndex],
        ...req.body,
        id: req.params.id // Garante o ID
    };

    if (req.body.tags && !Array.isArray(req.body.tags)) {
        updatedTask.tags = [req.body.tags];
    }
    
    data.tarefas[taskIndex] = updatedTask;
    writeDB(data);

    // Sincronização Automática com Google Calendar (se houver data válida)
    if (updatedTask.proxima_revisao && googleCalendar.isConnected()) {
        googleCalendar.syncTasks([updatedTask]).catch(err => console.error("Erro no Auto-Sync Google:", err));
    }

    res.json(updatedTask);
});

// ===================================
// GOOGLE CALENDAR ENDPOINTS
// ===================================

app.get('/api/auth/google', (req, res) => {
    try {
        const url = googleCalendar.getAuthUrl();
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: "Erro ao gerar URL de autenticação. Verifique o arquivo credentials.json." });
    }
});

app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        await googleCalendar.saveToken(code);
        res.send('<h1>Autenticado com sucesso!</h1><p>Você pode fechar esta aba e voltar para o Painel.</p><script>setTimeout(() => window.close(), 3000)</script>');
    } catch (err) {
        res.status(500).send('Erro na autenticação: ' + err.message);
    }
});

app.get('/api/auth/status', (req, res) => {
    res.json({ connected: googleCalendar.isConnected() });
});

app.post('/api/sync/calendar', async (req, res) => {
    try {
        const data = readDB();
        await googleCalendar.syncTasks(data.tarefas);
        res.json({ message: "Sincronização concluída com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
    const data = readDB();
    const initialLength = data.tarefas.length;
    data.tarefas = data.tarefas.filter(t => t.id !== req.params.id);
    
    if (data.tarefas.length === initialLength) {
        return res.status(404).json({ error: "Tarefa não encontrada" });
    }
    
    writeDB(data);
    res.json({ message: "Tarefa excluída com sucesso" });
});

// ===================================
// ROTAS PÚBLICAS (AGENDAMENTO MORADOR)
// ===================================

// GET /api/public/campanha/:id (Busca slots por UUID)
app.get('/api/public/campanha/:id', (req, res) => {
    const data = readDB();
    const campanha = data.campanhas.find(c => c.id === req.params.id);
    
    if (!campanha) {
        return res.status(404).json({ error: "Campanha não encontrada ou expirada." });
    }

    // Retornamos apenas o nome do condomínio e os slots (sem dados sensíveis)
    const agendados = data.agendamentos.filter(a => a.campanhaId === campanha.id);
    const slotsOcupados = agendados.map(a => a.horario);

    res.json({
        condominio: campanha.condominio,
        data: campanha.data,
        slots: campanha.slots.map(s => ({
            horario: s,
            disponivel: !slotsOcupados.includes(s)
        }))
    });
});

// POST /api/public/book (Realiza o agendamento)
app.post('/api/public/book', bookingLimiter, [
    body('campanhaId').isUUID(4),
    body('nome').isLength({ min: 3, max: 100 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('telefone').matches(/^\d{10,11}$/),
    body('petNome').isLength({ min: 1, max: 50 }).trim().escape(),
    body('horario').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Dados inválidos. Verifique seu e-mail e se o telefone tem DDD+9 dígitos." });
    }

    const { campanhaId, nome, email, telefone, petNome, horario } = req.body;
    const data = readDB();

    // Sanitização manual adicional Nível Hard
    const safeNome = xss(nome);
    const safePet = xss(petNome);
    const safeEmail = xss(email);

    // Validar se campanha existe
    const campanha = data.campanhas.find(c => c.id === campanhaId);
    if (!campanha) return res.status(404).json({ error: "Campanha inválida." });

    // Validar se horário está disponível
    const jaOcupado = data.agendamentos.some(a => a.campanhaId === campanhaId && a.horario === horario);
    if (jaOcupado) return res.status(400).json({ error: "Este horário já foi preenchido por outro morador." });

    // Gravar agendamento
    const novoAgendamento = {
        id: uuidv4(),
        campanhaId,
        nome: safeNome,
        email: safeEmail,
        telefone,
        petNome: safePet,
        horario,
        criado_em: new Date().toISOString()
    };

    data.agendamentos.push(novoAgendamento);
    writeDB(data);

    res.status(201).json({ message: "Agendamento confirmado com sucesso! Nos vemos no sábado." });
});

// GET /saude (Painel de Saúde para a Carmen)
app.get('/saude', (req, res) => {
    console.log(`[PAINEL-SAUDE] Visita ao painel de saúde em ${new Date().toISOString()}`);
    res.sendFile(path.join(__dirname, 'public', 'painel_saude.html'));
});

// GET /api/saude-dados
app.get('/api/saude-dados', (req, res) => {
    try {
        // Garantir dotenv carregado
        require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

        const custoFile = path.join(__dirname, '..', 'custo_diario.json');
        const logFile = path.join(__dirname, '..', 'conversas_log.jsonl');
        const relatoriosDir = path.join(__dirname, '..', 'relatorios');

        // 1. Ler custos
        let custos = {};
        if (fs.existsSync(custoFile)) {
            try {
                custos = JSON.parse(fs.readFileSync(custoFile, 'utf8'));
            } catch (e) {
                custos = {};
            }
        }

        const hojeStr = new Date().toISOString().split('T')[0];
        const esteMesStr = hojeStr.substring(0, 7); // "YYYY-MM"

        const custoHoje = custos[hojeStr] ? custos[hojeStr].custo_usd_estimado : 0.0;
        let custoMes = 0.0;
        for (const d of Object.keys(custos)) {
            if (d.startsWith(esteMesStr)) {
                custoMes += custos[d].custo_usd_estimado;
            }
        }

        const limitKillSwitch = parseFloat(process.env.CUSTO_KILL_SWITCH_USD || '10.00');
        const isMuted = process.env.MODO_SILENCIOSO === 'true';
        let statusKillSwitch = "verde";
        if (isMuted || custoHoje >= limitKillSwitch) {
            statusKillSwitch = "vermelho";
        } else if (custoHoje >= limitKillSwitch * 0.5) {
            statusKillSwitch = "amarelo";
        }

        // Últimos 7 dias de custos para sparkline
        const ultimos7Dias = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dStr = d.toISOString().split('T')[0];
            const diaCusto = custos[dStr] || { chamadas: 0, custo_usd_estimado: 0.0 };
            ultimos7Dias.push({
                data: dStr,
                chamadas: diaCusto.chamadas,
                custo: diaCusto.custo_usd_estimado
            });
        }

        // 2. Ler logs de conversas
        let logs = [];
        if (fs.existsSync(logFile)) {
            try {
                const content = fs.readFileSync(logFile, 'utf8');
                logs = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
            } catch (e) {
                logs = [];
            }
        }

        const agora = Date.now();
        const limite24h = agora - 24 * 60 * 60 * 1000;
        const logs24h = logs.filter(log => new Date(log.timestamp).getTime() >= limite24h);

        // Top 5 telefones por chamadas nas últimas 24h
        const phoneCounts = {};
        for (const log of logs24h) {
            const phone = log.phone;
            const name = log.clientName || 'Cliente';
            if (!phoneCounts[phone]) {
                phoneCounts[phone] = { phone, name, count: 0 };
            }
            phoneCounts[phone].count++;
        }
        const top5Phones = Object.values(phoneCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Calcular estatísticas das últimas 24h
        const sessoes24h = {};
        let totalInteracoes = logs24h.length;
        let shortCircuits = 0;
        let errosGemini = 0;

        for (const log of logs24h) {
            const phone = log.phone;
            if (!sessoes24h[phone]) {
                sessoes24h[phone] = { hasTransbordo: false };
            }
            const textLower = (log.responseText || '').toLowerCase();
            if (textLower.includes('transferir') || textLower.includes('transferindo') || textLower.includes('suporte manual') || log.owner === 'human') {
                sessoes24h[phone].hasTransbordo = true;
            }
            if (log.shortCircuit || log.responseText === '[trivial-no-reply]' || textLower === 'até mais!' || textLower === 'até logo! 🐾') {
                shortCircuits++;
            }
            if (log.error) {
                errosGemini++;
            }
        }

        const totalSessoes = Object.keys(sessoes24h).length;
        let transbordos = 0;
        for (const phone of Object.keys(sessoes24h)) {
            if (sessoes24h[phone].hasTransbordo) {
                transbordos++;
            }
        }

        const taxaTransbordo = totalSessoes > 0 ? ((transbordos / totalSessoes) * 100).toFixed(1) : "0.0";
        const pctShortCircuit = totalInteracoes > 0 ? ((shortCircuits / totalInteracoes) * 100).toFixed(1) : "0.0";
        const pctErros = totalInteracoes > 0 ? ((errosGemini / totalInteracoes) * 100).toFixed(1) : "0.0";

        // 3. Ler última análise semanal
        let relatorioHtml = "<p style='color: var(--text-light); text-align: center;'>Nenhuma análise semanal encontrada na pasta <code>relatorios</code>.</p>";
        if (fs.existsSync(relatoriosDir)) {
            try {
                const files = fs.readdirSync(relatoriosDir).filter(f => f.startsWith('analise_semanal_') && f.endsWith('.md'));
                if (files.length > 0) {
                    files.sort();
                    const ultimoArquivo = files[files.length - 1];
                    const relPath = path.join(relatoriosDir, ultimoArquivo);
                    const mdContent = fs.readFileSync(relPath, 'utf8');
                    
                    // Conversor simples Markdown para HTML
                    relatorioHtml = mdContent
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                        .replace(/^\* (.*$)/gim, '<li>$1</li>')
                        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
                        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                        .replace(/\n/gim, '<br />');
                }
            } catch (err) {
                console.error("Erro ao carregar análise semanal:", err.message);
            }
        }

        res.json({
            custo_hoje: custoHoje,
            custo_mes: custoMes,
            status_kill_switch: statusKillSwitch,
            limite_kill_switch: limitKillSwitch,
            modo_silencioso: isMuted,
            ultimos_7_dias: ultimos7Dias,
            top_5_phones: top5Phones,
            taxa_transbordo: taxaTransbordo,
            pct_short_circuit: pctShortCircuit,
            pct_erros: pctErros,
            relatorio_semanal_html: relatorioHtml,
            ultima_atualizacao: new Date().toISOString()
        });
    } catch (e) {
        console.error("Erro ao gerar dados de saúde:", e.message);
        res.status(500).json({ error: "Erro interno ao ler dados de saúde" });
    }
});

app.listen(PORT, () => {
    console.log(`⚙️  Painel de Autoridade rodando em http://localhost:${PORT}`);
    console.log(`📁 Banco de dados conectado: ${DB_FILE}`);
});
