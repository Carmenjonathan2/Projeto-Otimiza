# 🚀 GUIA DE IMPLEMENTAÇÃO COMPLETO - Front-End Shopify

**Data:** 18/12/2025  
**Objetivo:** Implementar todos os componentes no site Shopify

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1: PORTAL VETERINÁRIO** 🏥

#### **1.1 - Criar Snippets**
- [ ] `snippet-acesso-restrito-FINAL.liquid`
- [ ] `snippet-registro-veterinario-CORRIGIDO.liquid`

#### **1.2 - Criar/Atualizar Section**
- [ ] `section-portal-veterinario.liquid`

#### **1.3 - Criar Páginas**
- [ ] Página: "Portal do Veterinário"
- [ ] Página: "Cadastro Veterinário"

---

### **FASE 2: EXIT INTENT POPUP** 🎯

#### **2.1 - Upload de Arquivos CSS**
- [ ] `exit-intent-popup.css` OU
- [ ] `exit-intent-popup-PREMIUM.css`

#### **2.2 - Upload de Arquivo JavaScript**
- [ ] `exit-intent-popup-SIMPLIFICADO.js`

#### **2.3 - Integrar no Theme**
- [ ] Adicionar CSS no `theme.liquid`
- [ ] Adicionar JS no `theme.liquid`
- [ ] Adicionar HTML do popup

---

### **FASE 3: CARRINHO VAZIO** 🛒

#### **3.1 - Atualizar Cart Drawer**
- [ ] `cart-drawer-CORRIGIDO.liquid`
- [ ] `cart-drawer-empty-state.css`

---

## 🎯 FASE 1: PORTAL VETERINÁRIO

### **PASSO 1: Criar Snippet de Acesso Restrito**

1. **Admin Shopify → Temas → Editar código**
2. Clique em **"Add a new snippet"**
3. Nome: `snippet-acesso-restrito-FINAL`
4. Cole o código do arquivo: `snippet-acesso-restrito-FINAL.liquid`
5. **Salve**

---

### **PASSO 2: Criar Snippet de Registro**

1. Clique em **"Add a new snippet"**
2. Nome: `snippet-registro-veterinario-CORRIGIDO`
3. Cole o código do arquivo: `snippet-registro-veterinario-CORRIGIDO.liquid`
4. **Salve**

---

### **PASSO 3: Criar Section do Portal**

1. Clique em **"Add a new section"**
2. Nome: `portal-veterinario`
3. Cole o código do arquivo: `section-portal-veterinario.liquid`
4. **Salve**

---

### **PASSO 4: Criar Página do Portal**

1. **Admin → Loja Online → Páginas**
2. Clique em **"Adicionar página"**
3. **Título:** Portal do Veterinário
4. **Conteúdo:** (deixe vazio ou adicione texto introdutório)
5. No lado direito, em **"Template"**, selecione: `page` (padrão)
6. **Salve**

7. Agora clique em **"Personalizar"** (botão no topo)
8. No editor visual:
   - Clique em **"Add section"**
   - Procure por: **"Portal do Veterinário"**
   - Adicione a section
9. Configure:
   - **Coleção Profissional Principal:** Selecione a coleção de produtos exclusivos
   - **Coleção de Cross-sell:** Selecione produtos complementares
10. **Salve**

---

### **PASSO 5: Criar Página de Cadastro**

1. **Admin → Loja Online → Páginas**
2. Clique em **"Adicionar página"**
3. **Título:** Cadastro Veterinário
4. **Conteúdo:** (deixe vazio)
5. **Salve**

6. Clique em **"Personalizar"**
7. No editor visual:
   - Clique em **"Add section"**
   - Adicione: **"Custom Liquid"** ou **"Liquid personalizado"**
   - Cole este código:
   ```liquid
   {% render 'snippet-registro-veterinario-CORRIGIDO' %}
   ```
8. **Salve**

---

### **PASSO 6: Configurar Handle da Página de Cadastro**

1. Volte para **Páginas**
2. Edite a página "Cadastro Veterinário"
3. No campo **"Handle"** (URL), certifique-se que está: `cadastro-veterinario`
4. Se não estiver, edite para: `cadastro-veterinario`
5. **Salve**

---

## 🎯 FASE 2: EXIT INTENT POPUP

### **PASSO 1: Upload do CSS**

1. **Admin → Temas → Editar código**
2. Vá em **Assets** (pasta de arquivos)
3. Clique em **"Add a new asset"**
4. Selecione: **"Create a blank file"**
5. Nome: `exit-intent-popup.css` (ou `exit-intent-popup-PREMIUM.css`)
6. Cole o conteúdo do arquivo CSS correspondente
7. **Salve**

---

### **PASSO 2: Upload do JavaScript**

1. Em **Assets**, clique em **"Add a new asset"**
2. Selecione: **"Create a blank file"**
3. Nome: `exit-intent-popup.js`
4. Cole o conteúdo do arquivo: `exit-intent-popup-SIMPLIFICADO.js`
5. **Salve**

---

### **PASSO 3: Integrar no Theme**

1. Abra o arquivo: **`layout/theme.liquid`**

2. **No `<head>`**, antes de `</head>`, adicione:
```liquid
<!-- Exit Intent Popup CSS -->
{{ 'exit-intent-popup.css' | asset_url | stylesheet_tag }}
```

3. **Antes de `</body>`**, adicione:
```liquid
<!-- Exit Intent Popup -->
{% render 'exit-intent-popup' %}

<!-- Exit Intent Popup JavaScript -->
<script src="{{ 'exit-intent-popup.js' | asset_url }}" defer></script>
```

4. **Salve**

---

### **PASSO 4: Criar Snippet do HTML do Popup**

1. Clique em **"Add a new snippet"**
2. Nome: `exit-intent-popup`
3. Cole este código:

```liquid
{% comment %}
  Exit Intent Popup HTML
{% endcomment %}

<div class="exit-popup-overlay" id="exitPopup">
  <div class="exit-popup-container">
    <button class="exit-popup-close" aria-label="Fechar popup">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <div class="exit-popup-content">
      <div class="exit-popup-icon">🎁</div>
      
      <h2 class="exit-popup-title">Espere! Não vá embora ainda!</h2>
      
      <p class="exit-popup-subtitle">
        Ganhe <strong>10% OFF</strong> na sua primeira compra!
      </p>

      <div class="exit-popup-coupon">
        <p class="coupon-label">Use o cupom:</p>
        <div class="coupon-code">BEMVINDO10</div>
        <button class="coupon-copy-btn" data-coupon="BEMVINDO10">
          📋 Copiar Cupom
        </button>
      </div>

      <div class="exit-popup-divider">
        <span>ou escolha uma opção</span>
      </div>

      <div class="exit-popup-ctas">
        <a href="/collections/all" class="exit-cta exit-cta-primary">
          <span class="exit-cta-icon">🛍️</span>
          <span class="exit-cta-text">Continuar Comprando</span>
        </a>

        <div class="exit-cta-grid">
          <a href="/pages/contato" class="exit-cta exit-cta-secondary">
            <span class="exit-cta-icon">💬</span>
            <span class="exit-cta-text">Falar com Especialista</span>
          </a>
          
          <a href="/pages/sobre-nos" class="exit-cta exit-cta-secondary">
            <span class="exit-cta-icon">ℹ️</span>
            <span class="exit-cta-text">Sobre Nós</span>
          </a>
        </div>
      </div>

      <p class="exit-popup-footer">
        Válido apenas para primeira compra. Não acumulativo.
      </p>
    </div>
  </div>
</div>
```

4. **Salve**

---

## 🎯 FASE 3: CARRINHO VAZIO (OPCIONAL)

### **PASSO 1: Atualizar Cart Drawer**

1. Localize o arquivo: **`sections/cart-drawer.liquid`** ou **`snippets/cart-drawer.liquid`**
2. **Faça backup** (copie o conteúdo para um arquivo de texto)
3. Substitua pelo conteúdo de: `cart-drawer-CORRIGIDO.liquid`
4. **Salve**

---

### **PASSO 2: Adicionar CSS do Empty State**

1. Em **Assets**, clique em **"Add a new asset"**
2. Nome: `cart-drawer-empty-state.css`
3. Cole o conteúdo do arquivo: `cart-drawer-empty-state.css`
4. **Salve**

5. Abra: **`layout/theme.liquid`**
6. No `<head>`, adicione:
```liquid
{{ 'cart-drawer-empty-state.css' | asset_url | stylesheet_tag }}
```
7. **Salve**

---

## 🧪 TESTES FINAIS

### **Teste 1: Portal Veterinário**
- [ ] Acesse a página do portal sem login → Deve bloquear
- [ ] Faça login com conta comum → Deve bloquear
- [ ] Faça login com tag `veterinario` → Deve liberar
- [ ] Teste o formulário de cadastro → Deve criar conta com tag `vet-pendente`

### **Teste 2: Exit Intent Popup**
- [ ] Acesse qualquer página
- [ ] Mova o mouse para fora da janela (topo)
- [ ] Popup deve aparecer
- [ ] Clique em "Copiar Cupom" → Deve copiar
- [ ] Feche e teste novamente → Não deve aparecer (cookie)

### **Teste 3: Carrinho Vazio**
- [ ] Abra o carrinho vazio
- [ ] Deve mostrar estado vazio bonito
- [ ] Clique em "Continuar Comprando" → Deve funcionar

---

## 📊 RESUMO DE ARQUIVOS

### **Snippets (5)**
1. `snippet-acesso-restrito-FINAL.liquid`
2. `snippet-registro-veterinario-CORRIGIDO.liquid`
3. `exit-intent-popup.liquid`

### **Sections (2)**
4. `section-portal-veterinario.liquid`
5. `cart-drawer.liquid` (atualizado)

### **Assets (4)**
6. `exit-intent-popup.css`
7. `exit-intent-popup.js`
8. `cart-drawer-empty-state.css`

### **Páginas (2)**
9. Portal do Veterinário
10. Cadastro Veterinário

### **Theme.liquid (1)**
11. Atualizado com links para CSS/JS

---

## ⏱️ TEMPO ESTIMADO

- **Portal Veterinário:** 15-20 minutos
- **Exit Intent Popup:** 10-15 minutos
- **Carrinho Vazio:** 5-10 minutos
- **Testes:** 10 minutos

**Total:** ~45-60 minutos

---

## 🆘 TROUBLESHOOTING

### **Popup não aparece**
- Verifique se o CSS e JS foram carregados
- Abra o console (F12) e procure erros
- Limpe o cache do navegador

### **Portal não bloqueia**
- Verifique se o snippet está sendo renderizado
- Verifique a tag do cliente (deve ser exatamente `veterinario`)
- Teste em janela anônima

### **Carrinho não atualiza**
- Limpe cache
- Verifique se o CSS foi carregado
- Teste em outro navegador

---

## ✅ CHECKLIST FINAL

- [ ] Todos os snippets criados
- [ ] Todas as sections criadas
- [ ] Todos os assets (CSS/JS) carregados
- [ ] Theme.liquid atualizado
- [ ] Páginas criadas e configuradas
- [ ] Testes realizados
- [ ] Tudo funcionando!

---

**Desenvolvido por Antigravity (Google Deepmind)**  
*Data: 18/12/2025*

**Pronto para implementar! Siga o guia passo a passo! 🚀**
