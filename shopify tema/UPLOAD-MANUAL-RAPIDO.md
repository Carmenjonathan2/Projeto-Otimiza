# 🚀 UPLOAD RÁPIDO - Método Manual

## ✅ Passo a Passo SIMPLIFICADO

### 1️⃣ Acessar o Editor de Código da Shopify
1. Login no Admin da Shopify
2. **Loja Online** > **Temas**
3. No tema "**tema principal da otimiza**" clique em **"..."** > **Editar código**

---

### 2️⃣ Criar NOVO arquivo JavaScript

**No painel esquerdo:**
1. Clique em **"Add a new asset"**
2. Selecione: **"Create a blank file"**
3. Nome do arquivo: `prescription-blocker`
4. Extensão: `.js`
5. Clique em **"Add asset"**

**Cole este código:**
```
Está no arquivo: assets/prescription-blocker.js
```
6. Clique em **"Save"** (Ctrl+S)

---

### 3️⃣ Modificar theme.liquid

**No painel esquerdo:**
1. Abra: `layout/theme.liquid`
2. Use Ctrl+F para buscar: `cart-drawer.js`
3. Você vai encontrar esta linha:
   ```liquid
   <script src="{{ 'cart-drawer.js' | asset_url }}" defer="defer"></script>
   ```
4. **ADICIONE estas 3 linhas LOGO APÓS:**
   ```liquid
   
   {%- comment -%} Bloqueador de Checkout para Produtos de Prescrição {%- endcomment -%}
   <script src="{{ 'prescription-blocker.js' | asset_url }}" defer="defer"></script>
   ```
5. Clique em **"Save"**

---

### 4️⃣ Substituir cart-drawer.liquid

**No painel esquerdo:**
1. Abra: `snippets/cart-drawer.liquid`
2. **SELECIONE TODO O CONTEÚDO** (Ctrl+A)
3. **DELETE** (Delete)
4. **COLE** o conteúdo do novo arquivo
   ```
   Está em: snippets/cart-drawer.liquid (modificado)
   ```
5. Clique em **"Save"**

---

### 5️⃣ Substituir main-cart-items.liquid

**No painel esquerdo:**
1. Abra: `sections/main-cart-items.liquid`
2. **SELECIONE TODO O CONTEÚDO** (Ctrl+A)
3. **DELETE** (Delete)
4. **COLE** o conteúdo do novo arquivo
   ```
   Está em: sections/main-cart-items.liquid (modificado)
   ```
5. Clique em **"Save"**

---

## ✅ PRONTO! Agora teste:

1. Adicione a tag **"prescrição"** em um produto
2. Visualize o produto no site
3. Verifique se aparece "Sob Prescrição" e o botão WhatsApp
4. Tente adicionar ao carrinho (não deve permitir)

---

## 📋 CHECKLIST Final

- [ ] `prescription-blocker.js` criado em assets
- [ ] `theme.liquid` modificado (3 linhas adicionadas)
- [ ] `cart-drawer.liquid` substituído completamente
- [ ] `main-cart-items.liquid` substituído completamente
- [ ] Tag "prescrição" adicionada em produto teste
- [ ] Testado no site

---

## 🆘 Se algo der errado:

**REVERTER:**
1. Na Shopify: **Temas** > **"..."** > **Versões anteriores**
2. Escolha a versão de backup
3. Clique em **"Restaurar"**
