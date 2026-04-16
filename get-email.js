const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: './cold-email-automation/.env' });

async function getEmail() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    try {
        const token = await fs.readFile('./cold-email-automation/token.json');
        oauth2Client.setCredentials(JSON.parse(token));
        
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const res = await gmail.users.getProfile({ userId: 'me' });
        
        console.log(`Email detectado: ${res.data.emailAddress}`);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error.message);
    }
}

getEmail();
