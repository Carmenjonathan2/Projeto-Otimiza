# Skill: /plano-semanal
# Gera o calendário editorial semanal para @kyenner_ e @otimizafarmavet

## Contexto

Dois perfis, dois ICPs, uma operação enxuta onde a IA faz o máximo possível.

**@kyenner_** — 4 posts/semana (Reels prioritariamente)
**@otimizafarmavet** — 3 posts/semana (pode incluir adaptações do @kyenner_ + conteúdo próprio B2B)

**Filosofia:** Cultivar, cuidar e nutrir. Cada post tem propósito emocional claro.

---

## O que esta skill faz

Gera um plano completo para 7 dias com:
- Tema de cada post por perfil
- Formato (Reel, carrossel, estático)
- Pilar de conteúdo
- Gancho central
- Melhor horário sugerido
- Quem produz (Kiki grava / IA gera / adaptação)

---

## Pilares @kyenner_

| Pilar | Frequência | Descrição |
|---|---|---|
| Vida real | 1–2x/semana | Momentos com Maria Fernanda, rotina, bastidores |
| Opinião com profundidade | 1x/semana | Take do Kiki sobre algo no mundo pet/veterinário |
| Educação leve | 1x/semana | Dica ou mito desmontado — em voz de amigo, não de professor |
| Conexão com tutor | 1x/semana | Pergunta, enquete, momento de cumplicidade |

## Pilares @otimizafarmavet

| Pilar | Frequência | Descrição |
|---|---|---|
| Serviço/agilidade | 1x/semana | Prova de que a Otimiza entrega onde outros falham |
| Educação técnica | 1x/semana | Conteúdo clínico para vet — medicamento, protocolo, novidade |
| Parceria/posicionamento | 1x/semana | Ecossistema, visão, posicionamento futuro (mentorias, cursos) |

---

## Instrução de Execução

Quando o usuário invocar `/plano-semanal`, pergunte:

> "Tem algum tema, data especial, lançamento ou momento da semana que devo considerar? Ou gero com base nos pilares?"

Se houver contexto, incorpore. Se não, gere com base nos pilares rotativos.

---

## Formato de Saída

```
PLANO SEMANAL — [DATA INÍCIO] a [DATA FIM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@KYENNER_ ✦ Cultivar, cuidar e nutrir

SEG | [Pilar] | [Formato]
Gancho: "[hook sugerido]"
Quem produz: [Kiki grava / IA gera imagem / adaptação]
Horário: [sugestão]

QUA | [Pilar] | [Formato]
...

SEX | [Pilar] | [Formato]
...

DOM | [Pilar] | [Formato]
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@OTIMIZAFARMAVET ✦ O parceiro que o vet precisa

TER | [Pilar] | [Formato]
Gancho: "[hook sugerido]"
Quem produz: [Adaptação do @kyenner_ / IA gera / Kiki grava]
Horário: [sugestão]

QUI | [Pilar] | [Formato]
...

SAB | [Pilar] | [Formato]
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTA DA SEMANA:
[Observação estratégica — o que testar, o que observar, se tem Reel de Teste recomendado]
```
