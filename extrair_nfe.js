const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: false });
const dirPath = path.join(__dirname, 'notas_farmavet');

const outputCsv = path.join(__dirname, 'historico_limpo_xml.csv');
const outputJson = path.join(__dirname, 'historico_limpo.json');

async function processNFe() {
    if (!fs.existsSync(dirPath)) {
        console.error(`A pasta '${dirPath}' não foi encontrada.`);
        return;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.xml'));
    const historico = [];

    console.log(`Encontrados ${files.length} arquivos XML. Iniciando processamento...`);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const xmlContent = fs.readFileSync(filePath, 'utf-8');
        
        try {
            const result = await parser.parseStringPromise(xmlContent);
            
            // Verifica se o XML é uma Nota Fiscal válida e não um evento (como cancelamento)
            if (!result.nfeProc || !result.nfeProc.NFe || !result.nfeProc.NFe.infNFe) {
                console.log(`[IGNORADA] ${file} - Não possui tag <nfeProc> (Pode ser evento de cancelamento).`);
                continue;
            }

            const infNFe = result.nfeProc.NFe.infNFe;
            const protNFe = result.nfeProc.protNFe;

            // Verifica o status do protocolo (100 = Autorizado o uso da NF-e, 150 = Autorizado fora de prazo)
            // Lógica para ignorar canceladas se estiverem dentro de um nfeProc com cStat 101/135/etc
            if (protNFe && protNFe.infProt && protNFe.infProt.cStat) {
                const status = protNFe.infProt.cStat;
                if (status !== '100' && status !== '150') {
                    console.log(`[IGNORADA] ${file} - Cancelada ou não autorizada (cStat: ${status}).`);
                    continue;
                }
            }

            const ide = infNFe.ide;
            const dest = infNFe.dest;
            
            // Trata as tags de produtos: pode vir como Array (se tiver >1 produto) ou Objeto (se for 1 produto)
            let detArray = [];
            if (infNFe.det) {
                detArray = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det]; 
            }
            
            const nNF = ide ? ide.nNF : 'Sem Número';
            const dataEmissao = ide ? (ide.dhEmi || ide.dEmi || 'Sem Data') : 'Sem Data'; 
            
            // Pegar o nome, se não tiver 'xNome', verificamos xNome sob 'dest'. Algumas NFC-es não preenchem o dest ou só enviam CPF.
            let nomeCliente = 'Consumidor Final (Não Identificado)';
            if (dest && dest.xNome) {
                nomeCliente = typeof dest.xNome === 'string' ? dest.xNome : dest.xNome._ || nomeCliente;
            }

            const produtos = [];
            for (const item of detArray) {
                if (item.prod && item.prod.xProd) {
                    produtos.push(item.prod.xProd);
                }
            }

            historico.push({
                nNF: nNF,
                nomeCliente: nomeCliente,
                dataEmissao: dataEmissao,
                produtos: produtos
            });
            
            console.log(`[OK] Processada: NF ${nNF} - Cliente: ${nomeCliente}`);

        } catch (err) {
            console.error(`Erro ao processar ${file}:`, err.message);
        }
    }

    // ----- SALVAR ARQUIVO JSON -----
    fs.writeFileSync(outputJson, JSON.stringify(historico, null, 2), 'utf-8');
    
    // ----- SALVAR ARQUIVO CSV -----
    if (historico.length > 0) {
        // Cabeçalho compatível com Excel (separador ; por padrão no BR)
        const header = ['Número NF', 'Nome Cliente', 'Data Emissão', 'Produtos'];
        const csvLines = [header.join(';')];
        
        for (const item of historico) {
            const numNf = String(item.nNF).replace(/"/g, '""');
            const cliente = String(item.nomeCliente).replace(/"/g, '""');
            const dataEmi = String(item.dataEmissao).replace(/"/g, '""');
            const prods = item.produtos.join(', ').replace(/"/g, '""');
            
            csvLines.push(`"${numNf}";"${cliente}";"${dataEmi}";"${prods}"`);
        }
        
        // Escreve com BOM para o Excel abrir com acentuação correta
        fs.writeFileSync(outputCsv, '\ufeff' + csvLines.join('\n'), 'utf-8');
    }

    console.log(`\n🎉 Processamento concluído!`);
    console.log(`==========================================`);
    console.log(`Total de arquivos lidos: ${files.length}`);
    console.log(`Total de notas válidas extraídas: ${historico.length}`);
    console.log(`✔️ Arquivo JSON gerado: historico_limpo.json`);
    console.log(`✔️ Arquivo CSV gerado: historico_limpo_xml.csv`);
}

processNFe();
