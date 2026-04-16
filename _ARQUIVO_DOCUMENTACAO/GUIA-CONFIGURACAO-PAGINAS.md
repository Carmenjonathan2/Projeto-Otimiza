# 🎨 GUIA DE CONFIGURAÇÃO - Páginas e Exibição no Site

**Data:** 18/12/2025  
**Objetivo:** Configurar e exibir corretamente todas as páginas no site

---

## 📋 ÍNDICE

1. [Configurar Página do Portal Veterinário](#1-portal-veterinário)
2. [Configurar Página de Cadastro](#2-cadastro-veterinário)
3. [Adicionar Links no Menu](#3-menu-de-navegação)
4. [Configurar Coleções](#4-coleções-de-produtos)
5. [Testar Tudo](#5-testes-finais)

---

## 1️⃣ PORTAL VETERINÁRIO

### **PASSO 1: Criar/Editar a Página**

1. **Admin Shopify → Loja Online → Páginas**
2. Procure por "Portal do Veterinário" ou clique em **"Adicionar página"**

#### **Se criar nova:**
- **Título:** Portal do Veterinário
- **Conteúdo:** (deixe vazio ou adicione texto introdutório opcional)
- **Visibilidade:** Visível
- **Handle:** `portal-veterinario` (importante!)

3. **Salve** (botão no canto superior direito)

---

### **PASSO 2: Personalizar a Página**

1. Na página que você acabou de criar, clique em **"Personalizar"** (botão no topo)
2. Você será levado ao **Editor de Tema**

#### **Adicionar a Section do Portal:**

1. No editor, clique em **"Add section"** (+ Adicionar seção)
2. Procure por: **"Portal do Veterinário"** ou **"Portal Veterinário"**
3. Clique para adicionar

#### **Configurar a Section:**

No painel direito, você verá as configurações:

**a) Título da Vitrine:**
- Campo: "Título da Vitrine"
- Sugestão: `"Ofertas Exclusivas Dr."`

**b) Coleção Profissional Principal:**
- Campo: "Coleção Profissional Principal"
- Selecione a coleção de produtos exclusivos para veterinários
- **Se não tiver:** Crie uma coleção primeiro (veja seção 4)

**c) Coleção de Cross-sell:**
- Campo: "Coleção de Cross-sell"
- Selecione produtos complementares
- **Sugestão:** Produtos relacionados, acessórios, etc.

4. **Salve** (botão no canto superior direito)

---

### **PASSO 3: Configurar SEO da Página**

1. Volte para **Páginas** (Admin → Loja Online → Páginas)
2. Edite a página "Portal do Veterinário"
3. Role até o final e clique em **"Editar SEO do site"**

**Configure:**
- **Título da página:** Portal Exclusivo para Médicos Veterinários | Otimiza FarmaVet
- **Descrição:** Acesso exclusivo para profissionais veterinários. Produtos de uso restrito, preços especiais e condições diferenciadas.
- **URL e handle:** `portal-veterinario`

4. **Salve**

---

## 2️⃣ CADASTRO VETERINÁRIO

### **PASSO 1: Criar a Página**

1. **Admin → Loja Online → Páginas**
2. Clique em **"Adicionar página"**

**Configure:**
- **Título:** Cadastro Veterinário
- **Conteúdo:** (deixe vazio)
- **Handle:** `cadastro-veterinario` (importante!)

3. **Salve**

---

### **PASSO 2: Adicionar o Formulário**

1. Clique em **"Personalizar"**
2. No editor, clique em **"Add section"**
3. Procure por: **"Custom Liquid"** ou **"Liquid personalizado"**
4. Adicione a section

5. No campo de código que aparecer, cole:

```liquid
{% render 'snippet-registro-veterinario-CORRIGIDO' %}
```

6. **Salve**

---

### **PASSO 3: Configurar SEO**

1. Volte para **Páginas**
2. Edite "Cadastro Veterinário"
3. **Editar SEO:**

- **Título:** Cadastro Profissional Veterinário | Otimiza FarmaVet
- **Descrição:** Cadastre-se como profissional veterinário e tenha acesso a produtos exclusivos, preços especiais e condições diferenciadas.
- **URL:** `cadastro-veterinario`

4. **Salve**

---

## 3️⃣ MENU DE NAVEGAÇÃO

### **OPÇÃO A: Menu Principal (Público)**

**Não recomendado** - O portal é restrito, não deve estar no menu principal.

---

### **OPÇÃO B: Menu Footer (Recomendado)**

1. **Admin → Loja Online → Navegação**
2. Clique no menu **"Footer"** ou **"Rodapé"**
3. Clique em **"Adicionar item de menu"**

**Configure:**
- **Nome:** Área do Veterinário
- **Link:** Páginas → Portal do Veterinário

4. Clique em **"Adicionar"**
5. **Salve o menu**

---

### **OPÇÃO C: Menu Específico para Veterinários**

1. **Admin → Navegação**
2. Clique em **"Adicionar menu"**
3. **Nome do menu:** Menu Veterinário
4. **Handle:** `menu-veterinario`

**Adicione itens:**
- Portal do Veterinário
- Minha Conta
- Pedidos
- Sair

5. **Salve**

**Para exibir apenas para veterinários:**
No `theme.liquid` ou em uma section, adicione:

```liquid
{%- if customer.tags contains 'veterinario' -%}
  {% section 'header-menu-vet' %}
{%- endif -%}
```

---

### **OPÇÃO D: Link Direto (Mais Simples)**

Adicione um link direto em locais estratégicos:

**No Footer:**
```liquid
<a href="/pages/portal-veterinario">Área do Veterinário</a>
```

**Na Página de Login:**
```liquid
<p>É veterinário? <a href="/pages/cadastro-veterinario">Cadastre-se aqui</a></p>
```

---

## 4️⃣ COLEÇÕES DE PRODUTOS

### **PASSO 1: Criar Coleção de Produtos Exclusivos**

1. **Admin → Produtos → Coleções**
2. Clique em **"Criar coleção"**

**Configure:**
- **Título:** Produtos Exclusivos Veterinários
- **Descrição:** Produtos de uso restrito profissional
- **Tipo de coleção:** Manual ou Automatizada

**Se Automatizada:**
- **Condições:** Tag do produto contém `exclusivo-vet`

3. **Adicione produtos** manualmente ou configure as condições
4. **Salve**

---

### **PASSO 2: Criar Coleção de Cross-sell**

1. Crie outra coleção: **"Recomendados para Veterinários"**
2. Adicione produtos complementares
3. **Salve**

---

### **PASSO 3: Vincular Coleções ao Portal**

1. Vá em **Páginas → Portal do Veterinário**
2. Clique em **"Personalizar"**
3. Selecione a section "Portal do Veterinário"
4. No painel direito:
   - **Coleção Principal:** Selecione "Produtos Exclusivos Veterinários"
   - **Coleção Cross-sell:** Selecione "Recomendados para Veterinários"
5. **Salve**

---

## 5️⃣ TESTES FINAIS

### **Teste 1: Acesso ao Portal**

**Sem Login:**
1. Abra janela anônima
2. Acesse: `seusite.com/pages/portal-veterinario`
3. **Resultado esperado:** Tela de bloqueio com botões "Fazer Login" e "Solicitar Acesso"

**Com Login (Cliente Comum):**
1. Faça login com conta sem tag `veterinario`
2. Acesse o portal
3. **Resultado esperado:** Mensagem "Aguardando aprovação"

**Com Login (Veterinário Aprovado):**
1. Faça login com conta que tem tag `veterinario`
2. Acesse o portal
3. **Resultado esperado:** Portal completo visível com produtos

---

### **Teste 2: Formulário de Cadastro**

1. Acesse: `seusite.com/pages/cadastro-veterinario`
2. Preencha todos os campos:
   - Nome e Sobrenome
   - Email profissional
   - CRMV (ex: 12345/MG)
   - WhatsApp
   - Senha
3. Clique em "Solicitar Acesso"
4. **Resultado esperado:** Conta criada com tag `vet-pendente`

**Verificar:**
1. Admin → Clientes
2. Encontre o cliente recém-criado
3. Verifique se tem a tag `vet-pendente`
4. Verifique se o CRMV está nas notas

---

### **Teste 3: Produtos no Portal**

1. Acesse o portal como veterinário aprovado
2. **Verifique:**
   - [ ] Produtos da coleção principal aparecem
   - [ ] Preços estão corretos
   - [ ] Botão "Adicionar em 1-clique" funciona
   - [ ] Seção de Upsell aparece
   - [ ] Produtos de Cross-sell aparecem

---

### **Teste 4: Links e Navegação**

1. **Verifique:**
   - [ ] Link no footer funciona (se adicionou)
   - [ ] Link na página de login funciona (se adicionou)
   - [ ] Botão "Solicitar Acesso" leva para cadastro
   - [ ] Botão "Retornar à loja" funciona

---

## 🎯 CONFIGURAÇÕES ADICIONAIS

### **Configurar Preços Especiais (Opcional)**

Se quiser preços diferentes para veterinários:

1. **Admin → Descontos**
2. Crie um código de desconto
3. **Condições:** Cliente tem tag `veterinario`
4. Configure o desconto (%, valor fixo, etc.)

**OU**

Use apps de preços por cliente:
- Wholesale Pricing Discount
- Bold Customer Pricing
- Locksmith

---

### **Configurar Email de Boas-Vindas**

1. **Admin → Configurações → Notificações**
2. Encontre: "Boas-vindas ao cliente"
3. Edite o template
4. Adicione uma seção para veterinários:

```liquid
{% if customer.tags contains 'vet-pendente' %}
  <p>Obrigado por se cadastrar como veterinário!</p>
  <p>Sua solicitação está em análise. Verificaremos seu CRMV em até 24 horas.</p>
{% endif %}
```

---

### **Configurar Produtos Exclusivos**

Para produtos que só veterinários podem ver:

1. Edite o produto
2. Adicione a tag: `exclusivo-vet`
3. No template do produto, adicione:

```liquid
{% unless customer.tags contains 'veterinario' %}
  <p>Este produto é de uso restrito profissional.</p>
  <a href="/pages/cadastro-veterinario">Cadastre-se como veterinário</a>
  <style>.product-form { display: none; }</style>
{% endunless %}
```

---

## 📊 CHECKLIST FINAL

### **Páginas**
- [ ] Portal do Veterinário criada
- [ ] Cadastro Veterinário criada
- [ ] SEO configurado em ambas
- [ ] Handles corretos (`portal-veterinario`, `cadastro-veterinario`)

### **Sections**
- [ ] Section "Portal do Veterinário" adicionada
- [ ] Coleções vinculadas à section
- [ ] Formulário de cadastro adicionado

### **Navegação**
- [ ] Links adicionados (footer, login, etc.)
- [ ] Links funcionando corretamente

### **Coleções**
- [ ] Coleção de produtos exclusivos criada
- [ ] Coleção de cross-sell criada
- [ ] Produtos adicionados às coleções

### **Testes**
- [ ] Portal bloqueia não-veterinários
- [ ] Portal libera veterinários
- [ ] Formulário cria conta com tag correta
- [ ] Produtos aparecem no portal
- [ ] Links funcionam

---

## 🎨 DICAS DE PERSONALIZAÇÃO

### **Cores do Portal**

No `section-portal-veterinario.liquid`, você pode mudar as cores:

```css
/* Verde institucional */
#1a4d33 → Sua cor primária
#2e7d32 → Sua cor secundária

/* Badges e destaques */
#e74c3c → Cor de desconto
#667eea → Cor de destaque
```

### **Textos**

Personalize os textos no snippet:
- Mensagem de boas-vindas
- Texto do bloqueio
- Labels dos formulários

---

## 🆘 TROUBLESHOOTING

### **Portal não aparece**
- Verifique se a section foi adicionada à página
- Verifique se salvou a página
- Limpe o cache

### **Produtos não aparecem**
- Verifique se a coleção tem produtos
- Verifique se a coleção está vinculada
- Verifique se os produtos estão publicados

### **Bloqueio não funciona**
- Verifique se o snippet está sendo renderizado
- Verifique a tag do cliente (deve ser `veterinario`)
- Teste em janela anônima

---

**Desenvolvido por Antigravity (Google Deepmind)**  
*Data: 18/12/2025*

**Tudo configurado! Seu portal está pronto para uso! 🎉**
