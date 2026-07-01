# Instruções de Execução — Agente Antigravity
**Projeto:** Otimiza FarmaVet  
**Para:** Antigravity (agente executor)  
**De:** Claude (arquiteto)  
**Data:** 2026-07-01  
**Branch:** `claude/whatsapp-automation-review-a922hj`

---

## Contexto de entrada

O bot `server_integracao.js` foi desconectado após alucinação em produção (respondia a áudios/stickers com mensagens sem sentido). O sistema permanece em `MODO_SILENCIOSO=true` até conclusão das Fases 0 e 1.

Você tem acesso ao repositório `Carmenjonathan2/Projeto-Otimiza`. Todo o código-fonte da automação WhatsApp está em `comercial-automacao/`. O plano técnico completo está em `comercial-automacao/docs/PLANO_ATUALIZACAO_AIKA.md`.

**Leia o plano antes de começar.** Ele contém o código exato para cada correção.

---

## Regras de operação

1. **Commitar após cada tarefa concluída** — nunca agrupar várias tarefas em um único commit.
2. **Usar os prefixos de commit** definidos no plano: `fix(guard):`, `fix(state):`, `feat(supervisor):` etc.
3. **Nunca alterar `MODO_SILENCIOSO`** — manter `true` até que o Mestre autorize explicitamente.
4. **Nunca commitar arquivos `.env`, `token.json`, `credentials.json`** — são segredos.
5. Após concluir cada fase, **atualizar o `contexto_mestre.json`** movendo as tarefas de `gargalo` para `motor`.
6. Em caso de dúvida sobre o comportamento esperado, **consultar `PLANO_ATUALIZACAO_AIKA.md`** antes de improvisar.

---

## FASE 0 — Saneamento (Executar AGORA, nesta ordem)

> Critério de conclusão: todos os 4 itens com commit no branch.

### Tarefa `fase0_001` — Guard de mensagem vazia ⚡ P0

**Arquivo:** `comercial-automacao/server_integracao.js`

**O que fazer:**
1. Localizar a função handler do webhook Z-API (`app.post('/webhook/zapi', ...)` ou equivalente).
2. Identificar como o texto da mensagem é extraído hoje (buscar por `payload.text`, `payload.body`, `clientMessage` ou similar).
3. Identificar como o tipo da mensagem chega (buscar por `payload.type`, `payload.messageType`).
4. Inserir o seguinte bloco **no início do handler, antes de qualquer outra lógica** (adaptar os nomes de campo ao que o código já usa):

```js
// GUARD: ignorar mensagens sem conteúdo textual
const TIPOS_MIDIA_SEM_TEXTO = ['ptt', 'audio', 'sticker', 'reaction', 'image', 'video', 'document'];
const tipoMensagem = (payload.type || payload.messageType || '').toLowerCase();
const textoRecebido = (payload.text?.message || payload.body || payload.message || '').trim();

if (!textoRecebido || TIPOS_MIDIA_SEM_TEXTO.includes(tipoMensagem)) {
    console.log(`[GUARD] Mensagem ignorada. Tipo: ${tipoMensagem || 'desconhecido'} | Número: ${phone}`);
    return res.status(200).json({ status: 'ignored', motivo: 'mensagem-sem-texto' });
}
```

> **Atenção sobre imagens com legenda:** Se `tipoMensagem === 'image'` mas `payload.caption` tem texto, NÃO ignorar — usar o caption como mensagem. Verificar se isso existe no código atual.

**Commit:** `fix(guard): bloquear ptt/audio/sticker/reaction antes de chamar Gemini`

---

### Tarefa `fase0_002` — Limpar conversas_state.json ⚡ P0

**Arquivo:** `comercial-automacao/conversas_state.json`

**O que fazer:**
1. Ler o arquivo atual.
2. Filtrar e remover entradas cujo número começa com `553190000` (são números de QA).
3. Salvar o arquivo limpo (manter apenas conversas reais).
4. **OU** renomear o atual para `conversas_state_backup_2026-07-01.json` e criar novo `conversas_state.json` com `{}`.

**No código que carrega o state** (buscar `readFileSync` próximo a `conversas_state`), garantir fallback seguro:

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

**Commit:** `fix(state): remover entradas de QA do conversas_state.json e blindar carregarState()`

---

### Tarefa `fase0_003` — Separar state QA do state de produção ⚡ P0

**Arquivo:** `comercial-automacao/server_integracao.js`

**O que fazer:**
Localizar onde `STATE_FILE` (ou o caminho do arquivo de state) é definido. Torná-lo condicional:

```js
const STATE_FILE = process.env.MODO_TESTE === 'true'
    ? path.resolve(__dirname, './conversas_state_qa.json')
    : path.resolve(__dirname, './conversas_state.json');
```

No `test_qa_conversacional.js`, confirmar que `process.env.MODO_TESTE = 'true'` é setado antes de iniciar os testes.

**Commit:** `fix(state): STATE_FILE separado por ambiente via MODO_TESTE`

---

### Tarefa `fase0_004` — Deduplicar detectores em estrategias_vendas.js P1

**Arquivo:** `comercial-automacao/src/comercial/estrategias_vendas.js`

**O que fazer:**
1. Localizar `UPSELL_VACINA_CAIXA_B2B` e `COMBO_VACINA_INSUMOS_B2B`.
2. Verificar se têm detectores duplicados (palavras como `vacina`, `rabisin`, `nobivac` aparecendo em ambos).
3. Fundir em uma única regra:

```js
USELL_VACINA_COMBO_B2B: {
    detectores: ["vacina", "rabisin", "nobivac", "v8", "v10", "raiva", "gripe", "giardia",
                 "antirrábica", "antirrabica", "injetavel", "injetável", "biológico", "biologico"],
    mensagemInjetada: "[COMERCIAL:VACINA_COMBO] Ofereça caixa fechada com desconto. Pergunte quantas doses/mês aplica. Inclua proativamente 100 seringas e agulhas como custo-benefício."
},
```

4. Verificar `COMBO_INJETAVEL_SERINGA_B2B` e `UPSELL_SERINGA_B2B` — se tiverem sobreposição, aplicar o mesmo tratamento.

**Commit:** `fix(estrategia): fundir detectores duplicados UPSELL_VACINA em regra única`

---

## FASE 1 — Blindagem (após Fase 0 completa)

> `MODO_SILENCIOSO=true` durante toda esta fase.

### Tarefa `fase1_001` — Filtro de horário comercial P1

**Arquivo:** `comercial-automacao/server_integracao.js`

**O que fazer:**
1. Buscar por `HORARIO_COMERCIAL_INICIO` no código. Se já estiver sendo usado como guard no handler do webhook, confirmar que está funcionando e marcar como concluído.
2. Se **não** estiver aplicado no handler, adicionar logo após o guard de mensagem vazia:

```js
// GUARD: horário comercial (ajustar para BRT = UTC-3 se servidor estiver em UTC)
const agora = new Date();
const horaAtual = agora.getUTCHours() - 3; // BRT
const inicioComercial = parseInt(process.env.HORARIO_COMERCIAL_INICIO || '8');
const fimComercial = parseInt(process.env.HORARIO_COMERCIAL_FIM || '19');
const ehDomingo = new Date(agora.getTime() - 3 * 3600000).getDay() === 0;
const atendeDomingo = process.env.ATENDE_DOMINGO === 'true';

if (horaAtual < inicioComercial || horaAtual >= fimComercial || (ehDomingo && !atendeDomingo)) {
    console.log(`[HORÁRIO] Fora do horário comercial. Número: ${phone}`);
    return res.status(200).json({ status: 'fora-horario' });
}
```

**Commit:** `feat(horario): guard de horário comercial no webhook handler`

---

### Tarefa `fase1_002` — Pipeline de sugestões supervisionadas P1

**Criar arquivo:** `comercial-automacao/src/observabilidade/sugestoes_supervisor.js`

Copiar o código completo da seção 1.2 do `PLANO_ATUALIZACAO_AIKA.md` (funções `registrarSugestao`, `listarPendentes`, `alertarTelegram`).

**Integrar em `server_integracao.js`:**
No bloco onde a resposta seria enviada ao cliente, adicionar:

```js
if (process.env.MODO_SILENCIOSO === 'true') {
    const { registrarSugestao, alertarTelegram } = require('./src/observabilidade/sugestoes_supervisor');
    const id = registrarSugestao({
        numero: phone,
        mensagemCliente: clientMessage,
        respostaSugerida: respostaIA,
        persona: tipoCliente === 'B2B' ? 'Kyenner' : 'Aika',
        estrategiaAtivada: estrategiaAtivada || null,
        contextoInjetado: contextoInjetado || ''
    });
    alertarTelegram({ id, persona: tipoCliente === 'B2B' ? 'Kyenner' : 'Aika',
        mensagemCliente: clientMessage, respostaSugerida: respostaIA,
        estrategiaAtivada: estrategiaAtivada || null });
    return res.status(200).json({ status: 'silencioso', sugestao_id: id });
}
```

> Os nomes das variáveis (`respostaIA`, `tipoCliente`, `estrategiaAtivada`, `contextoInjetado`) devem ser adaptados aos nomes reais do código.

**Commit:** `feat(supervisor): pipeline sugestoes_supervisor.js com alerta Telegram`

---

### Tarefa `fase1_003` — Expandir QA para 25+ cenários P1

**Arquivo:** `comercial-automacao/test_qa_conversacional.js`

Adicionar os cenários 16 a 25 listados na seção 1.4 do `PLANO_ATUALIZACAO_AIKA.md`. Os cenários cobrem:
- Áudio/ptt, sticker, reaction, image sem legenda → `deve_responder: false`
- Mensagem pós-escalamento humano (`owner === 'HUMANO'`) → bot silencia
- Mensagens curtas sem intenção (`ok`, `👍`)
- Fora do horário comercial
- Flood / rate limit
- Produto B2B fora do catálogo

Após adicionar, rodar o QA com `MODO_TESTE=true` e confirmar que todos passam.

**Commit:** `feat(qa): adicionar cenários 16-25 cobrindo mídia e edge cases`

---

### Tarefa `fase1_004` — Fechar ciclo do few_shot_loader P2

**Criar arquivo:** `comercial-automacao/src/aprendizado/ciclo_aprendizado.js`

Copiar o código da seção 1.5 do `PLANO_ATUALIZACAO_AIKA.md` (função `sincronizarAprovados`).

**Integrar em `few_shot_loader.js`:** Ao carregar exemplos, incluir os de `exemplos_aprovados.jsonl` além dos estáticos:

```js
// No final do carregamento de exemplos:
const APROVADOS_FILE = path.resolve(__dirname, './exemplos_aprovados.jsonl');
if (fs.existsSync(APROVADOS_FILE)) {
    const linhas = fs.readFileSync(APROVADOS_FILE, 'utf8').split('\n').filter(Boolean);
    const aprovados = linhas.map(l => JSON.parse(l));
    exemplos.push(...aprovados.map(e => ({ role: 'user', content: e.input }),
                                   { role: 'model', content: e.output }));
}
```

**Commit:** `feat(aprendizado): ciclo_aprendizado.js fecha loop few-shot com sugestoes aprovadas`

---

## Após concluir FASE 0 + FASE 1

### Atualizar contexto_mestre.json

Para cada tarefa concluída (`fase0_001` até `fase1_004`), mover de `gargalo` para `motor` no arquivo `comercial-automacao/painel-autoridade/contexto_mestre.json`. Adicionar `atualizado_em` com a data e `atualizado_por: "antigravity"`.

**Commit:** `chore(painel): mover tarefas Fase 0-1 para motor no contexto_mestre.json`

---

## Tarefa de segurança `seg_001` — credentials.json exposto ⚡ P0

> Esta tarefa requer ação **manual** do Mestre (Carmen ou Jonathas). O Antigravity deve:

1. Adicionar `credentials.json` e `token.json` ao `.gitignore` da pasta `comercial-automacao/`.
2. **Notificar o Mestre** (via Telegram ou diretamente) com a mensagem:

```
🚨 ALERTA DE SEGURANÇA

O arquivo comercial-automacao/painel-autoridade/credentials.json 
está exposto no repositório público do GitHub.

Ação necessária IMEDIATA:
1. Acessar console.cloud.google.com
2. Revogar as credenciais OAuth atuais
3. Gerar novas credenciais
4. Atualizar o arquivo local (não commitar)
5. Rodar: git filter-repo --path comercial-automacao/painel-autoridade/credentials.json --invert-paths
   (ou usar BFG Repo Cleaner para remover do histórico)

O Antigravity já adicionou credentials.json ao .gitignore.
```

3. Fazer o commit do `.gitignore` atualizado.

**Commit:** `fix(seguranca): adicionar credentials.json e token.json ao .gitignore`

---

## Checklist de saída (critério para Fase 3 — religar o bot)

Só autorizar `MODO_SILENCIOSO=false` quando TODOS os itens abaixo estiverem marcados:

```
[ ] fase0_001: Guard de mensagem vazia implementado e testado com áudio real
[ ] fase0_002: conversas_state.json limpo (sem números 553190000xxx)
[ ] fase0_003: STATE_FILE separado por ambiente
[ ] fase0_004: Detectores duplicados em estrategias_vendas.js removidos
[ ] fase1_001: Filtro de horário comercial ativo e testado
[ ] fase1_002: sugestoes_supervisor.js criado e integrado no server_integracao.js
[ ] fase1_002: Alerta Telegram disparando ao registrar sugestão
[ ] fase1_003: QA expandido com 25+ cenários, todos passando com MODO_TESTE=true
[ ] fase1_004: ciclo_aprendizado.js criado e integrado no few_shot_loader.js
[ ] seg_001: credentials.json adicionado ao .gitignore (remoção do histórico: ação manual do Mestre)
[ ] qual_001: VALIDADOR_SEMANTICO_ENABLED=true confirmado no .env de produção
[ ] Credenciais verificadas: Z-API Connected, Gemini OK, GestãoClick OK
[ ] sugestoes_bot.jsonl com ≥ 50 registros revisados (≥ 90% aprovação por 3 dias)
[ ] contexto_mestre.json atualizado com todas as tarefas movidas para motor
```

Após todos os itens, seguir a **Fase 3 — Ativação Gradual** descrita no `PLANO_ATUALIZACAO_AIKA.md`:
- Dia 1-2: allowlist interna (apenas números da equipe)
- Dia 3-5: janela restrita (9h-12h)
- Dia 6-7: canary 20% (`CANARY_PCT=20`)
- Dia 8+: produção completa (`CANARY_PCT=100`)

---

## Contatos para notificações Telegram

- **Carmen:** `6823632451`
- **Jonathas:** `868045878`

Ao concluir cada fase, enviar resumo do que foi feito e próximo passo.

---

*Documento criado em 2026-07-01 pelo Claude (arquiteto). Versão 1.0.*
