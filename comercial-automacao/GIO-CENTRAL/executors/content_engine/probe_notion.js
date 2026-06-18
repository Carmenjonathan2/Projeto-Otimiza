const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function checkDatabase() {
    try {
        const response = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
        console.log("Database Name:", response.title[0].plain_text);
        console.log("Database URL:", response.url);
    } catch (e) {
        console.error(e.message);
    }
}

checkDatabase();
