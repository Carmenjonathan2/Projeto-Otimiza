# 🏥 Configuração da Página do Veterinário - Passo a Passo

## 📋 Visão Geral

O portal veterinário é uma **área exclusiva** para médicos veterinários cadastrados e aprovados, com:
- ✅ **Controle de Acesso** por tag "veterinario"
- 🛍️ **Vitrine de Produtos Exclusivos**
- 💰 **Ofertas Profissionais**
- 📦 **Upsell e Cross-sell**
- 🎯 **Quick Add (adicionar em 1 clique)**

---

## 🚀 PASSO 1: Criar as Páginas no Admin

### 1.1 Criar a Página "Portal Veterinário"

1. **Admin Shopify** > **Loja Online** > **Páginas**
2. Clique em **"Adicionar página"**
3. Preencha:
   - **Título**: `Portal Veterinário` ou `Área do Veterinário`
   - **Conteúdo**: Deixe em branco (o conteúdo vem da section)
   - **Visibilidade**: Visível
   - **Handle da URL**: Certifique-se que seja `portal-veterinario`

4. **Template da página**:
   - Role até o final da página
   - Em **"Template da página"**, selecione: **`page`** (padrão)

5. Clique em **"Salvar"**

---

### 1.2 Criar a Página "Cadastro Veterinário" (Opcional)

1. **Admin Shopify** > **Loja Online** > **Páginas**
2. Clique em **"Adicionar página"**
3. Preencha:
   - **Título**: `Cadastro Veterinário`
   - **Conteúdo**: Formulário de cadastro ou instruções
   - **Handle da URL**: `cadastro-veterinario`

4. Clique em **"Salvar"**

---

## 🎨 PASSO 2: Customizar a Página do Portal

### 2.1 Adicionar a Section do Portal

1. **Admin Shopify** > **Loja Online** > **Temas**
2. No tema ativo, clique em **"Customizar"**
3. No menu de navegação superior, selecione: **Páginas** > **Portal Veterinário**
4. Clique em **"Adicionar seção"**
5. Na lista de seções, procure por: **"Portal do Veterinário"**
6. Clique para adicionar

---

### 2.2 Configurar as Coleções

Dentro da section "Portal do Veterinário", você verá 3 configurações:

#### **A) Título da Vitrine**
- Campo de texto
- Exemplo: `"Ofertas Exclusivas Dr."` ou `"Produtos Profissionais"`

#### **B) Coleção Profissional Principal**
- Selecione a coleção com produtos exclusivos para veterinários
- Os primeiros 4 produtos aparecerão na vitrine principal
- ⚠️ **IMPORTANTE**: Crie uma coleção específica para isso

#### **C) Coleção de Cross-sell**
- Selecione uma coleção com produtos complementares
- Os primeiros 3 produtos aparecerão na seção "Recomendados"

---

### 2.3 Criar as Coleções Necessárias

**ANTES de configurar, crie estas coleções:**

1. **Admin** > **Produtos** > **Coleções**

2. **Criar Coleção 1: "Uso Veterinário Profissional"**
   - Tipo: Manual ou Automática
   - Se automática, condição: Tag igual a `"uso-profissional"`

3. **Criar Coleção 2: "Recomendados Veterinários"**
   - Adicione produtos complementares

---

## 👨‍⚕️ PASSO 3: Controle de Acesso com Tags

### 3.1 Como Funciona

O sistema verifica se o cliente tem a tag **`veterinario`**:
- ✅ **COM a tag**: Acesso total ao portal
- ❌ **SEM a tag**: Tela de acesso restrito

---

### 3.2 Aprovar um Veterinário (Adicionar Tag)

1. **Admin** > **Clientes**
2. Localize o cliente veterinário
3. Clique no nome para abrir o perfil
4. Na seção **"Tags"**, digite: `veterinario` (tudo minúsculo, sem acento)
5. Pressione **Enter** e clique em **"Salvar"**

---

### 3.3 Remover Acesso

Para remover o acesso:
1. Abra o perfil do cliente
2. Clique no **X** ao lado da tag `veterinario`
3. Salvar

---

## 🔐 PASSO 4: Tela de Acesso Restrito

### 4.1 O que acontece sem a tag?

Quando alguém **sem** a tag tenta acessar `/pages/portal-veterinario`:

**Se NÃO estiver logado:**
```
┌────────────────────────────────┐
│    🔒                          │
│  Área Restrita: Médicos        │
│  Veterinários                  │
│                                │
│  Esta página é dedicada        │
│  exclusivamente a...           │
│                                │
│  [ Fazer Login ]               │
│  [ Solicitar Acesso ]          │
│                                │
│  ← Retornar à loja pública     │
└────────────────────────────────┘
```

**Se estiver logado mas NÃO aprovado:**
```
┌────────────────────────────────┐
│  ⚠️ Aguardando aprovação       │
│                                │
│  Seu registro profissional     │
│  está em análise. Nossa equipe │
│  verificará seu CRMV em breve. │
│                                │
│  ← Retornar à loja pública     │
└────────────────────────────────┘
```

---

## 🎯 PASSO 5: Adicionar Link no Menu/Header

### 5.1 No Menu de Navegação

1. **Admin** > **Loja Online** > **Navegação**
2. Escolha o menu (ex: "Menu principal")
3. Clique em **"Adicionar item de menu"**
4. Preencha:
   - **Nome**: `Portal Veterinário` ou `Área Profissional`
   - **Link**: Páginas > Portal Veterinário
5. Salvar

---

### 5.2 Já existe no Header! 🎉

O tema **JÁ TEM** um ícone no header que leva para `/pages/portal-veterinario`:
- Aparece ao lado do carrinho e login
- Ícone: 🩺 (visual de área médica)
- Tooltip: "Área do Veterinário"

---

## 📱 PASSO 6: Área na Conta do Cliente

### 6.1 Botão Automático

Quando um cliente **COM** a tag `veterinario` faz login:
- Aparece um botão **"Acessar Portal Profissional"** na área da conta
- Localização: `/account`
- Cor verde destacada

---

## 🧪 PASSO 7: Testar o Sistema

### Checklist Completo:

#### 1. Teste SEM Login
- [ ] Acessar `/pages/portal-veterinario`
- [ ] Deve aparecer tela de restrição
- [ ] Botão "Fazer Login" funciona
- [ ] Botão "Solicitar Acesso" funciona

#### 2. Teste COM Login mas SEM Tag
- [ ] Fazer login com conta comum
- [ ] Acessar `/pages/portal-veterinario`
- [ ] Deve aparecer "Aguardando aprovação"

#### 3. Teste COM Login e COM Tag
- [ ] Adicionar tag `veterinario` em uma conta de teste
- [ ] Fazer login
- [ ] Acessar `/pages/portal-veterinario`
- [ ] Deve ver o portal completo:
  - [ ] Boas-vindas com nome do cliente
  - [ ] Badge "Profissional Verificado"
  - [ ] Vitrine de produtos (4 produtos)
  - [ ] Banner de Upsell
  - [ ] Seção de Cross-sell (3 produtos)

#### 4. Teste de Funcionalidades
- [ ] Botões "Adicionar em 1-clique" funcionam
- [ ] Links para coleções completas funcionam
- [ ] Layout responsivo no mobile

---

## ⚙️ PASSO 8: Configurações Avançadas

### 8.1 Personalizar Mensagens

**Arquivo**: `snippets/snippet-acesso-restrito.liquid`

**Linha 29**: Título da restrição
```liquid
<h2>Área Restrita: Médicos Veterinários</h2>
```

**Linha 30**: Descrição
```liquid
<p>Esta página é dedicada exclusivamente a profissionais cadastrados...</p>
```

---

### 8.2 Customizar o Portal

**Arquivo**: `sections/section-portal-veterinario.liquid`

**Linha 18**: Mensagem de boas-vindas
```liquid
<h1>Bem-vindo ao Portal Profissional, Dr. {{ customer.first_name }}</h1>
```

**Linha 22**: Badge de verificação
```liquid
<span class="badge-icon">✓</span> Profissional Verificado
```

---

### 8.3 Mudar Cores

No arquivo `section-portal-veterinario.liquid`:

**Verde principal** (Linha 115):
```css
color: #1a4d33;  /* Cor atual */
```

**Cor do badge** (Linha 121):
```css
color: #2e7d32;
background: #e8f5e9;
```

---

## 🎨 ESTRUTURA VISUAL DO PORTAL

```
┌─────────────────────────────────────────────┐
│ Bem-vindo Dr. [Nome]    [✓ Verificado]      │
├─────────────────────────────────────────────┤
│                                             │
│ OFERTAS EXCLUSIVAS         [Ver catalogo]   │
│                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                │
│ │Prod│ │Prod│ │Prod│ │Prod│                │
│ │  1 │ │  2 │ │  3 │ │  4 │                │
│ └────┘ └────┘ └────┘ └────┘                │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  🎁 COMBO CLÍNICA                           │
│  Kit Primeiros Atendimentos                 │
│  15% desconto extra                         │
│  [Configurar Kit Personalizado]             │
│                                             │
├─────────────────────────────────────────────┤
│ RECOMENDADOS PARA SUA ESPECIALIDADE         │
│                                             │
│ [img] Produto A  +R$XXX  [+]                │
│ [img] Produto B  +R$XXX  [+]                │
│ [img] Produto C  +R$XXX  [+]                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📞 URLs Importantes

- **Portal**: `/pages/portal-veterinario`
- **Cadastro**: `/pages/cadastro-veterinario`
- **Login**: `/account/login`
- **Área da Conta**: `/account`

---

## ⚠️ IMPORTANTE - Não Esquecer!

1. ✅ **Tag EXATA**: `veterinario` (minúsculo, sem acento)
2. ✅ **Handle da página**: `portal-veterinario` (exato)
3. ✅ **Coleções criadas** antes de configurar
4. ✅ **Testar com conta real** antes de divulgar

---

## 🆘 Troubleshooting

### Problema: "Página não encontrada"
**Solução**: Verifique se o handle da página é exatamente `portal-veterinario`

### Problema: "Sempre vejo tela de restrição"
**Solução**: 
1. Verifique se está logado
2. Verifique se a tag `veterinario` está no perfil do cliente
3. Faça logout/login novamente

### Problema: "Produtos não aparecem"
**Solução**: Configure as coleções na customização do tema

### Problema: "Botão adicionar não funciona"
**Solução**: Verifique se os produtos têm variantes disponíveis

---

## 📄 Arquivos Relacionados

- `sections/section-portal-veterinario.liquid` - Portal principal
- `snippets/snippet-acesso-restrito.liquid` - Controle de acesso
- `sections/section-registro-veterinario.liquid` - Formulário de registro
- `sections/main-account.liquid` - Botão na área da conta
- `sections/header.liquid` - Ícone no header

---

**Atualizado em**: 29/12/2024
**Versão**: 2.0
**Status**: ✅ Implementado

---

## 📧 Suporte

Se precisar de ajuda adicional, consulte a documentação do Shopify ou entre em contato com o suporte técnico.
