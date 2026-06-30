# Plano de Atualização — Aika Comercial WhatsApp
**Projeto:** Otimiza FarmaVet  
**Documento para:** Antigravity (agente executor)  
**Gerado por:** Claude (arquiteto)  
**Data:** 2026-06-30  
**Branch de trabalho:** `claude/whatsapp-automation-review-a922hj`  
**Status atual do bot:** DESCONECTADO — Modo Incógnito até conclusão da Fase 2

---

## Contexto Crítico para o Antigravity

O bot `server_integracao.js` foi desconectado após teste real revelar **alucinação**: o sistema respondia a áudios, stickers e reações do WhatsApp (que chegam com `msg.body = ""`), gerando respostas sem sentido para os clientes.

**O QA simulado passava 100% (15/15)** mas não cobria esses cenários reais. A causa raiz é simples, mas antes de religar é necessário blindar, expandir o aprendizado e criar uma rampa de ativação gradual.

### Arquitetura atual (mapa rápido)
```
server_integracao.js          ← Express + webhook Z-API (ponto de entrada, 99KB)
src/
  personas/
    aika/                     ← B2C (tutores): aika_ltv.js, aika_status.js, aika_vitrine.js, aika_instagram.js
    kyenner/                  ← B2B (veterinários): kyenner_prospeccao.js (EXISTE mas nunca é chamado)
  comercial/
    estrategias_vendas.js     ← Injeção dinâmica de contexto comercial no prompt Gemini
    cross_sell.js             ← Lógica de cross-sell
  integracoes/
    integracao_zapi.js        ← Z-API (envio de mensagens)
    integracao_gestaoclick.js ← ERP consulta de estoque/clientes
    integracao_chatwoot.js    ← CRM escalonamento humano
    integracao_cfmv.js        ← Validação CRMV veterinários
    whatsapp_gateway.js       ← Decide se envia real ou simula (MODO_SILENCIOSO)
  qualidade/
    validador_semantico.js    ← Auditor Gemini pré-envio (JÁ EXISTE — usar e expandir)
  aprendizado/
    few_shot_loader.js        ← Carregador de exemplos few-shot (JÁ EXISTE — fechar o ciclo)
  snc/
    snc_core.js               ← Sistema Nervoso Central: saúde emocional + filtro de tom
  precos/
    carregar_precos.js        ← Tabela de preços oficiais
conversas_state.json          ← Estado persistente das conversas (CONTAMINADO com dados de QA)
comando_central.js            ← Orquestrador de rotinas (Kyenner comentado)
.env.example                  ← Template de configuração
```

### Variáveis de ambiente críticas (`.env`)
```
MODO_SILENCIOSO=true          # true = bot pensa mas NÃO envia. Manter true durante Fases 1 e 2
MODO_TESTE=false
ZAPI_INSTANCE_ID=...          # Verificar se instância ainda está ativa no painel Z-API
GEMINI_API_KEY=...            # Verificar validade
GESTAOCLICK_ACCESS_TOKEN=...  # Verificar validade
GC_CACHE_ENABLED=true
ESTOQUE_CACHE_TTL_SECONDS=300
HORARIO_COMERCIAL_INICIO=8
HORARIO_COMERCIAL_FIM=19
ATENDE_DOMINGO=false
VALIDADOR_SEMANTICO_ENABLED=true
CANARY_PCT=0                  # Durante Fases 1-2 manter 0
```

---

## FASE 0 — Saneamento (Executar ANTES de qualquer outra coisa)
> **Critério de conclusão:** Todos os 5 itens abaixo com ✅. Nenhum código novo, apenas correções.

### 0.1 — Guard de mensagem vazia em `server_integracao.js`

**Causa raiz da alucinação.** Áudios, stickers e reações chegam com `msg.body = ""` ou `msg.type = 'ptt'/'audio'/'sticker'/'reaction'`. O sistema enviava isso ao Gemini, que inventava uma resposta.

**Localizar** no `server_integracao.js` o handler do webhook Z-API (função que recebe o POST do Z-API e extrai `phone` e `body`/`text`). Normalmente está em torno de um `app.post('/webhook', ...)`.

**Adicionar no início do handler, antes de qualquer lógica:**

```js
// ── GUARD: ignorar mensagens sem conteúdo textual ──────────────────────────
const TIPOS_MIDIA_SEM_TEXTO = ['ptt', 'audio', 'sticker', 'reaction', 'image', 'video', 'document'];
const tipoMensagem = (payload.type || payload.messageType || '').toLowerCase();
const textoRecebido = (payload.text?.message || payload.body || payload.message || '').trim();

if (!textoRecebido || TIPOS_MIDIA_SEM_TEXTO.includes(tipoMensagem)) {
    console.log(`[GUARD] Mensagem sem texto ignorada. Tipo: ${tipoMensagem || 'desconhecido'} | Número: ${phone}`);
    return res.status(200).json({ status: 'ignored', motivo: 'mensagem-sem-texto' });
}
```

> **Atenção:** Os nomes exatos dos campos (`payload.text?.message`, `payload.body` etc.) dependem do formato exato que o Z-API envia no webhook. Verificar no `server_integracao.js` como o texto é extraído hoje e adaptar o guard ao mesmo campo.

**Verificação:** Enviar um áudio de teste para o número. O log deve mostrar `[GUARD] Mensagem sem texto ignorada` e o bot não deve responder.

---

### 0.2 — Limpar `conversas_state.json`

O arquivo contém números de teste (`553190000001` até `553190000015`) misturados com conversas reais. Isso contamina o contexto e pode causar comportamentos incorretos.

**Ação:**
1. Renomear o arquivo atual: `conversas_state.json` → `conversas_state_backup_2026-06-30.json`
2. Criar novo `conversas_state.json` vazio: `{}`
3. No código que carrega o state (buscar por `readFileSync` ou `require('./conversas_state')`), garantir que parse falho resulte em `{}` e não em crash:

```js
function carregarState() {
    try {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        return JSON.parse(raw) || {};
    } catch (_) {
        return {};
    }
}
```

---

### 0.3 — Separar state de QA do state de produção

Para que testes nunca contaminem produção novamente.

**Em `server_integracao.js`**, localizar onde `STATE_FILE` (ou equivalente) é definido e torná-lo dependente do ambiente:

```js
const STATE_FILE = process.env.MODO_TESTE === 'true'
    ? './conversas_state_qa.json'
    : './conversas_state.json';
```

**No script de QA** (`test_qa_conversacional.js`), garantir que `process.env.MODO_TESTE = 'true'` está setado antes de iniciar.

---

### 0.4 — Deduplicar detectores em `src/comercial/estrategias_vendas.js`

**Problema:** `UPSELL_VACINA_CAIXA_B2B` e `COMBO_VACINA_INSUMOS_B2B` têm detectores idênticos (`vacina`, `rabisin`, `nobivac`, etc.), fazendo o bot injetar dois blocos comerciais conflitantes no mesmo prompt quando um vet menciona vacina.

**Arquivo:** `comercial-automacao/src/comercial/estrategias_vendas.js`

**Ação:** Fundir as duas regras em uma só:

```js
// ANTES (duas regras com detectores duplicados):
UPSELL_VACINA_CAIXA_B2B: {
    detectores: ["vacina", "rabisin", "nobivac", "v8", "v10", ...],
    mensagemInjetada: "[COMERCIAL:UPSELL_VACINA] Ofereça caixa fechada..."
},
COMBO_VACINA_INSUMOS_B2B: {
    detectores: ["vacina", "rabisin", "nobivac", "v8", "v10", ...],  // ← mesmos!
    mensagemInjetada: "[COMERCIAL:COMBO_INSUMOS] Ofereça caixa com 100 seringas..."
},

// DEPOIS (uma regra unificada):
UPSELL_VACINA_COMBO_B2B: {
    detectores: ["vacina", "rabisin", "nobivac", "v8", "v10", "raiva", "gripe", "giardia", "antirrábica", "antirrabica", "injetavel", "injetável", "biológico", "biologico"],
    mensagemInjetada: "[COMERCIAL:VACINA_COMBO] Ofereça caixa fechada com desconto. Pergunte quantas doses/mês aplica. Inclua proativamente 100 seringas e agulhas para aplicação como custo-benefício."
},
```

Aplicar o mesmo princípio para `COMBO_INJETAVEL_SERINGA_B2B` e `UPSELL_SERINGA_B2B` se tiverem sobreposição.

---

### 0.5 — Verificar e documentar estado das credenciais

O `erros_historico_otimiza.txt` mostrou `client_id=` vazio e token Google expirado. Antes de religar, a equipe técnica precisa confirmar manualmente:

| Credencial | Onde verificar | Ação se inválido |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio | Gerar nova chave |
| `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` | Painel Z-API | Verificar se instância está Connected |
| `GESTAOCLICK_ACCESS_TOKEN` | GestãoClick → Config → API | Regenerar token |
| Token Google OAuth (`token.json`) | Arquivo local | Deletar e re-autorizar via `node auth_whatsapp.js` |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_IDS` | BotFather / @userinfobot | Verificar IDs |

Criar checklist física (pode ser um `STATUS_CREDENCIAIS.md` na pasta, nunca commitar com valores reais).

---

## FASE 1 — Blindagem (Sistema offline, `MODO_SILENCIOSO=true`)
> **Objetivo:** Construir as proteções que faltam antes de religar qualquer coisa.  
> **Duração estimada:** 3-5 dias de desenvolvimento.

### 1.1 — Filtro de horário comercial no handler principal

O sistema já tem `HORARIO_COMERCIAL_INICIO` e `HORARIO_COMERCIAL_FIM` no `.env`, mas verificar se está sendo aplicado no handler do webhook.

**Se não estiver**, adicionar logo após o guard do item 0.1:

```js
// ── GUARD: horário comercial ────────────────────────────────────────────────
const agora = new Date();
const horaAtual = agora.getHours(); // Fuso do servidor — ajustar para BRT (UTC-3) se necessário
const inicioComercial = parseInt(process.env.HORARIO_COMERCIAL_INICIO || '8');
const fimComercial = parseInt(process.env.HORARIO_COMERCIAL_FIM || '19');
const ehDomingo = agora.getDay() === 0;
const atendeDomingo = process.env.ATENDE_DOMINGO === 'true';

const foraDoHorario = horaAtual < inicioComercial || horaAtual >= fimComercial || (ehDomingo && !atendeDomingo);

if (foraDoHorario) {
    // Registrar no state para responder quando voltar ao horário (opcional)
    console.log(`[HORÁRIO] Mensagem recebida fora do horário comercial de ${phone}. Ignorando.`);
    return res.status(200).json({ status: 'fora-horario' });
}
```

> **Nota:** Verificar se o servidor roda em UTC. Se sim, subtrair 3 horas para BRT antes de checar.

---

### 1.2 — Pipeline de sugestões supervisionadas (`sugestoes_bot.json`)

Durante o modo incógnito, cada resposta que SERIA enviada deve ser salva para revisão humana.

**Criar `src/observabilidade/sugestoes_supervisor.js`:**

```js
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.resolve(__dirname, '../../sugestoes_bot.jsonl');

/**
 * Registra uma sugestão do bot para revisão humana.
 * @param {object} dados
 */
function registrarSugestao({ numero, mensagemCliente, respostaSugerida, persona, estrategiaAtivada, contextoInjetado }) {
    const registro = {
        id: `${Date.now()}_${numero.slice(-4)}`,
        timestamp: new Date().toISOString(),
        numero: numero.replace(/\d(?=\d{4})/g, '*'), // mascara parcial do número
        persona,
        mensagemCliente,
        respostaSugerida,
        estrategiaAtivada: estrategiaAtivada || null,
        contextoInjetado: (contextoInjetado || '').substring(0, 500),
        aprovado_humano: null,  // null = pendente, true = aprovado, false = reprovado
        motivo_reprovacao: null
    };

    const linha = JSON.stringify(registro) + '\n';
    fs.appendFileSync(ARQUIVO, linha, 'utf8');
    console.log(`[SUPERVISOR] Sugestão registrada: ${registro.id}`);
    return registro.id;
}

/**
 * Retorna sugestões pendentes de revisão (aprovado_humano === null).
 */
function listarPendentes() {
    if (!fs.existsSync(ARQUIVO)) return [];
    const linhas = fs.readFileSync(ARQUIVO, 'utf8').split('\n').filter(Boolean);
    return linhas.map(l => JSON.parse(l)).filter(r => r.aprovado_humano === null);
}

module.exports = { registrarSugestao, listarPendentes };
```

**Integrar em `server_integracao.js`:** No bloco onde a resposta seria enviada ao cliente, chamar `registrarSugestao()` antes (ou no lugar) do envio real quando `MODO_SILENCIOSO=true`.

---

### 1.3 — Alerta Telegram em tempo real para sugestões

Cada sugestão registrada deve notificar a equipe via Telegram para revisão imediata.

**Localizar a função de envio Telegram** já existente em `processador_aika.js` (ou criar equivalente usando o `TELEGRAM_BOT_TOKEN` do `.env`) e adicionar no `sugestoes_supervisor.js`:

```js
const https = require('https');

function alertarTelegram({ id, persona, mensagemCliente, respostaSugerida, estrategiaAtivada }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = (process.env.TELEGRAM_CHAT_IDS || '').split(',').filter(Boolean);
    if (!token || chatIds.length === 0) return;

    const emoji = persona === 'Aika' ? '🐾' : '🩺';
    const texto =
`${emoji} *SUGESTÃO ${persona.toUpperCase()} [Incógnito]*

💬 *Cliente disse:*
_${mensagemCliente.substring(0, 200)}_

🎯 Estratégia: \`${estrategiaAtivada || 'nenhuma'}\`

🤖 *Resposta sugerida:*
${respostaSugerida.substring(0, 400)}

🆔 ID: \`${id}\`
_Revisar em sugestoes\\_bot.jsonl_`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    chatIds.forEach(chatId => {
        const data = JSON.stringify({ chat_id: chatId.trim(), text: texto, parse_mode: 'Markdown' });
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } });
        req.on('error', e => console.error(`[SUPERVISOR-TELEGRAM] Erro: ${e.message}`));
        req.write(data);
        req.end();
    });
}

module.exports = { registrarSugestao, listarPendentes, alertarTelegram };
```

---

### 1.4 — Expandir QA com cenários de mídia e edge cases

**Arquivo:** `test_qa_conversacional.js`

Adicionar os cenários ausentes que causaram a falha em produção. Cada cenário deve ter `mensagem`, `tipo`, `comportamento_esperado` e `deve_responder: false` onde o bot deve silenciar.

**Cenários a adicionar (mínimo obrigatório):**

```js
// ── Cenários de mídia (bot DEVE silenciar) ─────────────────────────────────
{
    id: 16,
    grupo: '🔇 Mídia e Silêncio',
    descricao: 'Cliente manda áudio — bot deve ignorar completamente',
    tipo_mensagem: 'ptt',
    body: '',
    deve_responder: false,
    comportamento_esperado: 'Nenhuma resposta. Log deve conter [GUARD]'
},
{
    id: 17,
    grupo: '🔇 Mídia e Silêncio',
    descricao: 'Cliente manda sticker — bot deve ignorar',
    tipo_mensagem: 'sticker',
    body: '',
    deve_responder: false
},
{
    id: 18,
    grupo: '🔇 Mídia e Silêncio',
    descricao: 'Cliente manda reação (curtida) — bot deve ignorar',
    tipo_mensagem: 'reaction',
    body: '',
    deve_responder: false
},
{
    id: 19,
    grupo: '🔇 Mídia e Silêncio',
    descricao: 'Cliente manda imagem sem legenda — bot deve ignorar',
    tipo_mensagem: 'image',
    body: '',
    deve_responder: false
},
// ── Cenários de re-entrada após humano ─────────────────────────────────────
{
    id: 20,
    grupo: '🤝 Pós-Escalamento',
    descricao: 'Mensagem nova depois que humano assumiu — bot NÃO deve retomar',
    owner_atual: 'HUMANO',
    body: 'Oi, já resolveu o meu pedido?',
    deve_responder: false,
    comportamento_esperado: 'Se owner === HUMANO, bot silencia. Humano é quem responde.'
},
// ── Cenários de mensagem curta sem intenção ─────────────────────────────────
{
    id: 21,
    grupo: '🔇 Mídia e Silêncio',
    descricao: 'Cliente manda apenas "ok" após confirmação — bot não deve gerar nova conversa',
    body: 'ok',
    comportamento_esperado: 'Resposta curta de encerramento ou nenhuma resposta. NÃO iniciar novo fluxo.'
},
{
    id: 22,
    grupo: '🔇 Mídia e Silêncio',
    descricao: 'Cliente manda apenas emoji 👍 — bot deve ignorar ou responder minimamente',
    body: '👍',
    comportamento_esperado: 'Ignorar ou responder com no máximo uma frase curta de confirmação.'
},
// ── Cenários de horário fora do comercial ───────────────────────────────────
{
    id: 23,
    grupo: '🕐 Horário',
    descricao: 'Mensagem recebida às 23h — bot deve ignorar',
    hora_simulada: 23,
    body: 'Oi, quero comprar Bravecto',
    deve_responder: false
},
// ── Cenários de flood ────────────────────────────────────────────────────────
{
    id: 24,
    grupo: '🛡️ Rate Limit',
    descricao: 'Mesmo número envia 3 mensagens em 5 segundos — só deve processar a 1ª',
    body: 'mensagem rápida',
    repeticoes: 3,
    intervalo_ms: 500,
    comportamento_esperado: 'Rate limit ativo. Apenas primeira processada.'
},
// ── Cenário B2B com produto fora do catálogo ────────────────────────────────
{
    id: 25,
    grupo: '🩺 Kyenner B2B',
    descricao: 'Vet pede produto que não trabalhamos — deve informar sem inventar preço',
    body: 'Tem Apoquel 16mg para mim?',
    tipo_cliente: 'B2B',
    comportamento_esperado: 'Informar indisponibilidade. NUNCA inventar preço ou disponibilidade.'
}
```

---

### 1.5 — Fechar o ciclo do `few_shot_loader.js`

O `src/aprendizado/few_shot_loader.js` já existe mas o ciclo de aprendizado não está fechado — as sugestões aprovadas pela equipe não alimentam os exemplos few-shot automaticamente.

**Criar `src/aprendizado/ciclo_aprendizado.js`:**

```js
const fs = require('fs');
const path = require('path');

const SUGESTOES_FILE = path.resolve(__dirname, '../../sugestoes_bot.jsonl');
const FEW_SHOT_FILE = path.resolve(__dirname, './exemplos_aprovados.jsonl');

/**
 * Lê sugestões aprovadas e as exporta como exemplos few-shot.
 * Rodar diariamente ou sob demanda.
 */
function sincronizarAprovados() {
    if (!fs.existsSync(SUGESTOES_FILE)) {
        console.log('[APRENDIZADO] Nenhum arquivo de sugestões encontrado.');
        return 0;
    }

    const linhas = fs.readFileSync(SUGESTOES_FILE, 'utf8').split('\n').filter(Boolean);
    const aprovados = linhas.map(l => JSON.parse(l)).filter(r => r.aprovado_humano === true);

    let novos = 0;
    const existentes = fs.existsSync(FEW_SHOT_FILE)
        ? new Set(fs.readFileSync(FEW_SHOT_FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).id))
        : new Set();

    for (const registro of aprovados) {
        if (existentes.has(registro.id)) continue;
        const exemplo = {
            id: registro.id,
            persona: registro.persona,
            input: registro.mensagemCliente,
            output: registro.respostaSugerida,
            aprovado_em: new Date().toISOString()
        };
        fs.appendFileSync(FEW_SHOT_FILE, JSON.stringify(exemplo) + '\n', 'utf8');
        novos++;
    }

    console.log(`[APRENDIZADO] ${novos} novos exemplos adicionados ao few-shot.`);
    return novos;
}

module.exports = { sincronizarAprovados };
```

**Integrar no `few_shot_loader.js` existente:** ao carregar exemplos, incluir os de `exemplos_aprovados.jsonl` além dos estáticos.

---

## FASE 2 — Aprendizado Supervisionado (Sistema ouvindo, humano revisando)
> **Objetivo:** Acumular 3 dias consecutivos com ≥90% de aprovação nas sugestões antes de religar.  
> **Ação principal:** Revisão diária manual do `sugestoes_bot.jsonl` pela Carmen ou Jonathas.

### 2.1 — Rotina diária de revisão (15 minutos)

A cada manhã, executar:
```bash
node -e "const s = require('./src/aprendizado/ciclo_aprendizado'); console.log(s)"
# OU abrir sugestoes_bot.jsonl e marcar aprovado_humano: true/false manualmente
```

Para facilitar, o Antigravity deve criar um **script CLI de revisão simples** (`revisar_sugestoes.js`):

```js
// node revisar_sugestoes.js
// Exibe sugestões pendentes uma a uma e aceita input: 's' (aprovar) ou 'n' (reprovar)
const readline = require('readline');
const fs = require('fs');

const ARQUIVO = './sugestoes_bot.jsonl';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function revisar() {
    const linhas = fs.readFileSync(ARQUIVO, 'utf8').split('\n').filter(Boolean);
    const registros = linhas.map(l => JSON.parse(l));
    const pendentes = registros.filter(r => r.aprovado_humano === null);

    console.log(`\n📋 ${pendentes.length} sugestões pendentes de revisão.\n`);

    for (const r of pendentes) {
        console.log('─'.repeat(60));
        console.log(`🆔 ${r.id} | ${r.persona} | ${r.timestamp}`);
        console.log(`💬 Cliente: ${r.mensagemCliente}`);
        console.log(`🤖 Bot sugeriu:\n${r.respostaSugerida}`);
        if (r.estrategiaAtivada) console.log(`🎯 Estratégia: ${r.estrategiaAtivada}`);

        const resposta = await new Promise(res => rl.question('\n✅ Aprovar? (s/n/skip): ', res));

        if (resposta === 's') {
            r.aprovado_humano = true;
        } else if (resposta === 'n') {
            r.aprovado_humano = false;
            const motivo = await new Promise(res => rl.question('Motivo da reprovação: ', res));
            r.motivo_reprovacao = motivo;
        }
        // 'skip' → mantém null
    }

    const atualizado = registros.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(ARQUIVO, atualizado, 'utf8');
    console.log('\n✅ Revisão salva. Executar sincronizarAprovados() para atualizar few-shot.');
    rl.close();
}

revisar();
```

---

### 2.2 — Critério de alta para Fase 3 (checklist obrigatório)

Antes de mudar `MODO_SILENCIOSO=false`, confirmar TODOS os itens:

```
[ ] Guard de mensagem vazia implementado e testado com áudio real
[ ] conversas_state.json limpo (sem números de QA)
[ ] STATE_FILE separado por ambiente (MODO_TESTE=true → qa, false → produção)
[ ] Detectores duplicados em estrategias_vendas.js removidos
[ ] Credenciais verificadas: Z-API Connected, Gemini OK, GestãoClick OK
[ ] QA expandido para 25+ cenários, todos passando
[ ] sugestoes_bot.jsonl com ≥50 registros revisados
[ ] Taxa de aprovação humana ≥90% por 3 dias consecutivos
[ ] ciclo_aprendizado.js sincronizou exemplos aprovados no few-shot
[ ] Filtro de horário comercial ativo e testado
[ ] Alerta Telegram de sugestões funcionando
```

---

## FASE 3 — Ativação Gradual

### 3.1 — Allowlist interna (Dias 1-2)

Adicionar variável `ALLOWLIST_NUMEROS` no `.env`:
```
ALLOWLIST_NUMEROS=5531XXXXXXXX,5531YYYYYYYY
```

No `whatsapp_gateway.js`, antes de enviar qualquer mensagem, verificar se o número está na allowlist quando `CANARY_PCT=0`. Isso garante que apenas os números da equipe recebem respostas reais.

### 3.2 — Janela restrita (Dias 3-5)

```
HORARIO_COMERCIAL_INICIO=9
HORARIO_COMERCIAL_FIM=12
MODO_SILENCIOSO=false
CANARY_PCT=0
```

Monitorar Telegram em tempo real. Qualquer comportamento inesperado → `MODO_SILENCIOSO=true` novamente.

### 3.3 — Canary 20% (Dias 6-7)

```
HORARIO_COMERCIAL_INICIO=8
HORARIO_COMERCIAL_FIM=19
CANARY_PCT=20
```

20% dos números recebem respostas reais. 80% ainda em modo silencioso com registro no supervisor.

### 3.4 — Produção completa (Dia 8+)

```
CANARY_PCT=100
ALLOWLIST_NUMEROS=           ← limpar
```

Manter `validador_semantico.js` ativo (`VALIDADOR_SEMANTICO_ENABLED=true`) para auditoria contínua.

---

## Itens Pendentes para o Futuro (Fora do Escopo Deste Plano)

| Item | Arquivo | Detalhe |
|---|---|---|
| Ativar Kyenner Prospecção | `comando_central.js` linha 36 | Descomentar `kyenner_prospeccao.js`. Implementar lógica de prospecção B2B ativa. |
| Renovar token Google OAuth | `auth_whatsapp.js` + `credentials.json` | Token expirado. Reconfigurar Google Cloud Console. |
| SNC com dados reais | `src/snc/snc_core.js` linha 28 | `taxaAdesao` hoje é hardcoded em 20%. Calcular real com dados do Chatwoot. |
| Tratamento de imagem com texto | `server_integracao.js` | Imagens com legenda (caption) têm texto — não devem ser ignoradas pelo guard. Verificar se `payload.caption` existe e usar como texto quando `tipo = 'image'`. |
| Painel web de supervisão | novo arquivo | Interface HTML/React para revisar sugestões sem usar CLI. |

---

## Convenção de Commits para Este Plano

Usar prefixos para rastreabilidade:

```
fix(guard):     correções do guard de mensagem vazia
fix(state):     limpeza e separação do state
fix(estrategia): deduplicação de detectores
feat(supervisor): pipeline de sugestões supervisionadas
feat(qa):       novos cenários de QA
feat(aprendizado): ciclo de few-shot
chore(env):     ajustes de variáveis de ambiente
```

Todos os commits neste plano vão para o branch: `claude/whatsapp-automation-review-a922hj`

---

## Contato e Orquestração

- **Mestre do projeto:** Carmen / Jonathas (Otimiza FarmaVet)
- **Arquiteto:** Claude (gerou este documento)
- **Executor:** Antigravity (implementa as mudanças conforme especificado)
- **Telegram de alertas:** Chat IDs `6823632451` (Carmen) e `868045878` (Jonathas/Kyenner)

Ao concluir cada fase, o Antigravity deve:
1. Commitar com o prefixo correto
2. Atualizar a checklist desta seção com ✅
3. Notificar o Mestre pelo Telegram informando o que foi feito e o próximo passo

---

*Documento gerado em 2026-06-30. Versão 1.0.*
