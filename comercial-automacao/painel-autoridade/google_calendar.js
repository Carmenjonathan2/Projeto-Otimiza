const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

class GoogleCalendarService {
    constructor() {
        this.oAuth2Client = null;
        this.loadCredentials();
    }

    loadCredentials() {
        if (fs.existsSync(CREDENTIALS_PATH)) {
            const content = fs.readFileSync(CREDENTIALS_PATH);
            const credentials = JSON.parse(content);
            const config = credentials.installed || credentials.web;
            const { client_secret, client_id } = config;
            
            // Se não houver redirect_uris no JSON, usamos o padrão do nosso servidor
            const redirectUri = (config.redirect_uris && config.redirect_uris[0]) || 'http://localhost:4000/api/auth/google/callback';
            
            this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);
            
            if (fs.existsSync(TOKEN_PATH)) {
                const token = fs.readFileSync(TOKEN_PATH);
                this.oAuth2Client.setCredentials(JSON.parse(token));
            }
        }
    }

    getAuthUrl() {
        if (!this.oAuth2Client) throw new Error("Arquivo credentials.json não encontrado!");
        return this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
    }

    async saveToken(code) {
        const { tokens } = await this.oAuth2Client.getToken(code);
        this.oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        return tokens;
    }

    isConnected() {
        return this.oAuth2Client && this.oAuth2Client.credentials && Object.keys(this.oAuth2Client.credentials).length > 0;
    }

    async syncTasks(tasks) {
        if (!this.isConnected()) throw new Error("Google Calendar não conectado!");

        const calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
        
        // Busca ou cria o calendário "Otimiza Dashboard"
        let calendarId = 'primary'; // Por padrão, usa o principal. Podemos criar um específico depois.

        for (const task of tasks) {
            if (!task.proxima_revisao) continue;

            const startTime = new Date(task.proxima_revisao);
            
            // 🛡️ PROTEÇÃO: Validar se a data é válida (evita erros com "Diário", "Futuro", etc)
            if (!task.proxima_revisao || isNaN(startTime.getTime())) {
                console.log(`[Google Calendar] Ignorando "${task.titulo}": Data inválida ou termo não-data ("${task.proxima_revisao}")`);
                continue;
            }

            const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutos de duração

            const event = {
                summary: `[OTIMIZA] ${task.titulo}`,
                description: `${task.descricao}\n\nProjeto: ${task.projeto}\nAutonomia: ${task.autonomia}`,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 10 },
                    ],
                },
            };

            try {
                await calendar.events.insert({
                    calendarId,
                    resource: event,
                });
                console.log(`Evento criado: ${task.titulo}`);
            } catch (err) {
                console.error(`Erro ao criar evento para ${task.titulo}:`, err);
            }
        }
    }
}

module.exports = new GoogleCalendarService();
