# ANTIGRAVITY — Modo Autônomo em Loop
**Versão:** 1.0  
**Data:** 2026-07-01  
**Autoridade:** Carmen / Jonathas (Otimiza FarmaVet)  
**Objetivo Final:** Bot Aika/Kyenner em produção plena, aprendendo e escalando sem intervenção manual

---

## PROTOCOLO DE EXECUÇÃO

Você é o agente Antigravity. Ao receber este documento, execute o seguinte protocolo:

1. **Leia** `painel-autoridade/contexto_mestre.json` — este é o estado verdadeiro do projeto
2. **Identifique** a primeira tarefa em `gargalo` com prioridade P1
3. **Execute** seguindo as instruções desta missão
4. **Valide** com os critérios definidos em cada fase
5. **Atualize** `contexto_mestre.json` movendo a tarefa para `motor`
6. **Commite e pushe** com a mensagem padrão
7. **Repita** do passo 2 até não haver mais tarefas P1 em `gargalo`
8. **Notifique** o Mestre via Telegram apenas ao concluir um bloco completo ou encontrar um bloqueio real

**Regra de ouro:** Nunca pergunte ao Mestre o que já está documentado aqui. Só interrompa se encontrar um erro que impeça a execução e não esteja documentado.

---

## ESTADO ATUAL (2026-07-01)

| Tarefa | Status | Notas |
|--------|--------|-------|
| seg_001 | ✅ motor | .gitignore criado |
| fase0_001–004 | ✅ motor | QA 25/25 |
| fase1_001 | ✅ motor | Guard horário seg-sex 9h-18h, sab+dom OFF, mensagem acolhedora — implementado pelo RT |
| fase1_002 | 🔴 gargalo P1 | Integrar sugestoes_supervisor.js |
| fase1_004 | 🟡 gargalo P2 | Ciclo de aprendizado |
| gm_001 | 🟡 gargalo P2 | GMB — bloqueado por OAuth |
| sh_001 | 🟡 gargalo P2 | Vitrine Virtual |
| tk_001 | 🟡 gargalo P2 | TikTok UGC |
| rt_003 | 🟡 gargalo P3 | Kyenner vagas |

---

## BLOCO 1 — FASE 1 P1: SUPERVISOR + GO-LIVE

### Tarefa: fase1_002 — Integrar sugestoes_supervisor.js

**Arquivo:** `server_integracao.js`  
**Módulo já existe em:** `src/observabilidade/sugestoes_supervisor.js`

**Passo 1:** Adicionar import no topo do arquivo:
```js
const { supervisionar } = require('./src/observabilidade/sugestoes_supervisor');
```

**Passo 2:** Buscar por `MODO_SILENCIOSO` no arquivo. Localizar o bloco de envio da resposta IA. Substituir:

```js
// ANTES:
if (MODO_SILENCIOSO) {
    // silencia ou loga
} else {
    await enviarMensagem(phone, respostaIA);
}

// DEPOIS:
if (MODO_SILENCIOSO) {
    supervisionar({
        telefone: phone,
        intencaoDetectada: estrategiaAtivada || 'indefinida',
        respostaBot: respostaIA,
        flagRevisao: !respostaIA,
        alertar: false
    });
} else {
    await enviarMensagem(phone, respostaIA);
}
```

> Adaptar nomes de variável (`phone`, `estrategiaAtivada`, `respostaIA`) aos nomes reais no código.  
> `TELEGRAM_BOT_TOKEN` já está configurado no Railway.

**Critério de validação:**
- [ ] Deploy bem-sucedido no Railway sem erro de require
- [ ] Enviar mensagem de teste → `sugestoes_bot.jsonl` criado no servidor
- [ ] Log Railway contém: `[SUPERVISOR] Sugestão registrada:`
- [ ] Cliente NÃO recebeu resposta

**Commit:**
```
feat(supervisor): integrar sugestoes_supervisor ao pipeline MODO_SILENCIOSO
```

**Após validar → atualizar contexto_mestre.json:**
- `fase1_002` → `motor`
- Incrementar versão para `5.5`

---

### Tarefa: go_live_001 — Ativar MODO_SILENCIOSO=false

**Pré-requisito:** fase1_002 validada com sucesso.

**Ação:** No painel Railway, alterar variável de ambiente:
```
MODO_SILENCIOSO=false
```

**Critério de validação:**
- [ ] Enviar mensagem de teste → bot responde ao cliente
- [ ] Resposta coerente com as instruções (sem alucinação)
- [ ] Log Railway: resposta enviada via Z-API com status 200
- [ ] `sugestoes_bot.jsonl` NÃO é mais atualizado (está em produção agora)

**Notificar Mestre via Telegram:**
> "🟢 BOT NO AR. MODO_SILENCIOSO=false ativo. Aika/Kyenner respondendo em produção. Monitorar primeiras 48h."

**Commit:**
```
chore(painel): go_live_001 — MODO_SILENCIOSO=false, bot em produção
```

**Após → atualizar contexto_mestre.json:**
- Adicionar `go_live_001` em `motor`
- `"fase_atual": "Fase 2 — Produção e Monitoramento"`

---

## BLOCO 2 — FASE 2: QUALIDADE EM PRODUÇÃO

> Executar após 48h do go-live. Não precisa de aprovação manual — apenas verificar se não há erros críticos nos logs Railway antes de prosseguir.

### Tarefa: val_001 — Ativar Validador Semântico

**Ação:** No Railway, adicionar variável:
```
VALIDADOR_SEMANTICO_ENABLED=true
```

**O módulo já existe:** `src/qualidade/validador_semantico.js`

**Verificar** se o validador está sendo chamado antes do envio em `server_integracao.js`. Se não estiver integrado, localizar onde a resposta do Gemini é obtida e adicionar:

```js
const { validar } = require('./src/qualidade/validador_semantico');

// Após obter respostaGemini:
if (process.env.VALIDADOR_SEMANTICO_ENABLED === 'true') {
    const resultado = await validar(respostaGemini, mensagemCliente);
    if (!resultado.aprovado) {
        console.warn('[VALIDADOR] Resposta bloqueada:', resultado.motivo);
        // Substituir por resposta segura padrão
        respostaGemini = resultado.resposta_segura || 'Um momento, deixa eu verificar isso para você. 🐾';
    }
}
```

**Critério de validação:**
- [ ] Log Railway: `[VALIDADOR]` aparece nas entradas
- [ ] Nenhum erro de require

**Commit:**
```
feat(qualidade): ativar validador_semantico em producao
```

---

### Tarefa: fase1_004 — Fechar Ciclo de Aprendizado

**Arquivo a criar:** `src/aprendizado/ciclo_aprendizado.js`

**O que faz:** Lê `sugestoes_bot.jsonl`, filtra registros com `aprovado_humano: true` e os promove para o arquivo de few-shots usado pelo Gemini.

```js
'use strict';
const fs   = require('fs');
const path = require('path');

const ARQUIVO_JSONL   = path.resolve(__dirname, '../../sugestoes_bot.jsonl');
const ARQUIVO_FEWSHOT = path.resolve(__dirname, '../aprendizado/exemplos_aprovados.jsonl');

function promoverAprovados() {
    if (!fs.existsSync(ARQUIVO_JSONL)) {
        console.log('[CICLO] sugestoes_bot.jsonl não encontrado. Nada a promover.');
        return 0;
    }

    const linhas = fs.readFileSync(ARQUIVO_JSONL, 'utf8').split('\n').filter(Boolean);
    const aprovados = linhas
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(r => r && r.aprovado_humano === true);

    if (aprovados.length === 0) {
        console.log('[CICLO] Nenhum registro aprovado encontrado ainda.');
        return 0;
    }

    const fewShots = aprovados.map(r => ({
        input:  r.mensagemCliente,
        output: r.respostaSugerida,
        persona: r.persona,
        promovido_em: new Date().toISOString()
    }));

    fs.appendFileSync(
        ARQUIVO_FEWSHOT,
        fewShots.map(f => JSON.stringify(f)).join('\n') + '\n',
        'utf8'
    );

    console.log(`[CICLO] ${aprovados.length} exemplos promovidos para few-shots.`);
    return aprovados.length;
}

module.exports = { promoverAprovados };

// Execução direta: node ciclo_aprendizado.js
if (require.main === module) {
    promoverAprovados();
}
```

**Integrar em `server_integracao.js`:** Chamar `promoverAprovados()` uma vez por dia (usar setInterval de 24h no startup) ou via cron Railway.

**Commit:**
```
feat(aprendizado): ciclo_aprendizado.js fecha loop few-shot com exemplos aprovados
```

---

## BLOCO 3 — FASE 3: AUTOMAÇÕES SECUNDÁRIAS

> Executar em paralelo após Bloco 2 estável. Cada tarefa é independente.

### sh_001 — Vitrine Virtual (Flyer PNG + WhatsApp Status)

**Arquivo a criar:** `src/vitrine/vitrine_semanal.js`

**O que faz:**
1. Busca produtos em destaque via Shopify API
2. Gera imagem PNG com `sharp` (ou `canvas`)
3. Envia como Status do WhatsApp via Z-API

```js
'use strict';
const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN  = process.env.SHOPIFY_ADMIN_TOKEN;
const ZAPI_URL       = process.env.ZAPI_URL;
const ZAPI_TOKEN     = process.env.ZAPI_TOKEN;

async function buscarProdutosDestaque() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SHOPIFY_DOMAIN,
            path: '/admin/api/2024-01/products.json?limit=3&status=active',
            headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
        };
        https.get(options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data).products || []));
        }).on('error', reject);
    });
}

async function enviarStatus(imagemPath, legenda) {
    // Envio via Z-API Stories/Status — adaptar ao endpoint correto da Z-API
    const payload = JSON.stringify({
        image: fs.readFileSync(imagemPath, 'base64'),
        caption: legenda
    });
    // POST para ZAPI_URL/send-image-status
    console.log('[VITRINE] Status enviado:', legenda.substring(0, 50));
}

async function executarVitrinesSemanal() {
    const produtos = await buscarProdutosDestaque();
    if (!produtos.length) { console.log('[VITRINE] Sem produtos para exibir.'); return; }

    for (const produto of produtos) {
        const legenda = `🐾 ${produto.title}\n💊 ${produto.variants[0]?.price ? 'R$ ' + produto.variants[0].price : ''}\n\nOtimiza FarmaVet`;
        // Usar sharp para gerar PNG com nome e preço — implementar conforme design
        console.log('[VITRINE] Produto processado:', produto.title);
    }
}

module.exports = { executarVitrinesSemanal };
```

**Variáveis Railway necessárias:**
```
SHOPIFY_DOMAIN=otimizafarmavet.myshopify.com
SHOPIFY_ADMIN_TOKEN=<token>
```

**Commit:**
```
feat(vitrine): vitrine_semanal.js — produtos Shopify + WhatsApp Status via Z-API
```

---

### rt_003 — Kyenner: Busca de Vagas Automática

**Arquivo a criar:** `src/kyenner/busca_vagas.js`

**O que faz:** Busca vagas no LinkedIn/Gupy com palavras-chave e envia alertas no Telegram para Jonathas (868045878).

```js
'use strict';
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const TELEGRAM_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const JONATHAS_ID     = '868045878';
const PALAVRAS_CHAVE  = ['técnico farmácia', 'auxiliar farmácia', 'atendente farmácia', 'veterinário'];
const VAGAS_VISTAS    = path.resolve(__dirname, '../../kyenner_vagas_vistas.json');

function carregarVagasVistas() {
    try { return JSON.parse(fs.readFileSync(VAGAS_VISTAS, 'utf8')); } catch { return []; }
}

function salvarVagasVistas(ids) {
    fs.writeFileSync(VAGAS_VISTAS, JSON.stringify(ids), 'utf8');
}

async function alertarVaga(vaga) {
    const msg = encodeURIComponent(
        `💼 *Nova Vaga — Kyenner*\n\n` +
        `🏢 ${vaga.empresa}\n` +
        `📌 ${vaga.titulo}\n` +
        `📍 ${vaga.local}\n` +
        `🔗 ${vaga.url}`
    );
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${JONATHAS_ID}&text=${msg}&parse_mode=Markdown`;
    https.get(url, r => r.resume()).on('error', e => console.error('[VAGAS-TG]', e.message));
}

async function buscarVagas() {
    const vistas = carregarVagasVistas();
    // Integração Gupy API pública ou scraping leve do LinkedIn
    // Placeholder — adaptar à fonte de dados disponível
    console.log('[VAGAS] Busca executada. Palavras-chave:', PALAVRAS_CHAVE.join(', '));
    // Para cada vaga nova (não em `vistas`): alertarVaga(vaga) + adicionar ao array
    salvarVagasVistas(vistas);
}

module.exports = { buscarVagas };

if (require.main === module) { buscarVagas(); }
```

**Commit:**
```
feat(kyenner): busca_vagas.js — alertas de vagas via Telegram para Jonathas
```

---

### gm_001 — GMB Local Authority

**Bloqueio atual:** OAuth credentials revogadas. O Antigravity não pode completar esta tarefa sozinho.

**Ação do Antigravity:**
1. Verificar se `credentials.json` novo existe no servidor
2. Se SIM → seguir `INSTRUCOES_GARGALOS_RESTANTES.md` seção GMB
3. Se NÃO → registrar bloqueio no contexto_mestre.json e notificar Mestre:

> "⚠️ gm_001 bloqueado: credentials.json OAuth não encontrado. RT precisa gerar novo token no Google Cloud Console e fazer upload no servidor Railway."

---

## PROTOCOLO DE ATUALIZAÇÃO DO PAINEL

Após cada tarefa concluída, atualizar `contexto_mestre.json`:

```json
{
  "id": "fase1_002",
  "coluna": "motor",
  "atualizado_em": "YYYY-MM-DD",
  "atualizado_por": "antigravity",
  "descricao": "Descrição do que foi implementado"
}
```

Incrementar `"versao"` a cada bloco completo:
- Bloco 1 concluído → `5.5`
- Bloco 2 concluído → `5.6`
- Bloco 3 concluído → `6.0`

---

## CRITÉRIO DE CONCLUSÃO TOTAL

O loop para quando:

- [ ] `fase1_002` em motor + bot respondendo em produção
- [ ] `val_001` em motor + validador semântico ativo
- [ ] `fase1_004` em motor + ciclo de aprendizado fechado
- [ ] `sh_001` em motor OU bloqueio documentado
- [ ] `rt_003` em motor
- [ ] `gm_001` em motor OU bloqueio documentado com instrução ao RT

**Notificação final ao Mestre:**
> "✅ MISSÃO CONCLUÍDA. Todos os blocos executados. contexto_mestre.json v6.0. Bot em produção, aprendendo, vitrine ativa, Kyenner monitorando vagas. Próximo passo: snc_003 (auditoria SNC semanal) quando o RT autorizar."

---

## PADRÃO DE COMMITS

```
feat(modulo): descrição curta do que foi implementado
fix(modulo): descrição do bug corrigido
chore(painel): tarefas movidas para motor após validação
```

---

## CONTATOS PARA ALERTAS TELEGRAM

| Pessoa | Chat ID | Quando alertar |
|--------|---------|----------------|
| Carmen | 6823632451 | Conclusão de bloco, erros críticos |
| Jonathas | 868045878 | Vagas (rt_003), conclusão de bloco |

*Token do bot: já configurado no Railway como `TELEGRAM_BOT_TOKEN`*
