# ANTIGRAVITY — Modo Autônomo em Loop
**Versão:** 2.0  
**Data:** 2026-07-01  
**Escopo:** APENAS `comercial-automacao/` — bot WhatsApp Aika/Kyenner no Railway  
**Fora do escopo:** GMB, TikTok, Vitrine, LinkedIn, Instagram, vagas — não tocar

---

## PROTOCOLO DE EXECUÇÃO

1. Leia `painel-autoridade/contexto_mestre.json` — estado verdadeiro do projeto
2. Identifique a primeira tarefa em `gargalo` dentro do escopo WhatsApp
3. Execute seguindo as instruções abaixo
4. Valide com os critérios definidos
5. Atualize `contexto_mestre.json` movendo a tarefa para `motor`
6. Commite e pushe
7. Repita do passo 2 até não haver mais tarefas P1 do WhatsApp em `gargalo`
8. Notifique o Mestre via Telegram apenas ao concluir ou encontrar bloqueio real

**Regra:** Só interrompa se encontrar erro que impeça a execução e não esteja documentado aqui.

---

## ESTADO ATUAL (2026-07-01)

| Tarefa | Status |
|--------|--------|
| fase0_001–004 | ✅ motor — QA 25/25 |
| seg_001 | ✅ motor — .gitignore criado |
| fase1_001 | ✅ motor — guard horário seg-sex 9h-18h, sab+dom OFF, mensagem acolhedora implementado pelo RT |
| **fase1_002** | 🔴 **gargalo P1 — próxima a executar** |
| fase1_004 | 🟡 gargalo P2 — ciclo de aprendizado |

---

## TAREFA: fase1_002 — Integrar sugestoes_supervisor.js

**Arquivo alvo:** `server_integracao.js`  
**Módulo já existe em:** `src/observabilidade/sugestoes_supervisor.js` — não recriar

### Passo 1 — Import no topo

```js
const { supervisionar } = require('./src/observabilidade/sugestoes_supervisor');
```

### Passo 2 — Localizar bloco MODO_SILENCIOSO

Buscar por `MODO_SILENCIOSO` no arquivo. Substituir o bloco de silêncio pelo bloco com supervisor:

```js
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

> Adaptar `phone`, `estrategiaAtivada`, `respostaIA` aos nomes reais das variáveis no código.  
> `TELEGRAM_BOT_TOKEN` já está configurado no Railway.

### Critérios de validação

- [ ] Deploy bem-sucedido sem erro de require
- [ ] Mensagem de teste → `sugestoes_bot.jsonl` criado no servidor
- [ ] Log Railway: `[SUPERVISOR] Sugestão registrada:`
- [ ] Cliente NÃO recebeu resposta

### Commit

```
feat(supervisor): integrar sugestoes_supervisor ao pipeline MODO_SILENCIOSO
```

### Após validar — atualizar contexto_mestre.json

Mover `fase1_002` para `motor`. Versão → `5.5`.

---

## TAREFA: go_live_001 — Ativar MODO_SILENCIOSO=false

**Pré-requisito:** fase1_002 validada.

**Ação:** Railway → alterar variável:
```
MODO_SILENCIOSO=false
```

### Critérios de validação

- [ ] Mensagem de teste → bot responde ao cliente
- [ ] Resposta coerente, sem alucinação
- [ ] Log Railway: resposta enviada via Z-API status 200

### Notificar Mestre via Telegram

> "🟢 BOT NO AR. MODO_SILENCIOSO=false. Aika/Kyenner respondendo em produção. Monitorar primeiras 48h."

### Commit

```
chore(painel): go_live_001 — MODO_SILENCIOSO=false, bot em producao
```

Mover `go_live_001` para `motor`. `"fase_atual": "Fase 2 — Produção"`.

---

## TAREFA: fase1_004 — Fechar Ciclo de Aprendizado

**Pré-requisito:** bot em produção há pelo menos 48h com `sugestoes_bot.jsonl` acumulando dados.

**Arquivo a criar:** `src/aprendizado/ciclo_aprendizado.js`

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

    if (!aprovados.length) {
        console.log('[CICLO] Nenhum registro aprovado ainda.');
        return 0;
    }

    const fewShots = aprovados.map(r => ({
        input:        r.mensagemCliente,
        output:       r.respostaSugerida,
        persona:      r.persona,
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

if (require.main === module) { promoverAprovados(); }
```

### Commit

```
feat(aprendizado): ciclo_aprendizado.js — promove exemplos aprovados para few-shots
```

Mover `fase1_004` para `motor`. Versão → `5.6`.

---

## CRITÉRIO DE CONCLUSÃO DO LOOP

O Antigravity para quando:

- [ ] `fase1_002` em motor
- [ ] `go_live_001` em motor — bot respondendo em produção
- [ ] `fase1_004` em motor — ciclo de aprendizado fechado

**Notificação final ao Mestre:**
> "✅ MISSÃO WHATSAPP CONCLUÍDA. Bot em produção, supervisor ativo, ciclo de aprendizado fechado. contexto_mestre.json v5.6. Aguardando próximas instruções do RT para outros módulos."

---

## PADRÃO DE COMMITS

```
feat(modulo): o que foi implementado
fix(modulo): bug corrigido
chore(painel): tarefas movidas para motor
```

## CONTATOS TELEGRAM

| Pessoa | Chat ID |
|--------|---------|
| Carmen | 6823632451 |
| Jonathas | 868045878 |

*Token: `TELEGRAM_BOT_TOKEN` já no Railway*
