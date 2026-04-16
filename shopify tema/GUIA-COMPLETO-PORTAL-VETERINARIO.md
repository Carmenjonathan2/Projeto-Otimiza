# 🏥 Portal Veterinário B2B - Guia Completo de Configuração e Gerenciamento

## 📋 Visão Geral do Sistema

O Portal Veterinário é uma área exclusiva B2B onde veterinários aprovados podem:
- ✅ Ver e comprar produtos com tag "prescrição" (COM PREÇO)
- ✅ Acessar produtos exclusivos para profissionais
- ✅ Ver ofertas especiais B2B
- ✅ Fazer checkout normalmente (sem bloqueios)

### Diferenças entre Público Geral vs Veterinários

| Funcionalidade | Público Geral | Veterinário Aprovado |
|----------------|---------------|----------------------|
| Produtos normais | ✅ Vê com preço | ✅ Vê com preço |
| Produtos "prescrição" | ❌ Sem preço + WhatsApp | ✅ Com preço + Compra |
| Portal Veterinário | ❌ Acesso negado | ✅ Acesso total |
| Checkout prescrição | ❌ Bloqueado | ✅ Liberado |
| Redirecionamento | - | ✅ Auto após login |

---

## 🚀 PARTE 1: Configuração Inicial (Uma Vez)

### 1.1 Criar a Página do Portal

1. **Admin Shopify** > **Loja Online** > **Páginas**
2. Clique em **"Adicionar página"**
3. Preencha:
   ```
   Título: Portal Veterinário
   Handle: portal-veterinario (automático)
   Conteúdo: (deixe em branco)
   Template: page (padrão)
   ```
4. **Salvar**

---

### 1.2 Adicionar Section ao Portal

1. **Admin** > **Temas** > **Customizar**
2. Navegue até: **Páginas** > **Portal Veterinário**
3. Clique em **"Adicionar seção"**
4. Selecione: **"Portal do Veterinário"**
5. Configure:
   - **Título da Vitrine**: `"Ofertas Exclusivas para Profissionais"`
   - **Coleção Principal**: (criar primeiro - veja 1.3)
   - **Coleção Cross-sell**: (criar primeiro - veja 1.3)

---

### 1.3 Criar Coleções Profissionais

#### Coleção 1: Produtos Uso Veterinário
1. **Admin** > **Produtos** > **Coleções** > **Criar coleção**
2. Preencha:
   ```
   Nome: Uso Veterinário Profissional
   Tipo: Automática
   Condição: Tag do produto é igual a "uso-profissional"
   ```
3. **Salvar**

#### Coleção 2: Produtos de Prescrição
1. **Criar coleção**
2. Preencha:
   ```
   Nome: Produtos Sob Prescrição
   Tipo: Automática
   Condição: Tag do produto é igual a "prescricao"
   ```
3. **Salvar**

#### Coleção 3: Recomendados (Cross-sell)
1. **Criar coleção**
2. Preencha:
   ```
   Nome: Recomendados para Veterinários
   Tipo: Manual
   ```
3. Adicione produtos complementares
4. **Salvar**

---

### 1.4 Configurar Produtos

#### Produtos de Uso Profissional:
- Adicionar tag: `uso-profissional`
- Exemplo: Vacinas, medicamentos controlados

#### Produtos de Prescrição:
- Adicionar tag: `prescricao` (ou `prescrição`)
- Exemplo: Antibióticos, medicamentos controlados

**Como adicionar tag:**
1. **Admin** > **Produtos** > Selecione o produto
2. Na seção **"Tags"**, digite: `prescricao`
3. Pressione **Enter**
4. **Salvar**

---

## 👥 PARTE 2: Gerenciamento de Veterinários

### 2.1 Fluxo de Cadastro do Veterinário

```
┌──────────────────────────────────────────────────┐
│ 1. Veterinário acessa o site                     │
│    ↓                                              │
│ 2. Tenta acessar /pages/portal-veterinario       │
│    ↓                                              │
│ 3. Vê tela: "Área Restrita"                      │
│    ↓                                              │
│ 4. Clica em "Solicitar Acesso via WhatsApp"      │
│    ↓                                              │
│ 5. Abre WhatsApp com mensagem pré-pronta         │
│    ↓                                              │
│ 6. Envia dados (Nome, CRMV, etc.)                │
│    ↓                                              │
│ 7. Equipe Otimiza verifica no CRM                │
│    ↓                                              │
│ 8. Se aprovado → Adiciona tag "veterinario"      │
│    ↓                                              │
│ 9. Veterinário recebe confirmação                │
│    ↓                                              │
│ 10. Faz login e é redirecionado para portal      │
└──────────────────────────────────────────────────┘
```

---

### 2.2 Como Aprovar um Veterinário

#### Passo a Passo:

1. **Verificar Solicitação**
   - Receba solicitação via WhatsApp
   - Verifique CRMV no site do conselho regional
   - Confirme dados do profissional

2. **Criar Conta (se não existe)**
   - **Admin** > **Clientes** > **Adicionar cliente**
   - Preencha:
     ```
     Nome: Dr. [Nome do Veterinário]
     Email: email@exemplo.com
     ```
   - Marque: ✅ "Enviar email de boas-vindas"
   - **Salvar**

3. **Adicionar Tag de Aprovação**
   - Abra o perfil do cliente
   - Na seção **"Tags"**, digite: `veterinario`
   - Pressione **Enter**
   - **Salvar**

4. **Notificar o Veterinário**
   - Envie mensagem via WhatsApp:
   ```
   Olá Dr. [Nome]! 🎉
   
   Seu cadastro foi aprovado no Portal Profissional da Otimiza FarmaVet!
   
   ✅ Você já pode fazer login em: [URL-DO-SITE]
   
   Após o login, será redirecionado automaticamente para o Portal Veterinário onde encontrará:
   - Produtos exclusivos para profissionais
   - Produtos sob prescrição com preços especiais
   - Ofertas B2B
   
   Qualquer dúvida, estamos à disposição!
   ```

---

### 2.3 Como Revogar Acesso

Se precisar remover o acesso de um veterinário:

1. **Admin** > **Clientes**
2. Localize e abra o cliente
3. Na seção **"Tags"**, clique no **X** ao lado de `veterinario`
4. **Salvar**

**Efeito imediato:**
- Cliente perde acesso ao portal
- Produtos "prescrição" voltam a aparecer sem preço
- Checkout de prescrição é bloqueado

---

### 2.4 Buscar Veterinários Aprovados

Para ver todos os veterinários aprovados:

1. **Admin** > **Clientes**
2. No campo de busca, digite: `tag:veterinario`
3. Pressione **Enter**

Você verá todos os clientes com a tag.

---

## 🔐 PARTE 3: Como o Sistema Funciona

### 3.1 Controle de Acesso Automático

#### Quando NÃO é veterinário:
```javascript
Cliente acessa produto "prescrição"
  ↓
Sistema verifica: Tem tag "veterinario"? ❌
  ↓
Exibe: "Sob Prescrição" + Botão WhatsApp
  ↓
Bloqueia checkout se adicionar ao carrinho
```

#### Quando É veterinário:
```javascript
Veterinário acessa produto "prescrição"
  ↓
Sistema verifica: Tem tag "veterinario"? ✅
  ↓
Exibe: PREÇO NORMAL + Botão "Adicionar ao Carrinho"
  ↓
Permite checkout normalmente
```

---

### 3.2 Redirecionamento Automático

Quando veterinário faz login:

```javascript
Login bem-sucedido
  ↓
Sistema detecta tag "veterinario"? ✅
  ↓
Redireciona para: /pages/portal-veterinario
  ↓
Exibe portal completo
```

**Exceções** (não redireciona):
- Se já está no portal
- Se está em `/cart`
- Se está em `/checkout`
- Se está fazendo logout

---

## 📊 PARTE 4: Gerenciamento Operacional

### 4.1 Relatório de Vendas B2B

Para ver vendas apenas de veterinários:

1. **Admin** > **Análises** > **Relatórios**
2. **Criar relatório personalizado**
3. Filtro: `Cliente contém tag: veterinario`
4. Salvar como: "Vendas B2B Veterinários"

---

### 4.2 Segmentação de Email Marketing

Para enviar campanhas apenas para veterinários:

1. **Admin** > **Clientes** > **Segmentos**
2. **Criar segmento**
3. Condição: `Tag do cliente é veterinario`
4. Nome: "Veterinários Aprovados"
5. Use este segmento em campanhas de email

---

### 4.3 Descontos Exclusivos B2B

Para criar descontos apenas para veterinários:

1. **Admin** > **Descontos** > **Criar desconto**
2. Tipo: **Código de desconto**
3. Em **"Segmentação de clientes"**:
   - Selecione: **Segmentos específicos de clientes**
   - Escolha: **Tag do cliente é veterinario**
4. Configure o desconto normalmente
5. **Salvar**

---

## 🧪 PARTE 5: Testes e Validação

### 5.1 Checklist de Testes

#### Teste 1: Cliente Comum
- [ ] Acessa produto com tag "prescrição"
- [ ] Vê "Sob Prescrição" em vez de preço
- [ ] Vê botão WhatsApp em vez de "Adicionar"
- [ ] Não consegue finalizar checkout (se adicionar)

#### Teste 2: Cliente Logado sem Tag
- [ ] Faz login
- [ ] Acessa `/pages/portal-veterinario`
- [ ] Vê mensagem "Aguardando aprovação"

#### Teste 3: Veterinário Aprovado
- [ ] Faz login
- [ ] É redirecionado automaticamente para portal
- [ ] Vê portal completo com produtos
- [ ] Acessa produto "prescrição"
- [ ] Vê PREÇO normal
- [ ] Consegue adicionar ao carrinho
- [ ] Consegue finalizar checkout

---

### 5.2 Criar Conta de Teste

Para testar o sistema:

1. **Criar cliente teste**:
   ```
   Nome: Dr. Teste Veterinário
   Email: teste.vet@exemplo.com (use um email real para testes)
   Tag: veterinario
   ```

2. **Fazer login** com essa conta

3. **Testar todas as funcionalidades**

---

## ⚙️ PARTE 6: Configurações Avançadas

### 6.1 Personalizar Mensagem WhatsApp

**Arquivo**: `snippets/snippet-acesso-restrito.liquid`

**Linha ~39**: Link do botão "Solicitar Acesso"
```liquid
<a href="https://wa.me/5531987936822?text=Olá! Sou veterinário e gostaria de solicitar acesso ao Portal Profissional da Otimiza FarmaVet. Meu CRMV é:" ...>
```

Edite o texto após `text=` para personalizar.

---

### 6.2 Mudar Número do WhatsApp

Buscar e substituir em todos os arquivos:
- Busque: `5531987936822`
- Substitua pelo novo número (com DDI + DDD)

**Arquivos afetados**:
- `snippets/snippet-acesso-restrito.liquid`
- `snippets/buy-buttons.liquid`
- `snippets/cart-drawer.liquid`
- `sections/main-cart-items.liquid`
- `assets/prescription-blocker.js`

---

### 6.3 Customizar Portal Veterinário

**Arquivo**: `sections/section-portal-veterinario.liquid`

**Boas-vindas** (Linha 18):
```liquid
<h1>Bem-vindo ao Portal Profissional, Dr. {{ customer.first_name }}</h1>
```

**Badge** (Linha 22):
```liquid
<span class="badge-icon">✓</span> Profissional Verificado
```

**Cores** (CSS no mesmo arquivo):
```css
color: #1a4d33;  /* Verde principal */
background: #e8f5e9;  /* Fundo verde claro */
```

---

## 📱 PARTE 7: Onde Aparece o Portal

### 7.1 Links de Acesso

1. **Header** → Ícone 🩺 ao lado do carrinho
2. **Menu principal** → Link "Portal Veterinário" (se adicionar)
3. **Área da conta** → Botão "Acessar Portal Profissional" (apenas com tag)
4. **URL direta** → `/pages/portal-veterinario`

---

### 7.2 Adicionar no Menu

Para adicionar link no menu de navegação:

1. **Admin** > **Loja Online** > **Navegação**
2. Selecione o menu (ex: "Menu principal")
3. **Adicionar item de menu**
4. Preencha:
   ```
   Nome: Portal Veterinário
   Link: Páginas > Portal Veterinário
   ```
5. **Salvar menu**

---

## 🆘 PARTE 8: Troubleshooting

### Problema 1: "Veterinário não vê preços de prescrição"

**Solução**:
1. Verifique se a tag é EXATAMENTE `veterinario` (minúsculo, sem acento)
2. Peça para o veterinário fazer **logout e login** novamente
3. Limpe o cache do navegador

---

### Problema 2: "Redirecionamento não funciona"

**Solução**:
1. Verifique se o script `vet-redirect.js` está incluído no tema
2. Abra o Console do navegador (F12) e veja se há erros
3. Confirme que o handle da página é `portal-veterinario`

---

### Problema 3: "Checkout ainda bloqueado para veterinário"

**Solução**:
1. Limpe o cache do navegador
2. Verifique se `prescription-blocker.js` foi atualizado
3. Teste em janela anônima

---

### Problema 4: "Portal não aparece na customização"

**Solução**:
1. Verifique se a section `section-portal-veterinario.liquid` existe
2. Recarregue a página de customização (Ctrl+F5)
3. Se necessário, republique o tema

---

## 📊 PARTE 9: Métricas e KPIs

### 9.1 Métricas Importantes

Acompanhe regularmente:

- **Veterinários aprovados**: Total de clientes com tag
- **Taxa de aprovação**: Solicitações vs Aprovações
- **Ticket médio B2B**: Vendas de veterinários / Nº pedidos
- **Produtos mais vendidos B2B**: Quais produtos veterinários preferem
- **Taxa de conversão**: Visitas ao portal vs Compras

---

### 9.2 Como Acompanhar

1. **Google Analytics**:
   - Evento: Acesso ao `/pages/portal-veterinario`
   - Conversão: Compra com tag veterinário

2. **Shopify Analytics**:
   - Filtro de clientes por tag
   - Relatório de vendas por segmento

---

## 📋 PARTE 10: Checklist de Manutenção Mensal

### Todo mês, verifique:

- [ ] Revisar solicitações pendentes via WhatsApp
- [ ] Confirmar CRMVs de novos veterinários
- [ ] Atualizar coleções de produtos exclusivos
- [ ] Revisar preços B2B
- [ ] Verificar se há veterinários inativos (sem compras há 6 meses)
- [ ] Enviar newsletter exclusiva para veterinários
- [ ] Analisar produtos mais vendidos no portal
- [ ] Verificar feedback/reclamações

---

## 📞 PARTE 11: Informações de Contato

### Suporte Técnico
- **WhatsApp**: +55 31 98793-6822
- **Email**: (adicione email de suporte)

### URLs Importantes
- **Portal**: `/pages/portal-veterinario`
- **Admin**: `https://[sua-loja].myshopify.com/admin`
- **Área da Conta**: `/account`

---

## 📄 PARTE 12: Arquivos do Sistema

### Arquivos Principais:

| Arquivo | Função |
|---------|--------|
| `sections/section-portal-veterinario.liquid` | Portal principal |
| `snippets/snippet-acesso-restrito.liquid` | Controle de acesso |
| `snippets/price.liquid` | Lógica de preços |
| `snippets/buy-buttons.liquid` | Botões de compra |
| `assets/prescription-blocker.js` | Bloqueio de checkout |
| `assets/vet-redirect.js` | Redirecionamento automático |
| `layout/theme.liquid` | Inclusão de scripts |

---

## 🎓 PARTE 13: Treinamento da Equipe

### Instruir equipe sobre:

1. **Como aprovar veterinários**
2. **Como verificar CRMV**
3. **Como lidar com solicitações**
4. **Como resolver problemas comuns**
5. **Como oferecer suporte**

### Documentos para equipe:
- Esta documentação completa
- Checklist de aprovação
- Script de atendimento WhatsApp
- FAQ para veterinários

---

## ✅ RESUMO EXECUTIVO

### O que foi implementado:

✅ **Portal Veterinário B2B** com acesso restrito  
✅ **Controle por tag** `veterinario`  
✅ **Produtos prescrição** com preço apenas para veterinários  
✅ **Bloqueio de checkout** para não-veterinários  
✅ **Redirecionamento automático** após login  
✅ **Botão WhatsApp** para solicitação de acesso  
✅ **Vitrine exclusiva** de produtos profissionais  
✅ **Upsell e Cross-sell** B2B  

---

**Última Atualização**: 29/12/2024  
**Versão**: 3.0  
**Status**: ✅ Implementado e Documentado  

---

## 🚀 Próximos Passos Sugeridos

1. [ ] Testar sistema com conta de teste
2. [ ] Criar coleções de produtos profissionais
3. [ ] Configurar descontos B2B
4. [ ] Treinar equipe
5. [ ] Preparar materiais de divulgação
6. [ ] Enviar convites para veterinários cadastrados
7. [ ] Monitorar primeiras semanas
8. [ ] Coletar feedback
9. [ ] Ajustar conforme necessário
10. [ ] Expandir catálogo B2B
