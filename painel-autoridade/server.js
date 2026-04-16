const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 4000;
const DB_FILE = path.join(__dirname, 'contexto_mestre.json');

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
        data.versao = "1.0";
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
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        projeto: req.body.projeto || "Geral",
        autonomia: req.body.autonomia || "manual", // manual, semi, auto
        proxima_revisao: req.body.proxima_revisao || "",
        criado_em: new Date().toISOString()
    };
    data.tarefas.push(newTask);
    writeDB(data);
    res.status(201).json(newTask);
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
    const data = readDB();
    const taskIndex = data.tarefas.findIndex(t => t.id === req.params.id);
    if (taskIndex === -1) {
        return res.status(404).json({ error: "Tarefa não encontrada" });
    }
    
    data.tarefas[taskIndex] = {
        ...data.tarefas[taskIndex],
        ...req.body
    };
    
    writeDB(data);
    res.json(data.tarefas[taskIndex]);
});

// DELETE /api/tasks/:id
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

app.listen(PORT, () => {
    console.log(`⚙️  Painel de Autoridade rodando em http://localhost:${PORT}`);
    console.log(`📁 Banco de dados conectado: ${DB_FILE}`);
});
