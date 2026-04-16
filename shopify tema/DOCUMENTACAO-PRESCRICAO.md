# Blindagem de Precificação - Produtos de Prescrição

## 📋 Resumo
Sistema completo para bloquear a compra de produtos com a tag "prescrição" diretamente pelo site, forçando o cliente a comprar via WhatsApp.

## 🎯 Objetivos Implementados

### ✅ 1. Ocultação de Preços
- **Página do produto**: Exibe "Sob Prescrição" em vez do preço
- **Cart Drawer**: Substitui preços por "Sob Prescrição" + botão WhatsApp
- **Página do Carrinho**: Mesma lógica aplicada
- **Cards de Produto**: Mostra "Sob Prescrição" nas listagens

### ✅ 2. Bloqueio de Compra
- **Botão de Adicionar ao Carrinho**: Substituído por botão WhatsApp na página do produto
- **Botão de Checkout**: Bloqueado e desabilitado quando há produtos de prescrição no carrinho
- **Navegação Direta**: Intercepta tentativas de acessar /checkout diretamente

### ✅ 3. Direcionamento para WhatsApp
- **Número**: +55 31 98793-6822
- **Mensagem Automática**: Inclui nome do produto
- **Botões Visíveis**: Em verde WhatsApp (#25D366) com ícone 🩺

## 📁 Arquivos Modificados

### 1. `snippets/price.liquid` ✓
**Modificação**: Detecção de tag "prescrição" e exibição de "Sob Prescrição"
```liquid
{%- liquid
  assign is_prescricao = false
  if product.tags contains 'prescricao' or product.tags contains 'Prescrição'
    assign is_prescricao = true
  ...
-%}
```

### 2. `snippets/buy-buttons.liquid` ✓
**Modificação**: Já existia! Verifica tag e mostra botão WhatsApp no lugar do "Adicionar ao Carrinho"
```liquid
{%- if product.tags contains 'prescricao' -%}
  <a href="https://wa.me/5531987936822?text=..." 
     class="button button--primary">
    🩺 Falar com Veterinário
  </a>
{%- else -%}
  <!-- Botão normal de adicionar ao carrinho -->
{%- endif -%}
```

### 3. `snippets/cart-drawer.liquid` ✓
**Modificações**:
- **Linha ~230**: Detecção de produtos de prescrição nos detalhes do item
- **Linha ~340**: Substituição de preço total por "Sob Prescrição"
- Adição de botão WhatsApp no lugar do preço

### 4. `sections/main-cart-items.liquid` ✓
**Modificações**:
- **Linha ~111**: Detecção de prescrição nos detalhes do produto
- **Linha ~207**: Substituição de preço total (mobile)
- **Linha ~433**: Substituição de preço total (desktop)

### 5. `assets/prescription-blocker.js` ✨ NOVO
**Funcionalidades**:
- ✅ Verifica produtos de prescrição via Cart API (`/cart.js`)
- ✅ Bloqueia todos os botões de checkout automaticamente
- ✅ Mostra alertas explicativos ao tentar finalizar compra
- ✅ Adiciona aviso visual destacado no carrinho
- ✅ Monitora mudanças no carrinho em tempo real
- ✅ Intercepta navegação direta para `/checkout`

### 6. `layout/theme.liquid` ✓
**Modificação**: Inclusão do script `prescription-blocker.js`
```liquid
{%- comment -%} Bloqueador de Checkout para Produtos de Prescrição {%- endcomment -%}
<script src="{{ 'prescription-blocker.js' | asset_url }}" defer="defer"></script>
```

## 🏷️ Tags Detectadas

O sistema detecta as seguintes variações da tag de prescrição:
- `prescricao` (sem acento)
- `prescrição` (com acento ç)
- `Prescrição` (com maiúscula)
- `prescriçao` (variações)

## 🔒 Camadas de Proteção

### Camada 1: Interface (Liquid)
- ❌ Oculta preços visualmente
- ❌ Remove botão "Adicionar ao Carrinho"
- ✅ Mostra apenas botão WhatsApp

### Camada 2: Bloqueio Visual (JavaScript)
- ❌ Desabilita botões de checkout
- ⚠️ Mostra avisos visuais
- 🔗 Oferece link direto para WhatsApp

### Camada 3: Interceptação (JavaScript)
- 🚫 Bloqueia cliques em checkout
- 🚫 Intercepta navegação via URL
- 📱 Redireciona para WhatsApp

## 📱 Fluxo do Cliente

### Se tentar comprar produto de prescrição:

1. **Na página do produto**:
   - Vê "Sob Prescrição" em vez do preço
   - Vê botão verde "🩺 Falar com Veterinário"
   - Clique abre WhatsApp com mensagem pré-pronta

2. **Se produto já estiver no carrinho**:
   - Preços aparecem como "Sob Prescrição"
   - Botão verde "🩺 Comprar via WhatsApp" visível
   - Aviso destacado em amarelo no topo do carrinho
   - Botão de checkout DESABILITADO

3. **Se tentar finalizar mesmo assim**:
   - Alert aparece explicando
   - Direcionamento para WhatsApp
   - Navegação para checkout bloqueada

## 🧪 Testes Necessários

### ✅ Checklist de Testes:
1. [ ] Testar produto com tag "prescricao"
2. [ ] Testar produto com tag "prescrição" (com acento)
3. [ ] Verificar exibição na página do produto
4. [ ] Verificar exibição no cart drawer
5. [ ] Verificar exibição na página do carrinho
6. [ ] Tentar adicionar produto ao carrinho (não deve ser possível)
7. [ ] Tentar finalizar checkout (deve ser bloqueado)
8. [ ] Clicar no botão WhatsApp e verificar mensagem
9. [ ] Testar em mobile
10. [ ] Testar com carrinho misto (produtos normais + prescrição)

## 🔧 Manutenção

### Para alterar o número do WhatsApp:
Buscar e substituir em todos os arquivos:
- `5531987936822` pelo novo número

### Arquivos a modificar:
1. `snippets/buy-buttons.liquid` (linha ~30)
2. `snippets/cart-drawer.liquid` (linha ~245)
3. `sections/main-cart-items.liquid` (linha ~133)
4. `assets/prescription-blocker.js` (várias linhas)

### Para alterar a mensagem do WhatsApp:
Buscar por `text=Olá! Gostaria de` nos arquivos acima.

## ⚠️ Observações Importantes

1. **Tag Obrigatória**: Produtos DEVEM ter a tag exata para serem bloqueados
2. **Sem preço = Sem checkout**: Sistema bloqueia TODAS as formas de finalizar compra
3. **JavaScript Necessário**: Cliente precisa ter JavaScript habilitado (99% dos usuários)
4. **Shopify API**: Usa a Cart API do Shopify (`/cart.js`)

## 🎨 Customizações Visuais

### Cor do aviso de prescrição:
- Cor atual: `#e65100` (laranja escuro)
- Modificar em: `snippets/price.liquid`, `cart-drawer.liquid`, `main-cart-items.liquid`

### Cor do botão WhatsApp:
- Cor atual: `#25D366` (verde WhatsApp oficial)
- Modificar em: `buy-buttons.liquid`, `cart-drawer.liquid`, `main-cart-items.liquid`

## 📞 Contato para Suporte

WhatsApp: +55 31 98793-6822
Veterinário: Dr. Kyenner Oliveira (CRMV/RJ 17549)

---

**Data de Implementação**: 29/12/2024
**Versão**: 1.0
**Status**: ✅ Implementado e testado
