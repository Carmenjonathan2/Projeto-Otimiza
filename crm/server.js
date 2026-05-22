require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const rotas = require('./rotas');

const PORT = process.env.CRM_PORT || 3001;

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: { origin: '*' }
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Disponibiliza io para as rotas via app.get('io')
app.set('io', io);

// ── Rotas ──────────────────────────────────────────────────────────────────
app.use('/api', rotas);

// ── WebSocket ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[WS] Cliente conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[WS] Cliente desconectado: ${socket.id}`);
    });
});

// ── Start ──────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`\n🧠 CRM Comercial ativo em http://localhost:${PORT}`);
    console.log(`📡 WebSocket pronto para o dashboard`);
    console.log(`🤖 IA: ${process.env.ANTHROPIC_API_KEY ? 'ATIVA' : 'DESATIVADA (configure ANTHROPIC_API_KEY no .env)'}\n`);
});

module.exports = { app, io };
