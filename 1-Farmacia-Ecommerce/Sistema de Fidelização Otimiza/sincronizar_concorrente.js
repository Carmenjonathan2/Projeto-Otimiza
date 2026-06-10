const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// CONFIGURAÇÕES
const SHOPIFY_SHOP_URL = process.env.SHOPIFY_SHOP_URL || "49mbh1-kp.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const JSON_CONCORRENTE = path.join(__dirname, 'estoque_caesecia.json');
const LOGS_DIR = path.join(__dirname, 'logs_precos');

const headersShopify = {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
};

const IS_LIVE = process.argv.includes('--live');
const REVERT_FILE_INDEX = process.argv.indexOf('--revert');
const IS_REVERT = REVERT_FILE_INDEX !== -1;
const REVERT_FILE_PATH = IS_REVERT ? process.argv[REVERT_FILE_INDEX + 1] : null;

// ============================================
// AUXILIARES DE COMPARAÇÃO INTELIGENTE DE NOMES
// ============================================

function limparTextoParaComparacao(texto) {
    if (!texto) return '';
    let t = texto.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/\b\d{13}\b/g, ''); // remove EAN-13
    
    // Unifica dosagens/medidas soltas (ex: "100 mg" vira "100mg" e "2,5 kg" vira "2.5kg")
    t = t.replace(/(\d+[\.,]\d+|\d+)\s*(mg|ml|kg|g|cp|fa|un)\b/gi, (m, num, unit) => {
        return num.replace(',', '.') + unit.toLowerCase();
    });

    return t.replace(/[^a-z0-9\s]/g, ' ') // substitui especiais por espaço
        .replace(/\s+/g, ' ') // remove espaços duplos
        .trim();
}

function obterNumerosComUnidades(texto) {
    const regex = /(\d+(?:[\.,]\d+)?)\s*(mg|ml|kg|g|mcg|fa|cp|un)\b/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(texto)) !== null) {
        const num = match[1].replace(',', '.');
        const unit = match[2].toLowerCase();
        matches.push(`${num}${unit}`);
    }
    return matches;
}

function verificarCompatibilidadeNome(nomeConcorrente, nomeShopify) {
    const ccLimpo = limparTextoParaComparacao(nomeConcorrente);
    const shLimpo = limparTextoParaComparacao(nomeShopify);

    // 1. FILTRAGEM ESTREITA POR ESPÉCIE / RAÇA (Evita misturar Cães/Raças com Gatos)
    const caesPalavras = ['cao', 'caes', 'cachorro', 'cachorros', 'dog', 'dogs', 'shih', 'tzu', 'spitz', 'yorkshire', 'lhasa', 'bulldog', 'pug', 'golden', 'retriever', 'maltes', 'rottweiler'];
    const gatosPalavras = ['gato', 'gatos', 'felino', 'felinos', 'cat', 'cats'];

    const ccTemCaes = caesPalavras.some(w => ccLimpo.includes(w));
    const shTemCaes = caesPalavras.some(w => shLimpo.includes(w));
    const ccTemGatos = gatosPalavras.some(w => ccLimpo.includes(w));
    const shTemGatos = gatosPalavras.some(w => shLimpo.includes(w));

    if ((ccTemCaes && shTemGatos) || (ccTemGatos && shTemCaes)) {
        return false;
    }

    // 2. FILTRAGEM POR CATEGORIA DE IDADE E ESPECIFICAÇÕES (Evita misturar Filhotes, Adultos, Sênior, Castrados ou Light)
    const filhotePalavras = ['filhote', 'filhotes', 'puppy', 'kitten', 'junior'];
    const adultoPalavras = ['adulto', 'adultos', 'adult'];
    const seniorPalavras = ['senior', 'idoso', 'idosos', 'ageing'];
    const castradoPalavras = ['castrado', 'castrados', 'sterilised', 'sterilized'];
    const lightPalavras = ['light', 'fit', 'obesidade', 'obese'];

    const ccContem = (palavras) => palavras.some(w => ccLimpo.includes(w));
    const shContem = (palavras) => palavras.some(w => shLimpo.includes(w));

    // Se um lado menciona a especificação/idade e o outro não, aborta para evitar correspondência cruzada incorreta
    if (ccContem(filhotePalavras) !== shContem(filhotePalavras)) return false;
    if (ccContem(adultoPalavras) !== shContem(adultoPalavras)) return false;
    if (ccContem(seniorPalavras) !== shContem(seniorPalavras)) return false;
    if (ccContem(castradoPalavras) !== shContem(castradoPalavras)) return false;
    if (ccContem(lightPalavras) !== shContem(lightPalavras)) return false;

    // 3. EXTRAÇÃO E VALIDAÇÃO ESTRITA DE DOSAGEM/MEDIDA (Crucial para pesos de saco de ração)
    const medidasCc = obterNumerosComUnidades(nomeConcorrente);
    const medidasSh = obterNumerosComUnidades(nomeShopify);

    // Se um possui peso especificado no nome e o outro não, aborta para evitar mismatch de variante de peso!
    if ((medidasCc.length > 0 && medidasSh.length === 0) || (medidasCc.length === 0 && medidasSh.length > 0)) {
        return false;
    }

    if (medidasCc.length > 0 && medidasSh.length > 0) {
        const todasCc = new Set(medidasCc);
        const todasSh = new Set(medidasSh);
        
        let temSobrescrita = false;
        for (const m of todasCc) {
            if (todasSh.has(m)) temSobrescrita = true;
        }
        
        if (!temSobrescrita) return false; 
    }

    // 4. ANÁLISE DE CORRESPONDÊNCIA DE PALAVRAS-CHAVE
    const palavrasCc = ccLimpo.split(' ').filter(w => w.length > 2 || /\d/.test(w));
    const palavrasSh = shLimpo.split(' ').filter(w => w.length > 2 || /\d/.test(w));

    if (palavrasCc.length === 0 || palavrasSh.length === 0) return false;

    // A primeira palavra costuma ser a marca principal (ex: Premier, Golden, Quatree)
    const marcaCc = palavrasCc[0];
    const marcaSh = palavrasSh[0];
    if (!shLimpo.includes(marcaCc) && !ccLimpo.includes(marcaSh)) {
        return false;
    }

    const menor = palavrasCc.length < palavrasSh.length ? palavrasCc : palavrasSh;
    const maiorTexto = palavrasCc.length < palavrasSh.length ? shLimpo : ccLimpo;

    let acertos = 0;
    for (const palavra of menor) {
        if (maiorTexto.includes(palavra)) {
            acertos++;
        }
    }

    const score = acertos / menor.length;
    return score >= 0.70; // 70% de overlap mínimo
}

// ============================================
// INTEGRACAO COM APIs E PAGINAÇÃO
// ============================================

async function buscarTodosProdutosShopify() {
    console.log('📡 Buscando produtos cadastrados no Shopify...');
    let todosProdutos = [];
    let url = `https://${SHOPIFY_SHOP_URL}/admin/api/2024-01/products.json?limit=250`;

    try {
        while (url) {
            const response = await axios.get(url, { headers: headersShopify });
            const products = response.data.products;
            todosProdutos = todosProdutos.concat(products);

            const linkHeader = response.headers.link;
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                url = match ? match[1] : null;
            } else {
                url = null;
            }
        }
        console.log(`✅ Total de produtos carregados do Shopify: ${todosProdutos.length}`);
        return todosProdutos;
    } catch (e) {
        console.error('❌ Erro ao buscar produtos do Shopify:', e.message);
        return [];
    }
}

// ============================================
// FLUXO DE REVERSÃO / ROLLBACK
// ============================================

async function executarReversao() {
    if (!REVERT_FILE_PATH) {
        console.error('❌ Você deve especificar o caminho do arquivo de log para a reversão!');
        console.log('👉 Exemplo: node "Sistema de Fidelização Otimiza/sincronizar_concorrente.js" --revert "Sistema de Fidelização Otimiza/logs_precos/concorrente_20260518_163000.json"');
        return;
    }

    const resolvedPath = path.isAbsolute(REVERT_FILE_PATH) 
        ? REVERT_FILE_PATH 
        : path.join(__dirname, '..', REVERT_FILE_PATH);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`❌ Arquivo de log não encontrado em: ${resolvedPath}`);
        return;
    }

    console.log(`\n⏮️  INICIANDO REVERSÃO DE PREÇOS COM BASE NO LOG CONCORRENTE: ${path.basename(resolvedPath)}`);
    const logData = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

    const itensParaReverter = logData.itens_atualizados.filter(i => i.status === 'SUCESSO');
    console.log(`📝 Encontrados ${itensParaReverter.length} produtos atualizados com sucesso para reverter.`);

    if (itensParaReverter.length === 0) {
        console.log('✨ Nada para reverter.');
        return;
    }

    let revertidosComSucesso = 0;

    for (const item of itensParaReverter) {
        try {
            console.log(`🔄 Restaurando preço de "${item.titulo}" para R$ ${item.preco_anterior.toFixed(2)}...`);
            
            await axios.put(`https://${SHOPIFY_SHOP_URL}/admin/api/2024-01/variants/${item.variantId}.json`, {
                variant: {
                    id: item.variantId,
                    price: item.preco_anterior.toFixed(2)
                }
            }, { headers: headersShopify });
            
            revertidosComSucesso++;
            await new Promise(r => setTimeout(r, 250)); // Respeita limites de rate-limit
            
        } catch (err) {
            console.error(`❌ Erro ao reverter ${item.titulo}:`, err.response?.data?.errors || err.message);
        }
    }

    console.log(`\n🎉 Processo de reversão concluído!`);
    console.log(`✔️ Total de preços restaurados com sucesso: ${revertidosComSucesso}/${itensParaReverter.length}`);
}

// ============================================
// FLUXO DE SINCRONIZAÇÃO E LOGS
// ============================================

async function sincronizarConcorrente() {
    if (IS_REVERT) {
        await executarReversao();
        return;
    }

    console.log('🔄 Iniciando Sincronizador de Preços Concorrentes (Otimiza ➡️ Pet Cães e Cia)...');
    
    if (!SHOPIFY_ACCESS_TOKEN) {
        console.error('❌ Token do Shopify não encontrado no arquivo .env!');
        return;
    }

    if (!fs.existsSync(JSON_CONCORRENTE)) {
        console.error('❌ Arquivo estoque_caesecia.json não encontrado! Rode o scraper primeiro.');
        return;
    }

    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    const estoqueCc = JSON.parse(fs.readFileSync(JSON_CONCORRENTE, 'utf-8'));
    const produtosShopify = await buscarTodosProdutosShopify();

    if (produtosShopify.length === 0) {
        console.log('⚠️ Nenhum produto encontrado no Shopify.');
        return;
    }

    console.log(`\n🔍 Cruzando produtos... (${IS_LIVE ? '🔴 MODO LIVE - ALTERAÇÕES SERÃO APLICADAS' : '🟡 MODO SIMULAÇÃO - NENHUMA ALTERAÇÃO REAL'})`);
    
    let totalPorNome = 0;
    let atualizacoesNecessarias = [];

    for (const prod of produtosShopify) {
        for (const variant of prod.variants) {
            const sku = variant.sku ? String(variant.sku).trim() : '';
            const barcode = variant.barcode ? String(variant.barcode).trim() : '';

            // Monta o nome completo no Shopify
            const nomeCompletoShopify = variant.title !== 'Default Title' 
                ? `${prod.title} ${variant.title}` 
                : prod.title;

            // Só cruza se contiver marcas do nosso foco (Premier, Quatree, Golden)
            const matchesMarca = ['premier', 'quatree', 'golden'].some(m => nomeCompletoShopify.toLowerCase().includes(m));
            if (!matchesMarca) continue;

            let matchedItem = null;

            for (const itemCc of estoqueCc) {
                if (verificarCompatibilidadeNome(itemCc.titulo, nomeCompletoShopify)) {
                    matchedItem = itemCc;
                    totalPorNome++;
                    break;
                }
            }

            if (matchedItem) {
                const precoCc = matchedItem.preco_concorrente;
                const precoShopify = parseFloat(variant.price || 0);

                // Só propõe atualização se a diferença for maior que 1 centavo
                if (Math.abs(precoCc - precoShopify) > 0.01) {
                    let warning = '';
                    if (precoCc === 0) {
                        warning = '⚠️ [PREÇO ZERO - IGNORADO POR SEGURANÇA]';
                    } else if (precoCc > precoShopify * 3) {
                        warning = '⚠️ [AUMENTO ALTO (>3x) - VERIFICAR DIGITAÇÃO CONCORRENTE]';
                    } else if (precoCc < precoShopify / 3) {
                        warning = '⚠️ [QUEDA ALTA (<3x) - VERIFICAR MARGEM]';
                    }

                    atualizacoesNecessarias.push({
                        variantId: variant.id,
                        titulo: `${prod.title} (${variant.title !== 'Default Title' ? variant.title : 'Único'})`,
                        sku: sku || 'Sem SKU',
                        nomeConcorrente: matchedItem.titulo,
                        precoShopify,
                        precoCc,
                        linkConcorrente: matchedItem.link,
                        warning
                    });
                }
            }
        }
    }

    console.log(`\n📊 Relatório de Cruzamento Concorrente:`);
    console.log(`- Mapeados por Aproximação de Nome: ${totalPorNome}`);
    console.log(`- Diferenças de preços encontradas: ${atualizacoesNecessarias.length}`);

    if (atualizacoesNecessarias.length === 0) {
        console.log('✨ Excelente! Todos os preços de ração já estão idênticos ao concorrente Pet Cães e Cia.');
        return;
    }

    console.log(`\n📝 Detalhamento das atualizações sugeridas:`);
    for (const item of atualizacoesNecessarias) {
        console.log(`\n🔹 Shopify: ${item.titulo}`);
        console.log(`   Cães e Cia: "${item.nomeConcorrente}"`);
        console.log(`   Shopify atual: R$ ${item.precoShopify.toFixed(2)} ➡️  Cães e Cia: R$ ${item.precoCc.toFixed(2)} ${item.warning}`);
        console.log(`   Link Concorrente: ${item.linkConcorrente}`);
    }

    // ============================================
    // SE MODO LIVE ESTIVER ATIVO - EXECUTA GRAVAÇÃO
    // ============================================
    if (IS_LIVE) {
        console.log('\n🔴 [LIVE] Gravando novos preços diretamente no Shopify...');
        
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '');
        const logFileName = `concorrente_${timestamp}.json`;
        const logFilePath = path.join(LOGS_DIR, logFileName);

        const logFinal = {
            executado_em: new Date().toISOString(),
            modo: 'LIVE',
            plataforma_concorrente: 'Pet Cães e Cia',
            itens_atualizados: []
        };

        let atualizadosComSucesso = 0;

        for (const item of atualizacoesNecessarias) {
            // Ignora atualizações com risco grotesco de preço
            if (item.warning.includes('PREÇO ZERO') || item.warning.includes('AUMENTO ALTO') || item.warning.includes('QUEDA ALTA')) {
                console.log(`⚠️ Ignorado por segurança (bloqueado pelo warning): "${item.titulo}"`);
                logFinal.itens_atualizados.push({
                    variantId: item.variantId,
                    titulo: item.titulo,
                    nomeConcorrente: item.nomeConcorrente,
                    preco_anterior: item.precoShopify,
                    preco_novo: item.precoCc,
                    status: 'IGNORADO',
                    motivo: item.warning
                });
                continue;
            }

            try {
                console.log(`⚡ Atualizando "${item.titulo}" para R$ ${item.precoCc.toFixed(2)}...`);
                
                await axios.put(`https://${SHOPIFY_SHOP_URL}/admin/api/2024-01/variants/${item.variantId}.json`, {
                    variant: {
                        id: item.variantId,
                        price: item.precoCc.toFixed(2)
                    }
                }, { headers: headersShopify });

                atualizadosComSucesso++;
                logFinal.itens_atualizados.push({
                    variantId: item.variantId,
                    titulo: item.titulo,
                    nomeConcorrente: item.nomeConcorrente,
                    preco_anterior: item.precoShopify,
                    preco_novo: item.precoCc,
                    status: 'SUCESSO'
                });

                // Evitar bater no limite da API (Shopify permite ~2 reqs por segundo por padrão)
                await new Promise(r => setTimeout(r, 350));

            } catch (err) {
                console.error(`❌ Erro ao atualizar "${item.titulo}":`, err.response?.data?.errors || err.message);
                logFinal.itens_atualizados.push({
                    variantId: item.variantId,
                    titulo: item.titulo,
                    nomeConcorrente: item.nomeConcorrente,
                    preco_anterior: item.precoShopify,
                    preco_novo: item.precoCc,
                    status: 'ERRO',
                    erro: err.message
                });
            }
        }

        fs.writeFileSync(logFilePath, JSON.stringify(logFinal, null, 2), 'utf-8');
        
        console.log(`\n========================================================================`);
        console.log(`✔️ Processo Concluído com Sucesso!`);
        console.log(`✔️ Itens gravados no Shopify: ${atualizadosComSucesso}/${atualizacoesNecessarias.length}`);
        console.log(`✔️ Log de segurança gerado em: "Sistema de Fidelização Otimiza/logs_precos/${logFileName}"`);
        console.log(`ℹ️  Caso precise reverter esta operação:`);
        console.log(`👉 node "Sistema de Fidelização Otimiza/sincronizar_concorrente.js" --revert "Sistema de Fidelização Otimiza/logs_precos/${logFileName}"`);
        console.log(`========================================================================\n`);

    } else {
        console.log(`\n========================================================================`);
        console.log(`💡 DICA DE SEGURANÇA (MODO SIMULAÇÃO ATIVO)`);
        console.log(`Nenhuma alteração foi efetuada na sua loja Shopify.`);
        console.log(`Se as correspondências e novos preços acima estiverem corretos, rode:`);
        console.log(`👉 node "Sistema de Fidelização Otimiza/sincronizar_concorrente.js" --live`);
        console.log(`========================================================================\n`);
    }
}

sincronizarConcorrente();
