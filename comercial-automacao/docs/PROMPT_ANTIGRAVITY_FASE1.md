# Prompt de Entrada — Antigravity Fase 1
**Data:** 2026-07-01  
**Branch:** `claude/whatsapp-automation-review-a922hj`  
**Status do bot:** `MODO_SILENCIOSO=true` (Railway rodando, não envia nada)

---

## Contexto rápido

A **Fase 0 está 100% concluída** (validada com QA 25/25):
- Guard de mensagem vazia ativo em `processarMensagem()` — áudios/stickers/reactions bloqueados
- `conversas_state.json` limpo e `carregarState()` blindado
- `STATE_FILE` dinâmico por ambiente (`MODO_TESTE`)
- Detectores de vacina B2B deduplicados em `UPSELL_VACINA_COMBO_B2B`

Restam **3 tarefas P1** para liberar `MODO_SILENCIOSO=false`. Execute nesta ordem.

---

## Tarefa 1 — `seg_001`: Adicionar ao `.gitignore` (5 min)

**Arquivo:** `comercial-automacao/.gitignore` (criar se não existir)

Adicionar as linhas:
```
# Credenciais e tokens — nunca commitar
credentials.json
token.json
token_gmb.json
*.token.json

# Arquivos gerados em runtime
sugestoes_bot.jsonl
exemplos_aprovados.jsonl
tiktok_fila_revisao.jsonl
kyenner_vagas_vistas.json
flyers/
audios_comercial/

# State de produção (versionado separadamente)
conversas_state.json
conversas_state_qa.json
```

**Commit:** `fix(seguranca): adicionar credentials, tokens e arquivos runtime ao .gitignore`

---

## Tarefa 2 — `fase1_001`: Filtro de horário comercial (15 min)

**Arquivo:** `comercial-automacao/server_integracao.js`

**Passo 1:** Buscar no arquivo pelas strings `HORARIO_COMERCIAL` ou `horarioComercial` ou `horario_comercial`.

**Passo 2A — Se já existir o filtro:** Verificar se está sendo aplicado no handler do webhook (antes de chamar Gemini). Se sim, apenas confirmar no `contexto_mestre.json` movendo `fase1_001` para `motor`.

**Passo 2B — Se NÃO existir:** Localizar o início do handler principal do webhook Z-API (logo após o guard de mensagem vazia do `fase0_001`). Inserir:

```js
// GUARD: horário comercial
const _agora = new Date();
// Ajuste BRT: se servidor em UTC, subtrair 3h. Se já em BRT, usar getHours() direto.
const _horaBRT = (_agora.getUTCHours() - 3 + 24) % 24;
const _inicioComercial = parseInt(process.env.HORARIO_COMERCIAL_INICIO || '8');
const _fimComercial = parseInt(process.env.HORARIO_COMERCIAL_FIM || '19');
const _ehDomingo = new Date(_agora.getTime() - 3 * 3600000).getUTCDay() === 0;
const _atendeDomingo = process.env.ATENDE_DOMINGO === 'true';

if (_horaBRT < _inicioComercial || _horaBRT >= _fimComercial || (_ehDomingo && !_atendeDomingo)) {
    console.log(`[HORÁRIO] Fora do comercial (${_horaBRT}h BRT). Número: ${phone}`);
    return res.status(200).json({ status: 'fora-horario' });
}
```

> **Atenção:** Verificar se a Railway está configurada em UTC ou BRT antes de escolher entre `getUTCHours()-3` e `getHours()`. Checar variável de ambiente `TZ` no painel da Railway.

**Commit:** `feat(horario): guard de horário comercial BRT no webhook handler`

---

## Tarefa 3 — `fase1_002`: Pipeline de sugestões supervisionadas (45 min)

Esta é a peça central do modo incógnito. Quando o bot processa uma mensagem mas `MODO_SILENCIOSO=true`, a resposta deve ser registrada em arquivo e notificada no Telegram — em vez de enviada ao cliente.

### 3a. Criar `comercial-automacao/src/observabilidade/sugestoes_supervisor.js`

```js
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ARQUIVO = path.resolve(__dirname, '../../sugestoes_bot.jsonl');

function registrarSugestao({ numero, mensagemCliente, respostaSugerida, persona, estrategiaAtivada, contextoInjetado }) {
    const registro = {
        id: `${Date.now()}_${String(numero).slice(-4)}`,
        timestamp: new Date().toISOString(),
        numero: String(numero).replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '$1$2****$4'),
        persona: persona || 'Aika',
        mensagemCliente,
        respostaSugerida,
        estrategiaAtivada: estrategiaAtivada || null,
        contextoInjetado: (contextoInjetado || '').substring(0, 500),
        aprovado_humano: null,
        motivo_reprovacao: null
    };
    fs.appendFileSync(ARQUIVO, JSON.stringify(registro) + '\n', 'utf8');
    console.log(`[SUPERVISOR] Sugestão registrada: ${registro.id}`);
    return registro.id;
}

function alertarTelegram({ id, persona, mensagemCliente, respostaSugerida, estrategiaAtivada }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = (process.env.TELEGRAM_CHAT_IDS || '6823632451,868045878').split(',').filter(Boolean);
    if (!token) {
        console.warn('[SUPERVISOR] TELEGRAM_BOT_TOKEN não configurado.');
        return;
    }

    const emoji = persona === 'Kyenner' ? '🦷' : '🐾';
    const texto = `${emoji} *SUGESTÃO ${persona.toUpperCase()} \[Incógnito\]*\n\n` +
        `💬 *Cliente:*\n_${mensagemCliente.substring(0, 200).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}_\n\n` +
        `🎯 Estratégia: \`${estrategiaAtivada || 'nenhuma'}\`\n\n` +
        `🤖 *Bot sugere:*\n${respostaSugerida.substring(0, 400).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')}\n\n` +
        `🆔 ID: \`${id}\`\n_Revisar: node revisar\_sugestoes.js_`;

    chatIds.forEach(chatId => {
        const data = JSON.stringify({ chat_id: chatId.trim(), text: texto, parse_mode: 'MarkdownV2' });
        const req = https.request(
            `https://api.telegram.org/bot${token}/sendMessage`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
            res => res.resume()
        );
        req.on('error', e => console.error(`[SUPERVISOR-TG] ${e.message}`));
        req.write(data);
        req.end();
    });
}

module.exports = { registrarSugestao, alertarTelegram };
```

### 3b. Integrar em `server_integracao.js`

Localizar o bloco onde a resposta da Aika/Kyenner seria enviada via Z-API (buscar por `enviarMensagem`, `sendMessage`, `whatsapp_gateway` ou similar). Substituir o envio condicional:

```js
// ANTES (simplificado):
await enviarMensagem(phone, respostaIA);

// DEPOIS:
if (process.env.MODO_SILENCIOSO === 'true') {
    const supervisor = require('./src/observabilidade/sugestoes_supervisor');
    const id = supervisor.registrarSugestao({
        numero: phone,
        mensagemCliente: clientMessage,
        respostaSugerida: respostaIA,
        persona: tipoCliente === 'B2B' ? 'Kyenner' : 'Aika',
        estrategiaAtivada: estrategiaAtivada || null,
        contextoInjetado: contextoInjetado || ''
    });
    supervisor.alertarTelegram({
        id,
        persona: tipoCliente === 'B2B' ? 'Kyenner' : 'Aika',
        mensagemCliente: clientMessage,
        respostaSugerida: respostaIA,
        estrategiaAtivada: estrategiaAtivada || null
    });
    // NÃO envia ao cliente. Apenas registra e notifica equipe.
} else {
    await enviarMensagem(phone, respostaIA);
}
```

> **Adaptar os nomes de variável** (`respostaIA`, `clientMessage`, `tipoCliente`, `estrategiaAtivada`, `contextoInjetado`) aos nomes reais usados no `server_integracao.js`. Fazer uma busca por `MODO_SILENCIOSO` no arquivo para encontrar onde já existe lógica de silencioso e integrar ali.

**Commit:** `feat(supervisor): sugestoes_supervisor.js com registro JSONL e alerta Telegram`

---

## Após concluir as 3 tarefas

**Atualizar `contexto_mestre.json`:**
- `seg_001` → `motor`
- `fase1_001` → `motor` (ou confirmar que já existia)
- `fase1_002` → `motor`

**Commit:** `chore(painel): seg_001 + fase1_001 + fase1_002 concluídos, movidos para motor`

---

## Teste de validação da Fase 1

Antes de reportar como concluído, validar:

1. **Horário:** Simular webhook fora do horário comercial (ex: mudar `HORARIO_COMERCIAL_FIM=0` temporariamente). Log deve mostrar `[HORÁRIO] Fora do comercial`.

2. **Supervisor:** Enviar mensagem de texto real para o número do bot com `MODO_SILENCIOSO=true`. Verificar:
   - Arquivo `sugestoes_bot.jsonl` criado com o registro
   - Notificação chegou no Telegram da Carmen (`6823632451`) e Jonathas (`868045878`)
   - Bot **não respondeu** ao cliente

3. **`.gitignore`:** Confirmar que `git status` não lista `credentials.json`, `token.json` ou `sugestoes_bot.jsonl` como untracked.

---

## Após validação: checklist de liberação

Quando o Mestre (Carmen ou Jonathas) confirmar que as notificações chegaram no Telegram, o sistema está pronto para a **Fase 3 — Ativação Gradual**:

```
Dia 1-2:  ALLOWLIST_NUMEROS=5531XXXXXXXX  (apenas equipe)
          MODO_SILENCIOSO=false
          HORARIO_COMERCIAL_INICIO=9 / FIM=12

Dia 3-5:  Ampliar horário para 8-19
          Monitorar sugestoes_bot.jsonl e Telegram

Dia 6-7:  CANARY_PCT=20 (20% dos clientes recebem resposta real)

Dia 8+:   CANARY_PCT=100 (produção completa)
```

Qualquer comportamento inesperado → `MODO_SILENCIOSO=true` imediatamente.

---

*Prompt gerado em 2026-07-01 pelo Claude (arquiteto).*
