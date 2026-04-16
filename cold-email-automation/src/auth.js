const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const ACCOUNT_ID = process.env.ACCOUNT_ID;
const TOKEN_PATH = path.join(process.cwd(), ACCOUNT_ID ? `token_${ACCOUNT_ID}.json` : 'token.json');

async function getAuthClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    try {
        const token = await fs.readFile(TOKEN_PATH);
        oauth2Client.setCredentials(JSON.parse(token));
        return oauth2Client;
    } catch (error) {
        console.log("Token não encontrado ou expirado. Você precisa gerar um novo token.");
        return oauth2Client; // Retorna o client para que o index.js possa lidar com a autorização inicial
    }
}

async function saveToken(client) {
    const payload = JSON.stringify(client.credentials);
    await fs.writeFile(TOKEN_PATH, payload);
    console.log('Token salvo em:', TOKEN_PATH);
}

module.exports = { getAuthClient, saveToken };
