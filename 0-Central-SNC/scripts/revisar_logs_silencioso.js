const fs = require('fs');
const path = require('path');

console.log(`[INICIO] revisar_logs_silencioso.js ${new Date().toISOString()}`);

const logFilePath = path.resolve(__dirname, '../conversas_log.jsonl');

if (!fs.existsSync(logFilePath)) {
    console.warn(`⚠️ [REVISAR LOGS] Arquivo de log não localizado em: ${logFilePath}`);
    console.log(`[OK] revisar_logs_silencioso.js ${new Date().toISOString()} Resumo: Arquivo inexistente.`);
    process.exit(0);
}

try {
    const fileContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = fileContent.trim().split('\n').filter(Boolean);
    
    const now = Date.now();
    const last24hLimit = now - 24 * 60 * 60 * 1000;
    
    let totalInteracoes24h = 0;
    const conversasUnicas = {}; // phone -> array of interactions
    const falhasGemini = [];
    
    for (const line of lines) {
        let entry;
        try {
            entry = JSON.parse(line);
        } catch (e) {
            continue;
        }
        
        const timestampMs = new Date(entry.timestamp).getTime();
        
        // Registrar erros independente das 24h para observabilidade completa
        if (entry.error) {
            falhasGemini.push(entry);
        }
        
        if (timestampMs >= last24hLimit) {
            totalInteracoes24h++;
            const phone = entry.phone;
            if (!conversasUnicas[phone]) {
                conversasUnicas[phone] = [];
            }
            conversasUnicas[phone].push(entry);
        }
    }
    
    const uniquePhones = Object.keys(conversasUnicas);
    const totalConversas24h = uniquePhones.length;
    
    let aikaCount = 0;
    let kyennerCount = 0;
    let transbordoCount = 0;
    
    const listConversas = [];
    
    for (const phone of uniquePhones) {
        const history = conversasUnicas[phone];
        // Ordenar por timestamp
        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const lastEntry = history[history.length - 1];
        
        // Persona associada ao cliente (usamos a do último registro)
        if (lastEntry.persona === 'Kyenner') {
            kyennerCount++;
        } else {
            aikaCount++;
        }
        
        // Taxa de transbordo (owner === 'human')
        if (lastEntry.owner === 'human') {
            transbordoCount++;
        }
        
        listConversas.push({
            phone,
            clientName: lastEntry.clientName || 'Cliente',
            messageCount: history.length,
            lastMessage: lastEntry.clientMessage || '(Sem mensagem)'
        });
    }
    
    const taxaTransbordo = totalConversas24h > 0 ? ((transbordoCount / totalConversas24h) * 100).toFixed(1) : 0;
    
    console.log('\n================================================================');
    console.log('📊 PAINEL DE OBSERVABILIDADE — MODO SILENCIOSO (ÚLTIMAS 24H)');
    console.log('================================================================');
    console.log(`📈 Total de Interações (Mensagens): ${totalInteracoes24h}`);
    console.log(`👤 Total de Clientes Únicos:       ${totalConversas24h}`);
    console.log('----------------------------------------------------------------');
    console.log('🤖 DISTRIBUIÇÃO POR PERSONA (Clientes Únicos):');
    console.log(`   - Aika B2C (Tutores):       ${aikaCount}`);
    console.log(`   - Kyenner B2B (Veterinários): ${kyennerCount}`);
    console.log('----------------------------------------------------------------');
    console.log(`🔄 Taxa de Transbordo Humano: ${taxaTransbordo}% (${transbordoCount}/${totalConversas24h})`);
    console.log('================================================================');
    
    console.log('\n🔝 5 CONVERSAS MAIS LONGAS (Últimas 24h):');
    listConversas.sort((a, b) => b.messageCount - a.messageCount);
    const top5 = listConversas.slice(0, 5);
    if (top5.length === 0) {
        console.log('   (Nenhuma conversa registrada nas últimas 24h)');
    } else {
        top5.forEach((c, i) => {
            console.log(`   ${i + 1}. +${c.phone} (${c.clientName}) — ${c.messageCount} mensagens`);
            console.log(`      Última msg: "${c.lastMessage.substring(0, 60)}"`);
        });
    }
    
    console.log('\n🚨 FALHAS E ERROS DE API (GEMINI/Z-API):');
    if (falhasGemini.length === 0) {
        console.log('   ✅ Nenhuma falha registrada no arquivo de log.');
    } else {
        console.log(`   ❌ Total de falhas registradas: ${falhasGemini.length}`);
        // Mostrar as últimas 5 falhas
        const ultimasFalhas = falhasGemini.slice(-5);
        ultimasFalhas.forEach((f, i) => {
            console.log(`   ${i + 1}. [${f.timestamp}] +${f.phone} (${f.clientName}):`);
            console.log(`      Erro: "${f.error}"`);
            console.log(`      Mensagem Cliente: "${f.clientMessage || '(Sem mensagem)'}"`);
        });
    }
    console.log('================================================================\n');
    
    console.log(`[OK] revisar_logs_silencioso.js ${new Date().toISOString()} Resumo: Logs analisados com sucesso.`);
} catch (error) {
    console.error(`[ERRO] revisar_logs_silencioso.js ${error.message}`);
    process.exit(1);
}
