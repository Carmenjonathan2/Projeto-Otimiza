const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'cold-email-automation', '.env') });

// CONFIGURAÇÕES
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; // Precisará ser adicionado ao .env
const SHOPIFY_STORE_URL = "otimizafarmavet.myshopify.com";

const DB_FILE = path.join(__dirname, '..', '..', '..', 'estoque_validades.json');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Inicializa DB se não existir
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));

/**
 * Função para buscar o link do produto no Shopify
 */
async function getShopifyLink(productName) {
    if (!SHOPIFY_ACCESS_TOKEN) return `https://${SHOPIFY_STORE_URL}/search?q=${encodeURIComponent(productName)}`;
    
    try {
        const response = await axios.get(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/products.json?title=${encodeURIComponent(productName)}`, {
            headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN }
        });
        const products = response.data.products;
        if (products && products.length > 0) {
            return `https://${SHOPIFY_STORE_URL}/products/${products[0].handle}`;
        }
    } catch (e) {
        console.error("Erro Shopify Search:", e.message);
    }
    return `https://${SHOPIFY_STORE_URL}/search?q=${encodeURIComponent(productName)}`;
}

/**
 * Converte arquivo em Part do Generative AI
 */
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

/**
 * Processa a imagem via Gemini
 */
async function processImage(imagePath) {
    console.log("🧠 Analisando imagem com Gemini Vision...");
    const prompt = "Analise esta foto de produto veterinário e extraia: 1. Nome exato do produto, 2. Data de validade (formato DD/MM/AAAA), 3. Quantidade total de itens se visível. Retorne APENAS um JSON no formato: { \"nome\": \"string\", \"validade\": \"string\", \"quantidade\": \"number|null\" }";
    
    const imagePart = fileToGenerativePart(imagePath, "image/jpeg");
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    try {
        const cleanJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Erro ao parsear resposta da IA:", text);
        return null;
    }
}

/**
 * Loop de Polling do Telegram
 */
let lastUpdateId = 0;
async function pollTelegram() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
        const updates = response.data.result;

        for (const update of updates) {
            lastUpdateId = update.update_id;
            const msg = update.message;
            if (!msg) continue;

            const chatId = msg.chat.id;

            // COMANDO DE INÍCIO/AJUDA
            if (msg.text === '/start' || msg.text === '/ajuda') {
                const help = `🍎 *Bem-vindo ao Estoque Inteligente Otimiza!*\n\nComigo você pode:\n1. 📸 *Enviar uma foto* do produto para cadastrar a validade.\n2. 📋 Usar /lista para ver o que está vencendo.\n3. 🔍 Eu busco o link no Shopify automaticamente para você!`;
                await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: chatId, text: help, parse_mode: 'Markdown' });
                continue;
            }

            // COMANDO DE LISTAGEM RÁPIDA
            if (msg.text === '/lista') {
                if (!fs.existsSync(DB_FILE)) {
                    await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=Nenhum produto cadastrado ainda.`);
                    continue;
                }
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (db.length === 0) {
                    await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=O estoque está vazio.`);
                    continue;
                }
                
                let summary = "📋 *Resumo de Validades:*\n\n";
                db.slice(-10).forEach(i => {
                    summary += `🔹 *${i.nome}*: ${i.validade}\n`;
                });
                await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { chat_id: chatId, text: summary, parse_mode: 'Markdown' });
                continue;
            }

            if (msg.photo) {
                const photo = msg.photo[msg.photo.length - 1]; // Maior qualidade
                const fileId = photo.file_id;

                console.log(`📸 Foto recebida de ${msg.from.first_name}...`);
                await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=Recebido! Processando os dados da validade... 🐾`);

                // Baixar foto
                const fileInfo = await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${fileId}`);
                const filePath = fileInfo.data.result.file_path;
                const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${filePath}`;
                
                const localPath = path.join(__dirname, 'temp_product.jpg');
                const writer = fs.createWriteStream(localPath);
                const imgRes = await axios.get(fileUrl, { responseType: 'stream' });
                imgRes.data.pipe(writer);

                writer.on('finish', async () => {
                    const data = await processImage(localPath);
                    if (data) {
                        data.linkShopify = await getShopifyLink(data.nome);
                        data.dataCadastro = new Date().toISOString();
                        
                        const db = JSON.parse(fs.readFileSync(DB_FILE));
                        db.push(data);
                        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

                        const reply = `✅ *Produto Cadastrado!*\n\n📦 *Nome:* ${data.nome}\n📅 *Validade:* ${data.validade}\n🔢 *Qtd:* ${data.quantidade || 'N/A'}\n🔗 [Link Shopify](${data.linkShopify})`;
                        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                            chat_id: chatId,
                            text: reply,
                            parse_mode: 'Markdown'
                        });
                        console.log(`✔️ Sucesso: ${data.nome} cadastrado.`);
                    } else {
                        await axios.get(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=❌ Não consegui ler os dados. Tente tirar uma foto mais clara da etiqueta de validade.`);
                    }
                    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
                });
            }
        }
    } catch (e) {
        console.error("Erro Polling:", e.message);
    }
    setTimeout(pollTelegram, 1000);
}

console.log("🚀 Bot de Estoque Inteligente ATIVO e aguardando fotos...");
pollTelegram();
