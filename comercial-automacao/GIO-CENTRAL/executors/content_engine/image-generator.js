const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Função responsável por gerar a imagem base do post (Módulo 5)
 * @param {string} sugestaoVisual 
 * @param {string} frenteDeNegocio - Identificador para customização do prompt baseado na persona
 * @param {string} temaPost - O nome do post para ser usado como base do arquivo salvo no disco
 * @returns {string} filePath
 */
async function gerarImagemBase(sugestaoVisual, frenteDeNegocio, temaPost = "post") {
    console.log(`\n🎨 Módulo 5: Gerando imagem base (Nano Banana 2 / Gemini 3 Flash Image)...`);

    // --- ESTILO VISUAL E CHARACTER SHEETS ---
    let characterInject = "";
    let estiloBase = "fotografia hiper-realista e corporativa";

    // Se estivermos gerando o post para Tutores, a persona visual será SEMPRE a Aika (no estilo animação)!
    if (frenteDeNegocio && frenteDeNegocio.includes("Tutor")) {
        estiloBase = "animação 3D de altíssima qualidade (no estilo visual de filmes como 'Pets - A Vida Secreta dos Bichos' da Illumination ou Pixar), muito fofa e expressiva";
        
        characterInject = `
        [INSTRUÇÃO CRÍTICA DE PERSONAGEM (AIKA)]: A imagem DEVE APRESENTAR e seguir fielmente os atributos da cadela 'Aika'. 
        A Aika é UMA CADELA ESTILO 3D. Ela tem PELAGEM BRANCA (CREME CLARO), MACIA E MAIS LISA/ESCORRIDA (repleta de volume fofinho), 
        OLHOS EXTREMAMENTE AZUIS CLAROS E PENETRANTES e um focinho/nariz na cor preta. As orelhas são caídas/semi-eretas, repletas de pelos. 
        A Aika deve ser o foco principal da imagem, com uma expressão curiosa, atenta, muito carismática e fofa.
        `;
    }

    const prompt = `Crie uma imagem em estilo ${estiloBase}, limpa, com iluminação de estúdio profissional e espaço negativo amplo. Use cores sólidas e amigáveis ou tons de roxo e lilás neutros de fundo/ambiente. 
    ${characterInject}
    Contexto visual da cena: ${sugestaoVisual}
    É ESTRITAMENTE PROIBIDO gerar ou renderizar letras, palavras, textos soltos ou marcas d'água em toda a imagem.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
        const result = await model.generateContent(prompt);
        
        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        let base64Image = null;
        for (const part of parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }

        if (base64Image) {
            // Cria um nome limpo para não quebrar no Windows (substitui espaços e caracteres especiais por underscore)
            const nomeSanitizado = (temaPost || 'arte_gerada').substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${nomeSanitizado}_${Date.now()}.png`;
            const filePath = path.join(__dirname, fileName);

            fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
            console.log(`   ✅ Arte gerada e salva com sucesso em: ${fileName}`);
            return filePath;
        } else {
            throw new Error("A API não retornou inlineData (dados da imagem). Estrutura recebida: " + JSON.stringify(parts));
        }
    } catch (error) {
        console.error(`   ⚠️ Erro na geração de imagem: ${error.message}`);
        return null;
    }
}

module.exports = { gerarImagemBase };
