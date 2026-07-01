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
        const ACCOUNT_ID = process.env.ACCOUNT_ID;
        const TOKEN_PATH = ACCOUNT_ID ? `./cold-email-automation/token_${ACCOUNT_ID}.json` : './cold-email-automation/token.json';
        const token = await fs.readFile(TOKEN_PATH);
        oauth2Client.setCredentials(JSON.parse(token));
        
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const res = await gmail.users.getProfile({ userId: 'me' });
        
        console.log(`Email detectado: ${res.data.emailAddress}`);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error.message);
    }
}

getEmail();
