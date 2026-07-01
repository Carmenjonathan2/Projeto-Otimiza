# Correção — Horário Comercial
**Data:** 2026-07-01  
**Para:** Antigravity  
**Prioridade:** P1 (corrigir antes de religar)

---

## Horário oficial da Otimiza FarmaVet

- **Dias:** Segunda a Sexta
- **Horas:** 9h às 18h (BRT)
- **Sábado:** OFF
- **Domingo:** OFF

---

## 1. Atualizar variáveis no `.env` da Railway

No painel da Railway, atualizar (ou confirmar) as variáveis de ambiente:

```
HORARIO_COMERCIAL_INICIO=9
HORARIO_COMERCIAL_FIM=18
ATENDE_SABADO=false
ATENDE_DOMINGO=false
```

---

## 2. Corrigir o guard de horário em `server_integracao.js`

O guard anterior só bloqueava domingo. **Sábado também deve ser bloqueado.**

Substituir o bloco de horário por este (adaptar nomes de variável ao código real):

```js
// GUARD: horário comercial — seg-sex 9h-18h BRT
const _agora = new Date();
// Se Railway em UTC, usar getUTCHours()-3. Se já em BRT, usar getHours().
const _horaBRT = (_agora.getUTCHours() - 3 + 24) % 24;
const _diaSemana = new Date(_agora.getTime() - 3 * 3600000).getUTCDay(); // 0=dom, 6=sab
const _inicioComercial = parseInt(process.env.HORARIO_COMERCIAL_INICIO || '9');
const _fimComercial = parseInt(process.env.HORARIO_COMERCIAL_FIM || '18');
const _ehFimDeSemana = _diaSemana === 0 || _diaSemana === 6; // domingo ou sabado

const _foraDoHorario = _horaBRT < _inicioComercial || _horaBRT >= _fimComercial || _ehFimDeSemana;

if (_foraDoHorario) {
    // Resposta acolhedora em vez de silencio
    const _msgForaHorario =
        `Olá! 🐾 Recebi sua mensagem mas nosso time atende de segunda a sexta, das 9h às 18h.\n\n` +
        `Assim que abrirmos, te respondemos com tudo que precisa. Obrigada pela compreensão! 😊`;

    // Enviar a mensagem de fora de horário (esta é a única mensagem que sai mesmo com MODO_SILENCIOSO=true)
    try {
        await enviarMensagem(phone, _msgForaHorario);
    } catch (_e) {
        console.error('[HORÁRIO] Erro ao enviar aviso fora de horário:', _e.message);
    }

    console.log(`[HORÁRIO] Fora do comercial (${_horaBRT}h BRT, dia ${_diaSemana}). Aviso enviado para ${phone}.`);
    return res.status(200).json({ status: 'fora-horario' });
}
```

> **Importante:** A mensagem de fora de horário é a **única exceção** ao `MODO_SILENCIOSO`. Ela sai sempre, porque o cliente precisa saber que foi ouvido.
>
> Adaptar `enviarMensagem` ao nome real da função de envio Z-API no código.

---

## 3. Anti-repetição da mensagem fora de horário

Se o cliente mandar várias mensagens fora do horário (ex: manda 3 mensagens seguidas à meia-noite), o bot não deve repetir o aviso 3 vezes. Usar o state do cliente para controlar:

```js
const _stateCliente = carregarState()[phone] || {};
const _ultimoAvisoHorario = _stateCliente.ultimo_aviso_horario || 0;
const _quatroHoras = 4 * 60 * 60 * 1000;

if (_foraDoHorario) {
    if (Date.now() - _ultimoAvisoHorario > _quatroHoras) {
        // Só envia aviso se já passaram 4h desde o último
        await enviarMensagem(phone, _msgForaHorario);
        // Salvar timestamp do aviso no state
        const _state = carregarState();
        _state[phone] = { ..._stateCliente, ultimo_aviso_horario: Date.now() };
        salvarState(_state);
    } else {
        console.log(`[HORÁRIO] Aviso já enviado recentemente para ${phone}. Silenciando.`);
    }
    return res.status(200).json({ status: 'fora-horario' });
}
```

---

## 4. Commit

`fix(horario): seg-sex 9h-18h BRT, sabado e domingo off, resposta acolhedora anti-repeticao`

---

## 5. Atualizar `contexto_mestre.json`

Após implementar, mover `fase1_001` de `gargalo` para `motor` com nota:

```json
"descricao": "Guard implementado: seg-sex 9h-18h BRT. Sabado e domingo bloqueados. Resposta acolhedora com anti-repetição (4h TTL).",
"atualizado_em": "2026-07-01",
"atualizado_por": "antigravity"
```

---

*Correção gerada em 2026-07-01 pelo Claude.*
