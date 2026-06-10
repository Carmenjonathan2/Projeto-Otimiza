const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// CONFIGURAÇÕES
const SHOPIFY_SHOP_URL = process.env.SHOPIFY_SHOP_URL || "49mbh1-kp.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const JSON_ESTOQUE = path.join(__dirname, 'estoque_limpo_gestaoclick.json');
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

function verificarCompatibilidadeNome(nomeGc, nomeShopify) {
    const gcLimpo = limparTextoParaComparacao(nomeGc);
    const shLimpo = limparTextoParaComparacao(nomeShopify);

    // 1. FILTRAGEM ESTREITA POR ESPÉCIE / RAÇA (Evita misturar Cães/Raças com Gatos)
    const caesPalavras = ['cao', 'caes', 'cachorro', 'cachorros', 'dog', 'dogs', 'shih', 'tzu', 'spitz', 'yorkshire', 'lhasa', 'bulldog', 'pug'];
    const gatosPalavras = ['gato', 'gatos', 'felino', 'felinos', 'cat', 'cats'];

    const gcTemCaes = caesPalavras.some(w => gcLimpo.includes(w));
    const shTemCaes = caesPalavras.some(w => shLimpo.includes(w));
    const gcTemGatos = gatosPalavras.some(w => gcLimpo.includes(w));
    const shTemGatos = gatosPalavras.some(w => shLimpo.includes(w));

    // Se um é para cães e o outro é para gatos, aborta correspondência
    if ((gcTemCaes && shTemGatos) || (gcTemGatos && shTemCaes)) {
        return false;
    }

    // 2. FILTRAGEM POR CATEGORIA DE IDADE (Evita misturar Filhotes com Adultos)
    const filhotePalavras = ['filhote', 'filhotes', 'puppy', 'kitten', 'junior'];
    const adultoPalavras = ['adulto', 'adultos', 'senior', 'castrado', 'castrados'];

    const gcTemFilhote = filhotePalavras.some(w => gcLimpo.includes(w));
    const shTemFilhote = filhotePalavras.some(w => shLimpo.includes(w));
    const gcTemAdulto = adultoPalavras.some(w => gcLimpo.includes(w));
    const shTemAdulto = adultoPalavras.some(w => shLimpo.includes(w));

    if ((gcTemFilhote && shTemAdulto) || (gcTemAdulto && shTemFilhote)) {
        return false;
    }

    // 3. EXTRAÇÃO E VALIDAÇÃO ESTRITA DE DOSAGEM/MEDIDA (Crucial para vacinas e volumes)
    const medidasGc = obterNumerosComUnidades(nomeGc);
    const medidasSh = obterNumerosComUnidades(nomeShopify);

    if (medidasGc.length > 0 && medidasSh.length > 0) {
        const todasGc = new Set(medidasGc);
        const todasSh = new Set(medidasSh);
        
        let temSobrescrita = false;
        for (const m of todasGc) {
            if (todasSh.has(m)) temSobrescrita = true;
        }
        
        if (!temSobrescrita) return false; 
    }

    // 4. ANÁLISE DE CORRESPONDÊNCIA DE PALAVRAS-CHAVE
    const palavrasGc = gcLimpo.split(' ').filter(w => w.length > 2 || /\d/.test(w));
    const palavrasSh = shLimpo.split(' ').filter(w => w.length > 2 || /\d/.test(w));

    if (palavrasGc.length === 0 || palavrasSh.length === 0) return false;

    const marcaGc = palavrasGc[0];
    const marcaSh = palavrasSh[0];
    if (!shLimpo.includes(marcaGc) && !gcLimpo.includes(marcaSh)) {
        return false;
    }

    const menor = palavrasGc.length < palavrasSh.length ? palavrasGc : palavrasSh;
    const maiorTexto = palavrasGc.length < palavrasSh.length ? shLimpo : gcLimpo;

    let acertos = 0;
    for (const palavra of menor) {
        if (maiorTexto.includes(palavra)) {
            acertos++;
        }
    }

    const score = acertos / menor.length;
    return score >= 0.75;
}

// ============================================
// INTEGRAÇÃO COM APIs E PAGINAÇÃO
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

function extrairEanDoNome(nome) {
    const match = nome.match(/\b\d{13}\b/);
    return match ? match[0] : null;
}

function normalizarPreco(valorStr) {
    if (!valorStr) return 0;
    return parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
}

// ============================================
// FLUXO DE REVERSÃO / ROLLBACK
// ============================================

async function executarReversao() {
    if (!REVERT_FILE_PATH) {
        console.error('❌ Você deve especificar o caminho do arquivo de log para a reversão!');
        console.log('👉 Exemplo: node "Sistema de Fidelização Otimiza/atualizar_precos_shopify.js" --revert "Sistema de Fidelização Otimiza/logs_precos/atualizacao_20260518_153000.json"');
        return;
    }

    const resolvedPath = path.isAbsolute(REVERT_FILE_PATH) 
        ? REVERT_FILE_PATH 
        : path.join(__dirname, '..', REVERT_FILE_PATH);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`❌ Arquivo de log de atualizações não encontrado em: ${resolvedPath}`);
        return;
    }

    console.log(`\n⏮️  INICIANDO REVERSÃO DE PREÇOS COM BASE NO LOG: ${path.basename(resolvedPath)}`);
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

async function sincronizarPrecos() {
    if (IS_REVERT) {
        await executarReversao();
        return;
    }

    console.log('🔄 Iniciando Sincronizador de Preços Otimiza (Código + Nome + Logs)...');
    
    if (!SHOPIFY_ACCESS_TOKEN) {
        console.error('❌ Token do Shopify não encontrado no arquivo .env!');
        return;
    }

    if (!fs.existsSync(JSON_ESTOQUE)) {
        console.error('❌ Arquivo de estoque limpo não encontrado! Rode a extração ou limpeza primeiro.');
        return;
    }

    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    const estoqueGc = JSON.parse(fs.readFileSync(JSON_ESTOQUE, 'utf-8'));
    const produtosShopify = await buscarTodosProdutosShopify();

    if (produtosShopify.length === 0) {
        console.log('⚠️ Nenhum produto encontrado no Shopify.');
        return;
    }

    console.log(`\n🔍 Comparando preços... (${IS_LIVE ? '🔴 MODO LIVE - ALTERAÇÕES SERÃO APLICADAS' : '🟡 MODO SIMULAÇÃO - NENHUMA ALTERAÇÃO REAL'})`);
    
    let totalDiretos = 0;
    let totalPorNome = 0;
    let atualizacoesNecessarias = [];

    // Mapeamento indexado dos produtos do GestãoClick
    const estoqueGcMap = new Map();
    estoqueGc.forEach(item => {
        const ean = extrairEanDoNome(item.Nome);
        const codigo = item.Código ? String(item.Código).trim() : null;
        
        if (ean) estoqueGcMap.set(`ean_${ean}`, item);
        if (codigo) estoqueGcMap.set(`code_${codigo}`, item);
    });

    for (const prod of produtosShopify) {
        for (const variant of prod.variants) {
            let matchedItem = null;
            let tipoMatch = '';

            const sku = variant.sku ? String(variant.sku).trim() : null;
            const barcode = variant.barcode ? String(variant.barcode).trim() : null;

            // 1. TENTA CORRESPONDÊNCIA DIRETA E SEGURA (Código de barras ou SKU)
            if (barcode && estoqueGcMap.has(`ean_${barcode}`)) {
                matchedItem = estoqueGcMap.get(`ean_${barcode}`);
                tipoMatch = 'CÓDIGO DE BARRAS';
                totalDiretos++;
            }
            else if (sku && estoqueGcMap.has(`code_${sku}`)) {
                matchedItem = estoqueGcMap.get(`code_${sku}`);
                tipoMatch = 'SKU';
                totalDiretos++;
            }
            else if (sku && estoqueGcMap.has(`ean_${sku}`)) {
                matchedItem = estoqueGcMap.get(`ean_${sku}`);
                tipoMatch = 'EAN no SKU';
                totalDiretos++;
            }

            // 2. FALLBACK: TENTA CORRESPONDÊNCIA POR NOME (Inteligente e Segura)
            if (!matchedItem) {
                const nomeCompletoShopify = variant.title !== 'Default Title' 
                    ? `${prod.title} ${variant.title}` 
                    : prod.title;

                for (const itemGc of estoqueGc) {
                    if (verificarCompatibilidadeNome(itemGc.Nome, nomeCompletoShopify)) {
                        matchedItem = itemGc;
                        tipoMatch = 'NOME APROXIMADO';
                        totalPorNome++;
                        break;
                    }
                }
            }

            if (matchedItem) {
                const precoGc = normalizarPreco(matchedItem.Valor);
                const precoShopify = parseFloat(variant.price || 0);

                if (Math.abs(precoGc - precoShopify) > 0.01) {
                    let warning = '';
                    if (precoGc === 0) {
                        warning = '⚠️ [PREÇO ZERO - IGNORADO POR SEGURANÇA]';
                    } else if (precoGc > precoShopify * 5) {
                        warning = '⚠️ [AUMENTO GROTESCO (>5x) - VERIFICAR DIGITAÇÃO]';
                    } else if (precoGc < precoShopify / 5) {
                        warning = '⚠️ [QUEDA GROTESCA (<5x) - VERIFICAR DIGITAÇÃO]';
                    }

                    atualizacoesNecessarias.push({
                        variantId: variant.id,
                        titulo: `${prod.title} (${variant.title !== 'Default Title' ? variant.title : 'Único'})`,
                        sku: sku || 'Sem SKU',
                        nomeGestaoClick: matchedItem.Nome,
                        tipoMatch,
                        precoShopify,
                        precoGc,
                        warning
                    });
                }
            }
        }
    }

    console.log(`\n📊 Relatório de Cruzamento e Compatibilidade:`);
    console.log(`- Variantes analisadas no Shopify: ${produtosShopify.reduce((acc, p) => acc + p.variants.length, 0)}`);
    console.log(`- Mapeados por Código/EAN direto: ${totalDiretos}`);
    console.log(`- Mapeados por Aproximação de Nome: ${totalPorNome}`);
    console.log(`- Preços divergentes encontrados para atualizar: ${atualizacoesNecessarias.length}`);

    if (atualizacoesNecessarias.length === 0) {
        console.log('\n✨ Todos os preços correspondentes estão 100% sincronizados!');
        return;
    }

    console.log('\n📝 Detalhamento das alterações de preços:');
    for (const item of atualizacoesNecessarias) {
        console.log(`\n🔹 Shopify: ${item.titulo}`);
        console.log(`   GestãoClick: "${item.nomeGestaoClick}" [Match via ${item.tipoMatch}]`);
        console.log(`   Shopify: R$ ${item.precoShopify.toFixed(2)} ➡️  GestãoClick: R$ ${item.precoGc.toFixed(2)} ${item.warning ? '\x1b[31m' + item.warning + '\x1b[0m' : ''}`);
    }

    if (!IS_LIVE) {
        console.log('\n========================================================================');
        console.log('💡 DICA DE SEGURANÇA (MODO SIMULAÇÃO ATIVO)');
        console.log('Nenhuma alteração foi realizada.');
        console.log('Confira as correspondências e preços listados acima.');
        console.log('Se tudo estiver correto, execute o comando com a flag \x1b[32m--live\x1b[0m para gravar no Shopify:');
        console.log('👉 \x1b[1mnode "Sistema de Fidelização Otimiza/atualizar_precos_shopify.js" --live\x1b[0m');
        console.log('========================================================================\n');
        return;
    }

    // Geração do Log para Reversão (Apenas em Modo LIVE)
    const timestampStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '');
    const logFilename = `atualizacao_${timestampStr}.json`;
    const logFilePath = path.join(LOGS_DIR, logFilename);

    console.log('\n🔴 GRAVANDO ALTERAÇÕES NO SHOPIFY (LIVE) & REGISTRANDO LOGS...');
    let atualizadosComSucesso = 0;
    const historicoLogs = [];

    for (const item of atualizacoesNecessarias) {
        if (item.warning) {
            console.log(`🚫 [IGNORADO] ${item.titulo} devido a alertas de segurança de preço.`);
            historicoLogs.push({
                variantId: item.variantId,
                titulo: item.titulo,
                sku: item.sku,
                nomeGestaoClick: item.nomeGestaoClick,
                preco_anterior: item.precoShopify,
                preco_novo: item.precoGc,
                tipo_cruzamento: item.tipoMatch,
                status: 'IGNORADO',
                erro: item.warning
            });
            continue;
        }

        try {
            console.log(`⚙️ Atualizando ${item.titulo} ➡️ R$ ${item.precoGc.toFixed(2)}...`);
            
            await axios.put(`https://${SHOPIFY_SHOP_URL}/admin/api/2024-01/variants/${item.variantId}.json`, {
                variant: {
                    id: item.variantId,
                    price: item.precoGc.toFixed(2)
                }
            }, { headers: headersShopify });
            
            atualizadosComSucesso++;
            historicoLogs.push({
                variantId: item.variantId,
                titulo: item.titulo,
                sku: item.sku,
                nomeGestaoClick: item.nomeGestaoClick,
                preco_anterior: item.precoShopify,
                preco_novo: item.precoGc,
                tipo_cruzamento: item.tipoMatch,
                status: 'SUCESSO'
            });
            
            await new Promise(r => setTimeout(r, 250)); // Respeita limites de rate-limit
            
        } catch (err) {
            const errMsg = err.response?.data?.errors || err.message;
            console.error(`❌ Erro ao atualizar ${item.titulo}:`, errMsg);
            historicoLogs.push({
                variantId: item.variantId,
                titulo: item.titulo,
                sku: item.sku,
                nomeGestaoClick: item.nomeGestaoClick,
                preco_anterior: item.precoShopify,
                preco_novo: item.precoGc,
                tipo_cruzamento: item.tipoMatch,
                status: 'FALHA',
                erro: JSON.stringify(errMsg)
            });
        }
    }

    // Salva o log final no banco de dados local
    const finalLogData = {
        data_sincronizacao: new Date().toISOString(),
        total_analisados: atualizacoesNecessarias.length,
        total_atualizados_sucesso: atualizadosComSucesso,
        itens_atualizados: historicoLogs
    };

    fs.writeFileSync(logFilePath, JSON.stringify(finalLogData, null, 2), 'utf-8');

    console.log(`\n🎉 Processo concluído com sucesso!`);
    console.log(`✔️ Total de preços alterados no Shopify: ${atualizadosComSucesso}/${atualizacoesNecessarias.length}`);
    console.log(`💾 Banco de logs gerado em: \x1b[36m"Sistema de Fidelização Otimiza/logs_precos/${logFilename}"\x1b[0m`);
    console.log(`💡 Se você precisar desfazer essa operação, basta rodar:`);
    console.log(`👉 \x1b[1mnode "Sistema de Fidelização Otimiza/atualizar_precos_shopify.js" --revert "Sistema de Fidelização Otimiza/logs_precos/${logFilename}"\x1b[0m\n`);
}

sincronizarPrecos();
