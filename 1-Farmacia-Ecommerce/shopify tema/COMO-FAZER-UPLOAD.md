# Arquivos Modificados - Blindagem de Prescrição

## 📝 Resumo das Alterações
Data: 29/12/2024
Objetivo: Bloquear compra de produtos com tag "prescrição" e forçar venda via WhatsApp

## 📁 Arquivos que DEVEM ser enviados para a Shopify

### 1. NOVOS ARQUIVOS (criar na Shopify)
- ✨ `assets/prescription-blocker.js` - Script de bloqueio de checkout
- 📄 `DOCUMENTACAO-PRESCRICAO.md` - Documentação (opcional, apenas para referência)

### 2. ARQUIVOS MODIFICADOS (substituir na Shopify)
- ✏️ `snippets/cart-drawer.liquid` - Carrinho drawer com bloqueio de preços
- ✏️ `sections/main-cart-items.liquid` - Página do carrinho com bloqueio de preços
- ✏️ `layout/theme.liquid` - Inclusão do script bloqueador

### 3. ARQUIVOS JÁ EXISTENTES (verificar se precisam atualização)
- ✅ `snippets/price.liquid` - Já tinha a lógica de "Sob Prescrição"
- ✅ `snippets/buy-buttons.liquid` - Já tinha o botão WhatsApp

---

## 🚀 OPÇÕES DE UPLOAD

### OPÇÃO 1: Upload Manual pela Interface Shopify (RECOMENDADO)

1. **Acesse o Admin da Shopify**:
   - Loja Online > Temas > ... > Editar código

2. **Criar arquivo novo**:
   - No painel esquerdo, clique em "Add a new asset"
   - Nome: `prescription-blocker.js`
   - Cole o conteúdo de: `assets/prescription-blocker.js`
   - Salvar

3. **Modificar arquivos existentes**:
   
   **a) `layout/theme.liquid`**:
   - Localize a linha: `<script src="{{ 'cart-drawer.js' | asset_url }}" defer="defer"></script>`
   - Adicione APÓS ela:
   ```liquid
   
   {%- comment -%} Bloqueador de Checkout para Produtos de Prescrição {%- endcomment -%}
   <script src="{{ 'prescription-blocker.js' | asset_url }}" defer="defer"></script>
   ```

   **b) `snippets/cart-drawer.liquid`**:
   - Substituir TODO o arquivo pelo novo (com as modificações de preço)

   **c) `sections/main-cart-items.liquid`**:
   - Substituir TODO o arquivo pelo novo (com as modificações de preço)

---

### OPÇÃO 2: Shopify CLI (quando instalação terminar)

```bash
# 1. Fazer login
shopify auth login

# 2. Listar temas
shopify theme list

# 3. Fazer push para o tema principal
shopify theme push --theme "tema principal da otimiza"

# OU push para tema específico por ID
shopify theme push --theme 123456789
```

---

### OPÇÃO 3: Criar ZIP e fazer upload completo

**Passos**:
1. Criar ZIP da pasta inteira do tema
2. Na Shopify: Loja Online > Temas > Adicionar tema > Upload do arquivo ZIP
3. Publicar o tema novo

⚠️ **ATENÇÃO**: Esta opção substitui o tema inteiro!

---

## 🧪 Após o Upload - TESTAR

1. [ ] Adicionar tag "prescrição" em um produto de teste
2. [ ] Verificar se o produto mostra "Sob Prescrição"
3. [ ] Verificar botão WhatsApp na página do produto
4. [ ] Tentar adicionar ao carrinho (não deve permitir)
5. [ ] Se já estiver no carrinho, verificar se checkout está bloqueado
6. [ ] Clicar no botão WhatsApp e verificar mensagem

---

## 📞 Suporte

Se precisar de ajuda:
- WhatsApp: +55 31 98793-6822
- Documentação completa em: `DOCUMENTACAO-PRESCRICAO.md`

---

## ⚠️ IMPORTANTE

- **Backup**: Sempre faça backup do tema antes de modificar
- **Tema Draft**: Teste em um tema draft antes de publicar
- **Tags**: Não esqueça de adicionar a tag "prescrição" nos produtos

---

**Status da Instalação do Shopify CLI**: EM ANDAMENTO
Aguarde a instalação terminar para usar os comandos automáticos.
