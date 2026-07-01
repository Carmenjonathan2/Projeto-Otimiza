# Correção: Horário Comercial e Mensagem Acolhedora

**Versão:** 1.0  
**Data:** 2026-07-01  
**Prioridade:** P1 (fase1_001)  
**Arquivo alvo:** `src/server_integracao.js`

---

## Problema Atual

O guard de horário comercial atual:
- Só bloqueia **domingo** (`_diaSemana === 0`)
- **Não bloqueia sábado** — bug crítico
- Em vez de acolher o cliente, simplesmente silencia (péssima UX)

---

## Especificação Correta (confirmada pelo RT em 2026-07-01)

| Parâmetro | Valor |
|-----------|-------|
| Dias de atendimento | Segunda a Sexta |
| Início | 9h (BRT) |
| Fim | 18h (BRT) |
| Sábado | **OFF** |
| Domingo | **OFF** |

---

## Variáveis de Ambiente — Railway

Adicionar/atualizar no painel Railway:

```env
HORARIO_COMERCIAL_INICIO=9
HORARIO_COMERCIAL_FIM=18
ATENDE_SABADO=false
ATENDE_DOMINGO=false
```

---

## Código Corrigido do Guard

Substituir o guard existente no início de `processarMensagem()`:

```javascript
// ─── Guard de Horário Comercial ───────────────────────────────────────────────
const _inicioComercial = parseInt(process.env.HORARIO_COMERCIAL_INICIO || '9');
const _fimComercial    = parseInt(process.env.HORARIO_COMERCIAL_FIM    || '18');
const _agora           = new Date();

// BRT = UTC-3 (Railway roda em UTC)
const _horaBRT    = (_agora.getUTCHours() - 3 + 24) % 24;
const _agora_brt  = new Date(_agora.getTime() - 3 * 3600000);
const _diaSemana  = _agora_brt.getUTCDay(); // 0=dom, 1=seg ... 6=sab

const _ehFimDeSemana  = _diaSemana === 0 || _diaSemana === 6; // dom ou sab
const _foraDoHorario  = _horaBRT < _inicioComercial || _horaBRT >= _fimComercial || _ehFimDeSemana;

if (_foraDoHorario) {
  const _stateCliente   = conversas[telefone] || {};
  const _ultimoAviso    = _stateCliente.ultimo_aviso_horario;
  const _quatroHoras    = 4 * 60 * 60 * 1000;
  const _deveAvisar     = !_ultimoAviso || (Date.now() - _ultimoAviso) > _quatroHoras;

  if (_deveAvisar) {
    // EXCEÇÃO: mensagem acolhedora envia MESMO em MODO_SILENCIOSO
    const _msgAcolhedora = 'Olá! 🐾 Recebi sua mensagem mas nosso time atende de segunda a sexta, das 9h às 18h. Assim que abrirmos, te respondemos com tudo que precisa. Obrigada pela compreensão! 😊';
    await enviarMensagem(telefone, _msgAcolhedora);

    // Atualiza anti-repetição no state
    conversas[telefone] = { ..._stateCliente, ultimo_aviso_horario: Date.now() };
    salvarConversas(conversas);
  }

  return; // Encerra sem chamar Gemini
}
// ─────────────────────────────────────────────────────────────────────────────
```

---

## Comportamento Esperado

| Situação | Ação do Bot |
|----------|-------------|
| Seg-Sex 9h-18h BRT | Processa normalmente |
| Seg-Sex fora do horário | Envia acolhedora (1x a cada 4h) e encerra |
| Sábado (qualquer hora) | Envia acolhedora (1x a cada 4h) e encerra |
| Domingo (qualquer hora) | Envia acolhedora (1x a cada 4h) e encerra |
| 2ª mensagem dentro de 4h fora do horário | Silencia (não repete aviso) |

---

## Atenção: MODO_SILENCIOSO não se aplica à mensagem acolhedora

A função `enviarMensagem()` normalmente respeita `MODO_SILENCIOSO=true`.  
Para a mensagem acolhedora, chamar diretamente o endpoint Z-API **sem** o check do MODO_SILENCIOSO, ou adicionar parâmetro `forcar=true`:

```javascript
// Opção A: novo parâmetro na função enviarMensagem
async function enviarMensagem(telefone, mensagem, forcar = false) {
  if (MODO_SILENCIOSO && !forcar) {
    console.log('[SILENCIOSO] Mensagem não enviada:', mensagem.substring(0, 50));
    return;
  }
  // ... lógica Z-API existente
}

// Chamada com forçar:
await enviarMensagem(telefone, _msgAcolhedora, true);
```

---

## Validação Após Deploy

1. Enviar mensagem no sábado → deve receber acolhedora
2. Enviar 2ª mensagem em < 4h no sábado → deve silenciar (sem repetição)
3. Enviar mensagem segunda às 8h → deve receber acolhedora
4. Enviar mensagem segunda às 10h → deve ser processada normalmente
5. Verificar log Railway: `[HORARIO] Fora do horário - sab/dom/feriado`

---

## Commit Message

```
feat(horario): corrigir guard seg-sex 9h-18h BRT, sab/dom OFF com mensagem acolhedora

- Adiciona bloqueio de sábado (apenas domingo era bloqueado)
- Substitui silêncio por mensagem acolhedora 🐾
- Anti-repetição de 4h via ultimo_aviso_horario no state
- Exceção MODO_SILENCIOSO: acolhedora sempre envia
- Vars Railway: HORARIO_COMERCIAL_INICIO=9, HORARIO_COMERCIAL_FIM=18
```
