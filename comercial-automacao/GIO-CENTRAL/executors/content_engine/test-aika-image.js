require('dotenv').config();
const { gerarImagemBase } = require('./image-generator');

async function runTest() {
    console.log("🚀 Iniciando teste de geração de imagem da Aika para B2C...");
    const sugestaoVisual = "Aika sentada em uma caminha confortável ao lado de uma janela com folhas de outono caindo do lado de fora, transmitindo a ideia de 'Cuidados essenciais para o bem-estar do pet no Outono'. A iluminação deve ser aconchegante.";
    
    // O segundo parâmetro 'B2C Tutor' ativa a injetção da Character Sheet da Aika
    const filePath = await gerarImagemBase(sugestaoVisual, "B2C Tutor");
    
    console.log(`\n🎉 Teste concluído! O arquivo foi salvo em: ${filePath}`);
}

runTest();
