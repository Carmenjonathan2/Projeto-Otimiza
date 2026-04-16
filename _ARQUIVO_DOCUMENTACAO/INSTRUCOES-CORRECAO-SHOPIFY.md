# 🔧 Instruções de Correção - Portal Veterinário Shopify

## 📋 Problemas Identificados e Soluções

### ❌ **Problema 1: JavaScript Bloqueante**
**Arquivo:** `snippet-acesso-restrito.liquid`  
**Erro:** Uso de `window.stop()` e `document.body.innerHTML = ''` causava conflitos com o tema Shopify

**✅ Solução:**
- Removido todo JavaScript bloqueante
- Implementado bloqueio apenas com CSS (overlay fixo com z-index alto)
- Adicionado `break` no loop de tags para melhor performance

---

### ❌ **Problema 2: Tags com Formato Incorreto**
**Arquivo:** `snippet-registro-veterinario.liquid`  
**Erro:** Tags no formato `"proposito:veterinario, aprovacao:pendente"` não eram processadas corretamente

**✅ Solução:**
- Simplificado para tag única: `vet-pendente`
- Quando aprovar o veterinário, você deve:
  1. Remover a tag `vet-pendente`
  2. Adicionar a tag `veterinario`

---

### ❌ **Problema 3: Conflitos de CSS**
**Erro:** Estilos inline conflitando com classes do tema

**✅ Solução:**
- Todos os estilos agora usam classes específicas com prefixo `vet-` ou `restriction-`
- Removido `body { overflow: hidden; }` que quebrava o layout
- CSS mais específico para evitar conflitos

---

## 🚀 Como Implementar as Correções

### **Passo 1: Substituir o Snippet de Acesso Restrito**

1. Acesse **Admin Shopify → Loja Online → Temas → Ações → Editar código**
2. Localize `snippets/snippet-acesso-restrito.liquid`
3. **Substitua TODO o conteúdo** pelo arquivo: `snippet-acesso-restrito-CORRIGIDO.liquid`
4. Clique em **Salvar**

---

### **Passo 2: Substituir o Snippet de Registro**

1. No mesmo editor de código, localize `snippets/snippet-registro-veterinario.liquid`
2. **Substitua TODO o conteúdo** pelo arquivo: `snippet-registro-veterinario-CORRIGIDO.liquid`
3. Clique em **Salvar**

---

### **Passo 3: Atualizar Tags dos Clientes Existentes**

Se você já tem veterinários cadastrados com as tags antigas:

1. Vá em **Admin Shopify → Clientes**
2. Para cada veterinário:
   - **Remova** as tags: `proposito:veterinario`, `aprovacao:pendente`
   - **Adicione** a tag: `vet-pendente` (para pendentes) OU `veterinario` (para aprovados)

---

### **Passo 4: Verificar a Section do Portal**

O arquivo `section-portal-veterinario.liquid` **NÃO precisa de alterações**, mas verifique:

1. No editor de código, localize `sections/section-portal-veterinario.liquid`
2. Confirme que está instalado corretamente
3. No **Editor de Tema**, adicione a seção à página do portal

---

## 📝 Workflow de Aprovação de Veterinários

### **Novo Cadastro:**
1. Veterinário preenche o formulário
2. Sistema cria conta com tag `vet-pendente`
3. Ao tentar acessar o portal, vê mensagem: "Aguardando aprovação"

### **Aprovação Manual:**
1. Acesse **Admin Shopify → Clientes**
2. Encontre o veterinário cadastrado
3. Verifique o CRMV (está nas notas do cliente)
4. **Remova** a tag `vet-pendente`
5. **Adicione** a tag `veterinario`
6. O veterinário agora tem acesso total ao portal

### **Rejeição (opcional):**
1. Simplesmente mantenha a tag `vet-pendente`
2. Ou remova completamente para negar acesso

---

## 🎯 Estrutura de Tags Atualizada

| Tag | Significado | Acesso ao Portal |
|-----|-------------|------------------|
| `vet-pendente` | Cadastro em análise | ❌ Bloqueado |
| `veterinario` | Veterinário aprovado | ✅ Liberado |
| *(sem tag)* | Cliente comum | ❌ Bloqueado |

---

## 🧪 Como Testar

### **Teste 1: Acesso Bloqueado (sem login)**
1. Abra uma janela anônima
2. Acesse a URL do portal (ex: `sualoja.com/pages/portal-veterinario`)
3. **Resultado esperado:** Deve mostrar tela de bloqueio com botões "Fazer Login" e "Solicitar Acesso"

### **Teste 2: Acesso Bloqueado (cliente comum)**
1. Faça login com uma conta de cliente normal (sem tag `veterinario`)
2. Acesse a URL do portal
3. **Resultado esperado:** Mensagem "Aguardando aprovação do seu registro profissional"

### **Teste 3: Acesso Liberado (veterinário aprovado)**
1. Crie uma conta de teste
2. Adicione manualmente a tag `veterinario` no Admin
3. Faça login e acesse o portal
4. **Resultado esperado:** Portal completo visível com produtos, upsell e cross-sell

### **Teste 4: Formulário de Cadastro**
1. Acesse a página de cadastro (ex: `/pages/cadastro-veterinario`)
2. Preencha todos os campos
3. Envie o formulário
4. **Resultado esperado:** Conta criada com tag `vet-pendente`

---

## 🔍 Troubleshooting

### **Problema: "Ainda vejo erros no tema"**
**Solução:**
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Limpe o cache da Shopify: Admin → Loja Online → Temas → Ações → Limpar cache
- Verifique se salvou TODOS os arquivos corrigidos

### **Problema: "O portal não aparece"**
**Solução:**
- Verifique se a seção `section-portal-veterinario.liquid` está adicionada à página
- No Editor de Tema, vá na página do portal e adicione a seção "Portal do Veterinário"

### **Problema: "Tags não estão funcionando"**
**Solução:**
- Certifique-se de que a tag é exatamente `veterinario` (minúsculo, sem acentos)
- Verifique se não há espaços antes ou depois da tag
- Teste com uma conta nova para garantir

### **Problema: "CSS está quebrado"**
**Solução:**
- Verifique se não há CSS duplicado no tema
- Remova qualquer CSS antigo relacionado ao portal veterinário
- Use os arquivos CORRIGIDOS que têm classes específicas

---

## 📞 Suporte

Se os problemas persistirem:

1. **Exporte o código atual:**
   - Vá em Temas → Ações → Baixar arquivo do tema
   
2. **Verifique os logs de erro:**
   - Admin Shopify → Configurações → Checkout → Personalizar
   - Procure por erros de JavaScript no console do navegador (F12)

3. **Teste em ambiente de desenvolvimento:**
   - Crie uma cópia do tema antes de fazer alterações
   - Teste todas as mudanças na cópia primeiro

---

## ✅ Checklist de Implementação

- [ ] Substituí `snippet-acesso-restrito.liquid` pela versão corrigida
- [ ] Substituí `snippet-registro-veterinario.liquid` pela versão corrigida
- [ ] Atualizei as tags dos clientes existentes
- [ ] Testei o acesso bloqueado (sem login)
- [ ] Testei o acesso bloqueado (cliente comum)
- [ ] Testei o acesso liberado (veterinário aprovado)
- [ ] Testei o formulário de cadastro
- [ ] Limpei o cache do navegador e da Shopify
- [ ] Verifiquei que não há erros no console (F12)

---

**Desenvolvido por Antigravity (Advanced Agentic Coding - Google Deepmind)**  
*Última atualização: 18/12/2025*
