# ✅ CHECKLIST RÁPIDO - Configuração de Páginas

**Guia Visual Simplificado**

---

## 🎯 CONFIGURAÇÃO EM 5 PASSOS

### **1️⃣ PORTAL VETERINÁRIO** (5 min)

```
Admin → Páginas → Adicionar página
├─ Título: "Portal do Veterinário"
├─ Handle: "portal-veterinario"
└─ Salvar

Personalizar → Add section
├─ Selecionar: "Portal do Veterinário"
├─ Configurar coleções
└─ Salvar
```

**Checklist:**
- [ ] Página criada
- [ ] Handle: `portal-veterinario`
- [ ] Section adicionada
- [ ] Coleções configuradas
- [ ] SEO configurado

---

### **2️⃣ CADASTRO VETERINÁRIO** (3 min)

```
Admin → Páginas → Adicionar página
├─ Título: "Cadastro Veterinário"
├─ Handle: "cadastro-veterinario"
└─ Salvar

Personalizar → Add section
├─ Selecionar: "Custom Liquid"
├─ Colar: {% render 'snippet-registro-veterinario-CORRIGIDO' %}
└─ Salvar
```

**Checklist:**
- [ ] Página criada
- [ ] Handle: `cadastro-veterinario`
- [ ] Snippet adicionado
- [ ] SEO configurado

---

### **3️⃣ COLEÇÕES** (5 min)

```
Admin → Produtos → Coleções → Criar coleção

COLEÇÃO 1:
├─ Nome: "Produtos Exclusivos Veterinários"
├─ Tipo: Manual ou Automatizada
└─ Adicionar produtos

COLEÇÃO 2:
├─ Nome: "Recomendados para Veterinários"
└─ Adicionar produtos complementares
```

**Checklist:**
- [ ] Coleção principal criada
- [ ] Produtos adicionados
- [ ] Coleção cross-sell criada
- [ ] Vinculadas ao portal

---

### **4️⃣ MENU/LINKS** (3 min)

**Opção A - Footer:**
```
Admin → Navegação → Footer
├─ Adicionar item
├─ Nome: "Área do Veterinário"
├─ Link: /pages/portal-veterinario
└─ Salvar
```

**Opção B - Página de Login:**
```
Adicionar link:
<a href="/pages/cadastro-veterinario">
  Cadastre-se como veterinário
</a>
```

**Checklist:**
- [ ] Link adicionado ao footer OU
- [ ] Link adicionado à página de login
- [ ] Link funciona

---

### **5️⃣ TESTES** (5 min)

```
TESTE 1: Sem login
├─ Acessar portal
└─ ✅ Deve bloquear

TESTE 2: Cliente comum
├─ Login sem tag veterinario
├─ Acessar portal
└─ ✅ Deve mostrar "Aguardando aprovação"

TESTE 3: Veterinário
├─ Login com tag veterinario
├─ Acessar portal
└─ ✅ Deve mostrar portal completo

TESTE 4: Cadastro
├─ Preencher formulário
├─ Enviar
└─ ✅ Criar conta com tag vet-pendente
```

**Checklist:**
- [ ] Portal bloqueia não-vets ✅
- [ ] Portal libera vets ✅
- [ ] Cadastro funciona ✅
- [ ] Produtos aparecem ✅

---

## 📊 RESUMO VISUAL

```
┌─────────────────────────────────────────┐
│  PORTAL VETERINÁRIO                     │
│  URL: /pages/portal-veterinario         │
│  ├─ Section: Portal do Veterinário      │
│  ├─ Coleção: Produtos Exclusivos        │
│  └─ Coleção: Cross-sell                 │
├─────────────────────────────────────────┤
│  CADASTRO VETERINÁRIO                   │
│  URL: /pages/cadastro-veterinario       │
│  └─ Snippet: registro-veterinario       │
├─────────────────────────────────────────┤
│  NAVEGAÇÃO                              │
│  ├─ Footer: Link para portal            │
│  └─ Login: Link para cadastro           │
└─────────────────────────────────────────┘
```

---

## ⏱️ TEMPO TOTAL

| Passo | Tempo |
|-------|-------|
| Portal | 5 min |
| Cadastro | 3 min |
| Coleções | 5 min |
| Menu | 3 min |
| Testes | 5 min |
| **TOTAL** | **~20 min** |

---

## 🎯 URLS IMPORTANTES

Após configurar, você terá:

- **Portal:** `seusite.com/pages/portal-veterinario`
- **Cadastro:** `seusite.com/pages/cadastro-veterinario`

---

## 🔧 CONFIGURAÇÕES ESSENCIAIS

### **SEO do Portal**

```
Título: Portal Exclusivo para Médicos Veterinários
Descrição: Acesso exclusivo para profissionais. 
           Produtos de uso restrito e preços especiais.
URL: portal-veterinario
```

### **SEO do Cadastro**

```
Título: Cadastro Profissional Veterinário
Descrição: Cadastre-se e tenha acesso a produtos 
           exclusivos e condições diferenciadas.
URL: cadastro-veterinario
```

---

## 🎨 PERSONALIZAÇÃO RÁPIDA

### **Mudar Cores**

No arquivo `section-portal-veterinario.liquid`:

```css
/* Linha ~109 */
color: #1a4d33; /* Sua cor primária */

/* Linha ~208 */
background: linear-gradient(135deg, #1a4d33 0%, #2e7d32 100%);
```

### **Mudar Textos**

```liquid
<!-- Linha 12 -->
<h1>Bem-vindo ao Portal Profissional, Dr. {{ customer.first_name }}</h1>

<!-- Linha 13 -->
<p>Aqui você encontra condições exclusivas...</p>
```

---

## 🆘 PROBLEMAS COMUNS

### **Portal não aparece**
✅ Verifique se adicionou a section
✅ Limpe o cache
✅ Verifique se salvou

### **Produtos não aparecem**
✅ Verifique se a coleção tem produtos
✅ Verifique se está vinculada
✅ Verifique se produtos estão publicados

### **Bloqueio não funciona**
✅ Tag deve ser exatamente: `veterinario`
✅ Teste em janela anônima
✅ Verifique se snippet está renderizado

---

## ✅ CHECKLIST FINAL

- [ ] Portal criado e configurado
- [ ] Cadastro criado e configurado
- [ ] Coleções criadas e vinculadas
- [ ] Links adicionados ao site
- [ ] SEO configurado
- [ ] Testes realizados
- [ ] Tudo funcionando!

---

**Tempo total: ~20 minutos**  
**Dificuldade: ⭐⭐ Fácil**

**Desenvolvido por Antigravity**  
*Configuração rápida e eficiente! 🚀*
