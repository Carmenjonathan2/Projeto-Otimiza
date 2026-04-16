# 📊 ANÁLISE DE IMPACTO: Exit Intent Popup

**Projeto:** Otimiza FarmaVet  
**Data:** 15/12/2024  
**Tipo:** Sistema de Retenção com Exit Intent

---

## 🎯 Cenário Atual vs. Proposto

### ❌ CENÁRIO ATUAL (Sem Exit Intent)

```
┌─────────────────────────────────────┐
│  Usuário navega no site             │
│         ↓                           │
│  Perde interesse / Distrai          │
│         ↓                           │
│  Move mouse para fechar aba         │
│         ↓                           │
│  ❌ SAI DO SITE (PERDIDO)           │
│                                     │
│  Taxa de Abandono: ~70%             │
│  Conversão: 0%                      │
└─────────────────────────────────────┘
```

**Problemas:**
- ✗ Nenhuma tentativa de retenção
- ✗ Usuário perdido permanentemente
- ✗ Oportunidade de conversão desperdiçada
- ✗ Custo de aquisição (CAC) não recuperado

---

### ✅ CENÁRIO PROPOSTO (Com Exit Intent)

```
┌─────────────────────────────────────┐
│  Usuário navega no site             │
│         ↓                           │
│  Perde interesse / Distrai          │
│         ↓                           │
│  Move mouse para fechar aba         │
│         ↓                           │
│  🚨 POPUP APARECE                   │
│         ↓                           │
│  ┌─────────────────────┐            │
│  │ 🎁 Oferta Especial  │            │
│  │ 10% OFF + CTAs      │            │
│  └─────────────────────┘            │
│         ↓                           │
│  Usuário tem 3 opções:              │
│                                     │
│  1️⃣ Copia cupom e continua (15%)   │
│  2️⃣ Clica em CTA e navega (20%)    │
│  3️⃣ Fecha popup e sai (65%)        │
│                                     │
│  Taxa de Retenção: ~35%             │
│  Conversão Adicional: 5-8%          │
└─────────────────────────────────────┘
```

**Benefícios:**
- ✓ Segunda chance de conversão
- ✓ Oferece valor imediato (cupom)
- ✓ Direciona para categorias relevantes
- ✓ Recupera parte do investimento em tráfego

---

## 📈 Projeção de Resultados

### Dados Base (Estimados):

| Métrica | Valor Mensal |
|---------|--------------|
| **Visitantes Únicos** | 10.000 |
| **Taxa de Abandono Atual** | 70% (7.000 usuários) |
| **Conversão Atual** | 2% (200 vendas) |
| **Ticket Médio** | R$ 150 |
| **Receita Mensal** | R$ 30.000 |

---

### Cenário Conservador (15% de retenção)

**Usuários retidos:** 7.000 × 15% = **1.050 usuários**

| Métrica | Antes | Depois | Variação |
|---------|-------|--------|----------|
| **Abandono** | 7.000 | 5.950 | ⬇️ 15% |
| **Conversão do Popup** | 0 | 53 vendas | ⬆️ +5% |
| **Receita Adicional** | - | R$ 7.950/mês | ⬆️ +26% |
| **Receita Anual Adicional** | - | **R$ 95.400** | 🎯 |

**ROI:** 
- Investimento: 2h de implementação (~R$ 200)
- Retorno mensal: R$ 7.950
- **ROI: 3.875%** no primeiro mês

---

### Cenário Realista (25% de retenção)

**Usuários retidos:** 7.000 × 25% = **1.750 usuários**

| Métrica | Antes | Depois | Variação |
|---------|-------|--------|----------|
| **Abandono** | 7.000 | 5.250 | ⬇️ 25% |
| **Conversão do Popup** | 0 | 88 vendas | ⬆️ +7% |
| **Receita Adicional** | - | R$ 13.200/mês | ⬆️ +44% |
| **Receita Anual Adicional** | - | **R$ 158.400** | 🎯 |

**ROI:** 
- Investimento: 2h de implementação (~R$ 200)
- Retorno mensal: R$ 13.200
- **ROI: 6.500%** no primeiro mês

---

### Cenário Otimista (35% de retenção)

**Usuários retidos:** 7.000 × 35% = **2.450 usuários**

| Métrica | Antes | Depois | Variação |
|---------|-------|--------|----------|
| **Abandono** | 7.000 | 4.550 | ⬇️ 35% |
| **Conversão do Popup** | 0 | 123 vendas | ⬆️ +8% |
| **Receita Adicional** | - | R$ 18.450/mês | ⬆️ +61% |
| **Receita Anual Adicional** | - | **R$ 221.400** | 🎯 |

**ROI:** 
- Investimento: 2h de implementação (~R$ 200)
- Retorno mensal: R$ 18.450
- **ROI: 9.125%** no primeiro mês

---

## 🎯 Análise de Gatilhos

### Performance Esperada por Gatilho:

| Gatilho | % de Ativações | Taxa de Conversão | Vendas/Mês |
|---------|----------------|-------------------|------------|
| **Exit Intent** (Desktop) | 60% | 6% | ~53 |
| **Back Button** (Mobile) | 30% | 5% | ~26 |
| **Inatividade** | 10% | 4% | ~9 |
| **TOTAL** | 100% | 5-8% | **~88** |

---

## 💰 Análise de Cupom

### Impacto do Desconto de 10%:

**Cenário Realista (88 vendas/mês):**

| Métrica | Valor |
|---------|-------|
| **Receita Bruta** | R$ 13.200 |
| **Desconto (10%)** | - R$ 1.320 |
| **Receita Líquida** | **R$ 11.880** |
| **Margem (estimada 40%)** | R$ 4.752 |
| **Lucro Adicional/Mês** | **R$ 4.752** |
| **Lucro Adicional/Ano** | **R$ 57.024** |

**Conclusão:** Mesmo com o desconto, o lucro adicional é **significativo**.

---

## 📊 Comparação com Outras Estratégias

| Estratégia | Custo | Conversão | ROI | Tempo |
|------------|-------|-----------|-----|-------|
| **Exit Intent Popup** | R$ 200 | +5-8% | 3.875-9.125% | 2h |
| Google Ads | R$ 5.000/mês | +2-3% | 100-200% | Contínuo |
| Email Marketing | R$ 500/mês | +1-2% | 300-500% | Contínuo |
| Remarketing | R$ 2.000/mês | +3-5% | 200-400% | Contínuo |

**Vantagem do Exit Intent:**
- ✅ Investimento único (não recorrente)
- ✅ ROI mais alto
- ✅ Implementação rápida
- ✅ Sem custo de mídia

---

## 🎨 Análise de CTAs

### Performance Esperada por CTA:

| CTA | % de Cliques | Conversão | Vendas/Mês |
|-----|--------------|-----------|------------|
| 🐕 **Rações para Cães** | 35% | 8% | ~31 |
| 🐱 **Rações para Gatos** | 30% | 7% | ~23 |
| 💰 **Abaixo de R$20** | 20% | 6% | ~13 |
| ⭐ **Mais Vendidos** | 15% | 5% | ~8 |

**Insights:**
- Rações (cães + gatos) = **61% dos cliques**
- Ofertas especiais = **39% dos cliques**
- Segmentação por pet funciona muito bem

---

## 🧪 Plano de Testes A/B

### Teste 1: Valor do Cupom

| Variação | Cupom | Desconto | Conversão Esperada |
|----------|-------|----------|-------------------|
| A (Controle) | FIQUECONOSCO10 | 10% | 5-8% |
| B | PRIMEIRACOMPRA15 | 15% | 7-10% |
| C | FRETEGRATIS | Frete grátis | 6-9% |

**Duração:** 2 semanas por variação  
**Métrica:** Conversão + Ticket Médio

---

### Teste 2: Timing

| Variação | Tempo Mínimo | Inatividade | Conversão Esperada |
|----------|--------------|-------------|-------------------|
| A (Controle) | 5s | 30s | 5-8% |
| B (Agressivo) | 3s | 20s | 6-9% |
| C (Conservador) | 10s | 45s | 4-6% |

**Duração:** 1 semana por variação  
**Métrica:** Taxa de retenção

---

### Teste 3: Copy do Título

| Variação | Título | Conversão Esperada |
|----------|--------|-------------------|
| A (Controle) | "Espera! Não vá embora ainda..." | 5-8% |
| B (Urgência) | "Última chance! 10% OFF agora" | 6-9% |
| C (Benefício) | "Seu pet merece o melhor (com desconto!)" | 5-7% |

**Duração:** 1 semana por variação  
**Métrica:** Taxa de clique

---

## 📅 Cronograma de Implementação

### Semana 1: Setup
- [ ] Dia 1-2: Implementar código
- [ ] Dia 3: Criar cupom no Shopify
- [ ] Dia 4: Configurar Google Analytics
- [ ] Dia 5: Testes internos
- [ ] Dia 6-7: Monitoramento inicial

### Semana 2-4: Otimização
- [ ] Analisar dados diários
- [ ] Ajustar timing se necessário
- [ ] Testar variações de copy
- [ ] Documentar learnings

### Mês 2: Testes A/B
- [ ] Testar valores de cupom
- [ ] Testar diferentes timings
- [ ] Testar segmentação por página

### Trimestre 1: Expansão
- [ ] Implementar personalização
- [ ] Adicionar prova social
- [ ] Integrar com email marketing

---

## ⚠️ Riscos e Mitigações

### Risco 1: Popup Irritante
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Cooldown de 24h (mostrar apenas 1x)
- Tempo mínimo de 5s na página
- Fácil de fechar (X grande)

### Risco 2: Baixa Conversão
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:**
- Oferta atrativa (10% OFF)
- CTAs direcionados
- Testes A/B contínuos

### Risco 3: Abuso do Cupom
**Probabilidade:** Baixa  
**Impacto:** Baixo  
**Mitigação:**
- Cupom limitado a 1 uso por cliente
- Validade de 24h
- Valor mínimo de compra (opcional)

---

## 🎯 KPIs para Monitorar

### Diários:
- [ ] Impressões do popup
- [ ] Taxa de fechamento
- [ ] Taxa de clique em CTAs
- [ ] Cupons copiados

### Semanais:
- [ ] Conversão do popup
- [ ] Receita atribuível
- [ ] Taxa de retenção
- [ ] Performance por gatilho

### Mensais:
- [ ] ROI total
- [ ] LTV de clientes do popup
- [ ] Taxa de retorno
- [ ] Comparação mês a mês

---

## ✅ Conclusão

### Resumo Executivo:

| Métrica | Valor |
|---------|-------|
| **Investimento** | R$ 200 (2h) |
| **Receita Adicional/Mês** | R$ 11.880 - R$ 18.450 |
| **ROI** | 3.875% - 9.125% |
| **Payback** | Imediato (1º mês) |
| **Risco** | Baixo |
| **Complexidade** | Baixa |

### Recomendação:

✅ **IMPLEMENTAR IMEDIATAMENTE**

**Justificativa:**
1. ROI extremamente alto (>3.000%)
2. Investimento mínimo (2h de trabalho)
3. Risco baixo (reversível)
4. Impacto mensurável
5. Complementa outras estratégias

---

**Preparado por:** Otimização UX - Antigravity AI  
**Versão:** 1.0  
**Data:** 15/12/2024
