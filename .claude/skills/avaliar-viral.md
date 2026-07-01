# Skill: /avaliar-viral
# Pontua um roteiro ou rascunho de Reel ANTES de gravar — baseado nos sinais do algoritmo do Instagram

## O que esta skill faz

Recebe um roteiro, ideia ou rascunho de Reel e devolve:
- Pontuação de 0 a 10 em cada sinal de viralidade
- Nota geral
- Diagnóstico claro do que está fraco
- Sugestão de melhoria cirúrgica para cada ponto fraco

---

## Sinais Avaliados (baseados em dados reais da conta + comportamento documentado do algoritmo)

### 1. Força do Hook (0–10)
As primeiras 3 palavras/segundos geram pausa imediata no scroll?

Referência dos dados da conta:
- Hook fraco → taxa de skip 85,4%, retenção média de 2 segundos (caso doação de sangue)
- Hook forte → 72,4 mil views (caso toxoplasmose — pergunta que a pessoa JÁ TINHA)

Critérios:
- 9–10: Abre com tensão, dúvida urgente ou cena inesperada
- 6–8: Hook presente mas genérico, poderia ser de qualquer perfil
- 0–5: Abre explicando o tema, sem gancho, sem tensão

### 2. Retenção Esperada (0–10)
O roteiro mantém interesse do início ao fim?

Critérios:
- O ponto principal está antes dos 10 segundos?
- Há variação de ritmo (pausa, virada, revelação)?
- Termina antes de cansar?

### 3. Potencial de Salvamento (0–10)
A pessoa guardaria esse vídeo para usar depois?

Conteúdo que gera salvamento: dica prática, lista, informação que a pessoa vai precisar amanhã, resposta a uma dúvida recorrente.

### 4. Potencial de Compartilhamento (0–10)
A pessoa mandaria isso para alguém?

Gatilhos de compartilhamento: "isso é exatamente você", humor que representa, informação urgente ("manda pro dono de pet"), polêmica que provoca debate.

### 5. Relevância para o Público-Alvo (0–10)
Responde uma dúvida que o tutor de pet JÁ TEM — não uma dúvida que achamos que ele deveria ter?

Referência: Post de precificação = 20 views (tutor não tem essa dúvida). Toxoplasmose = 72K views (tutor já tinha essa pergunta).

### 6. Gatilho Emocional (0–10)
Qual emoção é ativada? Está clara e presente?

- Medo/alerta: "seu pet pode estar em risco"
- Curiosidade: "você não vai acreditar nisso"
- Identificação: "isso acontece com todo tutor"
- Humor: leveza que faz soltar a tela
- Orgulho: "você está fazendo certo"

### 7. Clareza de Quem Fala (0–10)
Está evidente que é o Kiki falando — não uma marca genérica?

---

## Formato de Saída

```
AVALIAÇÃO DO REEL
━━━━━━━━━━━━━━━━━━━━━━━━

NOTA GERAL: [X]/10

SINAIS:
Hook:                [X]/10  [emoji status]
Retenção esperada:   [X]/10  [emoji status]
Potencial de save:   [X]/10  [emoji status]
Potencial de share:  [X]/10  [emoji status]
Relevância:          [X]/10  [emoji status]
Gatilho emocional:   [X]/10  [emoji status]
Voz do Kiki:         [X]/10  [emoji status]

━━━━━━━━━━━━━━━━━━━━━━━━
DIAGNÓSTICO:
[2-3 frases sobre o maior problema identificado]

CIRURGIA (o que mudar):
[Sugestão específica e pronta para aplicar — não genérica]

PREVISÃO:
[Estimativa honesta de performance: "Esse roteiro está no padrão do Reel de doação de sangue (baixa retenção)" ou "Potencial de estar no nível toxoplasmose se o hook for ajustado"]
```

Emojis de status: verde para 8–10, amarelo para 5–7, vermelho para 0–4.
