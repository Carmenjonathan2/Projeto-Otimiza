# 🚨 EXIT INTENT POPUP - GUIA DE IMPLEMENTAÇÃO

## 📊 Resumo Executivo

**Objetivo:** Reduzir a taxa de abandono do site oferecendo um incentivo personalizado quando o usuário demonstra intenção de sair.

**Resultado Esperado:** Redução de 15-25% na taxa de abandono + aumento de 10-15% na conversão.

---

## 🎯 Como Funciona

O sistema detecta **3 gatilhos** de intenção de saída:

### 1. 🖱️ Exit Intent (Desktop)
**Quando:** Mouse se move para fora da janela (topo)  
**Uso:** Usuário vai fechar a aba ou mudar de site

### 2. ⬅️ Back Button (Mobile)
**Quando:** Usuário pressiona o botão "voltar"  
**Uso:** Tentativa de sair do site

### 3. ⏱️ Inatividade
**Quando:** 30 segundos sem interação  
**Uso:** Usuário está distraído ou perdeu interesse

---

## 🎁 O Que o Popup Oferece

```
┌─────────────────────────────────┐
│  🎁                             │
│  Espera! Não vá embora ainda... │
│                                 │
│  Aproveite 10% de desconto      │
│  na sua primeira compra!        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Use o cupom:            │   │
│  │ FIQUECONOSCO10 [Copiar] │   │
│  └─────────────────────────┘   │
│                                 │
│  ou escolha por onde começar    │
│                                 │
│  [🐕 Rações para Cães]          │
│  [🐱 Rações para Gatos]         │
│                                 │
│  [💰 <R$20] [⭐ Vendidos]       │
│                                 │
│  Ver todos os produtos          │
└─────────────────────────────────┘
```

---

## 🚀 Implementação no Shopify

### Passo 1: Adicionar os Arquivos

#### 1.1. Adicionar JavaScript
1. Vá em `Online Store` → `Themes` → `Actions` → `Edit code`
2. Clique em `Assets` → `Add a new asset`
3. Crie um arquivo chamado `exit-intent-popup.js`
4. Cole o conteúdo do arquivo fornecido
5. Salve

#### 1.2. Adicionar CSS
1. Em `Assets` → `Add a new asset`
2. Crie um arquivo chamado `exit-intent-popup.css`
3. Cole o conteúdo do arquivo fornecido
4. Salve

### Passo 2: Referenciar no Tema

Abra `layout/theme.liquid` e adicione **antes do `</head>`**:

```liquid
{%- comment -%} Exit Intent Popup {%- endcomment -%}
{{ 'exit-intent-popup.css' | asset_url | stylesheet_tag }}
```

E adicione **antes do `</body>`**:

```liquid
{%- comment -%} Exit Intent Popup {%- endcomment -%}
<script src="{{ 'exit-intent-popup.js' | asset_url }}" defer></script>
```

### Passo 3: Configurar o Cupom de Desconto

1. Vá em `Discounts` no admin do Shopify
2. Clique em `Create discount` → `Discount code`
3. Configure:
   - **Código:** `FIQUECONOSCO10`
   - **Tipo:** Percentage
   - **Valor:** 10%
   - **Mínimo:** Nenhum (ou defina um valor mínimo)
   - **Uso:** Uma vez por cliente
   - **Validade:** Sem data de expiração

---

## ⚙️ Configurações Personalizáveis

Abra `exit-intent-popup.js` e edite o objeto `CONFIG` (linhas 18-37):

```javascript
const CONFIG = {
  // Mostrar apenas se carrinho estiver vazio
  showOnlyIfCartEmpty: true,  // ← true/false
  
  // Mostrar apenas 1x a cada X horas
  cooldownHours: 24,  // ← 1, 6, 12, 24, 48...
  
  // Tempo mínimo na página antes de ativar (segundos)
  minTimeOnPage: 5,  // ← 3, 5, 10, 15...
  
  // Tempo de inatividade para trigger (segundos)
  inactivityTimeout: 30,  // ← 15, 30, 45, 60...
  
  // Cupom de desconto
  couponCode: 'FIQUECONOSCO10',  // ← Seu código
  discountPercent: 10,  // ← Percentual
  
  // Coleções (já configuradas!)
  collections: {
    dogs: '/collections/racoes-secas-caes',
    cats: '/collections/racoes-secas-gatos',
    deals: '/collections/mimostudoabaixode20',
    bestsellers: '/collections/mais-vendidos-no-mes'
  }
};
```

---

## 🎨 Personalização Visual

### Alterar Cores do Gradiente

No arquivo `exit-intent-popup.css`, procure por (linha ~90):

```css
.exit-popup-coupon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* ↑ Altere estas cores */
}
```

**Sugestões de gradientes:**
- **Verde/Azul:** `#11998e 0%, #38ef7d 100%`
- **Laranja/Rosa:** `#f857a6 0%, #ff5858 100%`
- **Roxo/Azul:** `#667eea 0%, #764ba2 100%` (atual)

### Alterar Textos

No arquivo `exit-intent-popup.js`, procure pela função `createPopupHTML()` (linha ~100):

```javascript
<h2 class="exit-popup-title">Espera! Não vá embora ainda...</h2>
<!-- ↑ Altere este texto -->

<p class="exit-popup-subtitle">
  Aproveite <strong>${CONFIG.discountPercent}% de desconto</strong> na sua primeira compra!
  <!-- ↑ Altere este texto -->
</p>
```

**Sugestões de títulos:**
- "Espera! Temos uma surpresa para você..."
- "Antes de ir, que tal um presente? 🎁"
- "Não perca esta oferta exclusiva!"

---

## 📈 Métricas e Analytics

O sistema já envia eventos para o Google Analytics automaticamente:

### Eventos Rastreados:

| Evento | Quando Dispara | Dados |
|--------|----------------|-------|
| `exit_popup_shown` | Popup é exibido | - |
| `exit_popup_trigger` | Gatilho ativado | `trigger: exit_intent/back_button/inactivity` |
| `exit_popup_coupon_copied` | Cupom copiado | - |
| `exit_popup_cta_click` | CTA clicado | `cta: nome do botão` |
| `exit_popup_closed` | Popup fechado | - |

### Como Visualizar no Google Analytics 4:

1. Vá em `Reports` → `Engagement` → `Events`
2. Procure por eventos começando com `exit_popup_`
3. Analise:
   - Taxa de conversão do popup
   - Qual CTA tem mais cliques
   - Qual gatilho é mais efetivo

---

## 🧪 Testes Recomendados

### Teste A/B de Cupons:

| Variação | Cupom | Desconto | Objetivo |
|----------|-------|----------|----------|
| A | FIQUECONOSCO10 | 10% | Baseline |
| B | PRIMEIRACOMPRA15 | 15% | Maior conversão |
| C | FRETEGRATIS | Frete grátis | Ticket maior |

### Teste A/B de Timing:

| Variação | Tempo Mínimo | Inatividade |
|----------|--------------|-------------|
| A | 5s | 30s |
| B | 10s | 45s |
| C | 3s | 20s |

---

## 🔧 Troubleshooting

### Problema: Popup não aparece

**Soluções:**
1. Verifique o console do navegador (F12) para erros
2. Confirme que os arquivos foram adicionados corretamente
3. Limpe o cache do navegador
4. Verifique se o cooldown está ativo:
   ```javascript
   // No console do navegador:
   localStorage.removeItem('exitPopupLastShown');
   ```

### Problema: Popup aparece muito cedo

**Solução:**
Aumente `minTimeOnPage` no CONFIG:
```javascript
minTimeOnPage: 10,  // Era 5, agora 10 segundos
```

### Problema: Popup aparece muito tarde

**Solução:**
Reduza `inactivityTimeout` no CONFIG:
```javascript
inactivityTimeout: 15,  // Era 30, agora 15 segundos
```

### Problema: Popup aparece toda hora

**Solução:**
Aumente `cooldownHours` no CONFIG:
```javascript
cooldownHours: 48,  // Era 24, agora 48 horas
```

---

## 📊 Benchmarks de Mercado

### Taxa de Conversão Esperada:

| Indústria | Conversão do Popup | Redução de Abandono |
|-----------|-------------------|---------------------|
| E-commerce Geral | 2-5% | 10-15% |
| Pet Shop | 3-7% | 15-20% |
| E-commerce Premium | 5-10% | 20-30% |

### Otimiza FarmaVet (Meta):

- **Conversão do Popup:** 5-8%
- **Redução de Abandono:** 15-25%
- **ROI:** 800-1200% no primeiro trimestre

---

## 🎯 Estratégias Avançadas

### 1. Segmentação por Comportamento

Mostre ofertas diferentes baseadas em:
- Páginas visitadas
- Produtos visualizados
- Tempo no site
- Origem do tráfego

**Exemplo:**
```javascript
// Se visitou página de cães, oferecer desconto em rações para cães
if (document.referrer.includes('/collections/racoes-secas-caes')) {
  CONFIG.couponCode = 'CAES15';
  CONFIG.discountPercent = 15;
}
```

### 2. Urgência Temporal

Adicione contador regressivo:
```html
<p>Oferta válida por apenas <strong id="countdown">5:00</strong> minutos!</p>
```

### 3. Prova Social

Adicione estatísticas:
```html
<p>✅ Mais de 1.234 clientes usaram este cupom hoje!</p>
```

---

## ✅ Checklist de Implementação

- [ ] Arquivos JS e CSS adicionados ao tema
- [ ] Referências adicionadas ao `theme.liquid`
- [ ] Cupom criado no Shopify
- [ ] Configurações personalizadas (CONFIG)
- [ ] Teste em desktop (exit intent)
- [ ] Teste em mobile (back button)
- [ ] Teste de inatividade
- [ ] Google Analytics configurado
- [ ] Equipe treinada sobre o sistema

---

## 📞 Suporte

### Desativar Temporariamente

Para desativar sem remover o código:

```javascript
// No início do arquivo exit-intent-popup.js, adicione:
return; // ← Adicione esta linha logo após 'use strict';
```

### Ativar Apenas em Páginas Específicas

```javascript
// Ativar apenas na homepage
if (window.location.pathname !== '/') {
  return;
}

// OU ativar apenas em páginas de coleção
if (!window.location.pathname.includes('/collections/')) {
  return;
}
```

---

## 🎯 Próximos Passos

1. **Semana 1:** Implementar e monitorar
2. **Semana 2:** Ajustar timing baseado em dados
3. **Mês 1:** Testar variações de cupom
4. **Trimestre 1:** Implementar segmentação avançada

---

## 📚 Recursos Adicionais

### Inspiração de Textos:

**Títulos:**
- "Espera! Temos um presente para você 🎁"
- "Antes de ir... que tal 10% OFF?"
- "Não perca esta oferta exclusiva!"
- "Seu pet merece o melhor (com desconto!)"

**Subtítulos:**
- "Aproveite 10% de desconto na sua primeira compra"
- "Cupom exclusivo válido apenas hoje"
- "Oferta especial para novos clientes"
- "Economize agora e mime seu pet"

---

**Versão:** 1.0  
**Data:** 15/12/2024  
**Autor:** Otimização UX - Otimiza FarmaVet  
**Status:** ✅ Pronto para Implementação
