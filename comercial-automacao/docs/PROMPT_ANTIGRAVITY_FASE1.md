# Prompt de Entrada — Antigravity Fase 1

**Para:** Agente Antigravity  
**Missão:** Implementar 3 tarefas P1 que desbloqueiam MODO_SILENCIOSO=false  
**Data:** 2026-07-01  
**Status atual:** MODO_SILENCIOSO=true (bot ouve mas não fala)

---

## Contexto Rápido

O bot Aika/Kyenner roda em Railway com `server_integracao.js`. A Fase 0 foi concluída com 100% de QA (25/25). Agora faltam 3 tarefas para ir ao ar.

**Antes de implementar, leia:**
- `PLANO_ATUALIZACAO_AIKA.md` — arquitetura completa
- `CORRECAO_HORARIO_COMERCIAL.md` — spec do horário corrigido

---

## Tarefa 1: seg_001 — .gitignore

**Arquivo:** `comercial-automacao/.gitignore` (criar se não existir)

```gitignore
# Credenciais e tokens OAuth
credentials.json
token.json

# Estado de conversas (runtime — não versionado)
conversas_state.json
conversas_state_qa.json

# Logs de observabilidade
sugestoes_bot.jsonl

# Variáveis de ambiente locais
.env
.env.local

# Dependências
node_modules/
```

**Commit:** `seg: adicionar .gitignore com arquivos sensíveis e runtime`

---

## Tarefa 2: fase1_001 — Horário Comercial Correto

**Arquivo:** `src/server_integracao.js`

Localizar o guard de horário atual e substituir pelo código completo em `CORRECAO_HORARIO_COMERCIAL.md`.

Pontos críticos:
1. Bloquear **sábado E domingo** (atual só bloqueia domingo)
2. BRT = UTC-3 (usar `_agora.getUTCHours() - 3`)
3. Dia da semana calculado em BRT também
4. Mensagem acolhedora envia com `forcar=true` (ignora MODO_SILENCIOSO)
5. Anti-repetição: 4h TTL via `ultimo_aviso_horario` no state

**Variáveis Railway a configurar:**
```
HORARIO_COMERCIAL_INICIO=9
HORARIO_COMERCIAL_FIM=18
ATENDE_SABADO=false
ATENDE_DOMINGO=false
```

**Commit:** `feat(horario): seg-sex 9h-18h BRT, sab+dom OFF, mensagem acolhedora com anti-repetição 4h`

---

## Tarefa 3: fase1_002 — Integrar sugestoes_supervisor.js

O arquivo `src/observabilidade/sugestoes_supervisor.js` já está criado. Agora integrar no pipeline:

**Em `server_integracao.js`, após a resposta do Gemini:**

```javascript
const { supervisionar } = require('./observabilidade/sugestoes_supervisor');

// ... após obter respostaGemini e intencaoDetectada:
supervisionar({
  telefone,
  intencaoDetectada: intencaoDetectada || 'indefinida',
  respostaBot: respostaGemini,
  flagRevisao: intencaoDetectada === 'ESCALADA_HUMANO' || !respostaGemini,
  alertar: intencaoDetectada === 'ESCALADA_HUMANO'
});
```

**Variável Railway a configurar:**
```
TELEGRAM_BOT_TOKEN=<token do bot Telegram da Otimiza>
```

**Commit:** `feat(observabilidade): integrar sugestoes_supervisor ao pipeline Gemini`

---

## Checklist Antes de Reportar Concluído

- [ ] `.gitignore` criado com todos os arquivos sensíveis
- [ ] Guard de horário atualizado (sab+dom bloqueados)
- [ ] BRT calculado via UTC-3 explicitamente
- [ ] Mensagem acolhedora chama `enviarMensagem(..., true)` ou equivalente
- [ ] Anti-repetição 4h implementada via `ultimo_aviso_horario`
- [ ] `sugestoes_supervisor.js` importado em `server_integracao.js`
- [ ] `supervisionar()` chamado após resposta Gemini
- [ ] Todos os 3 commits feitos com mensagens descritivas
- [ ] Sem `console.error` não tratados

---

## Validação Pós-Deploy

```bash
# 1. Teste fora do horário (enviar mensagem num sábado ou antes das 9h)
# → Deve receber: "Olá! 🐾 Recebi sua mensagem mas nosso time atende de segunda a sexta..."

# 2. Teste anti-repetição (enviar 2ª mensagem em < 4h)
# → Deve silenciar (sem repetição)

# 3. Verificar arquivo criado
ls -la sugestoes_bot.jsonl

# 4. Verificar conteúdo do JSONL
tail -3 sugestoes_bot.jsonl | python3 -m json.tool

# 5. Verificar Telegram
# → Carmen (6823632451) e Jonathas (868045878) devem receber alerta
#   quando intencaoDetectada === 'ESCALADA_HUMANO'
```

---

## Após Conclusão

Atualizar `painel-autoridade/contexto_mestre.json`:
- Mover `seg_001`, `fase1_001`, `fase1_002` de `gargalo` para `motor`
- Atualizar `"fase_atual"` para `"Fase 1 — Produção"`
- Mudar `"modo_silencioso": false`

Então notificar o Mestre via Telegram:
> "✅ Fase 1 P1 concluída. seg_001 + fase1_001 + fase1_002 no motor. Bot pronto para MODO_SILENCIOSO=false. Aguardando autorização do RT."

---

## Roadmap Fase 3 (após validação em produção)

| Semana | Ação |
|--------|------|
| S1 | MODO_SILENCIOSO=false em horário comercial |
| S2 | Monitorar sugestoes_bot.jsonl + ajustar prompt |
| S3 | Ativar VALIDADOR_SEMANTICO_ENABLED=true |
| S4 | Fechar ciclo aprendizado (fase1_004) |
| S5+ | gm_001, sh_001, tk_001 em paralelo |
