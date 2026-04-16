# 🩺 MANUAL DE IMPLEMENTAÇÃO: PORTAL B2B EXCLUSIVO VETERINÁRIO
## Projeto Otimiza FarmaVet - Sistema de Área Restrita e Vendas Pro

Este manual orienta a instalação técnica da área exclusiva para médicos veterinários na Shopify. O sistema inclui cadastro profissional, validação de CRMV, bloqueio de segurança e vitrine de ofertas com Upsell/Cross-sell.

---

## 1. COMPONENTES DO SISTEMA
O sistema é composto por 3 arquivos principais que você deve carregar na sua loja:

1.  **Snippet: `snippet-registro-veterinario.liquid`**
    *   *O que é:* O formulário de cadastro com campo para CRMV.
2.  **Snippet: `snippet-acesso-restrito-FIX.liquid`**
    *   *O que é:* O "guarda" que bloqueia usuários não autorizados.
3.  **Seção: `section-portal-veterinario.liquid`**
    *   *O que é:* A interface visual do portal com produtos e ofertas.

---

## 2. PASSO A PASSO DA INSTALAÇÃO

### PASSO A: Criar os Arquivos na Shopify
1. No Admin da Shopify, vá em **Loja Online > Temas**.
2. Clique nos **três pontinhos (...) > Editar Código**.
3. Na pasta **Snippets**, clique em "Adicionar um novo snippet" e crie os dois arquivos (.liquid) listados acima, colando o conteúdo de cada um.
4. Na pasta **Sections**, clique em "Adicionar uma nova seção", dê o nome de `section-portal-veterinario.liquid` e cole o código correspondente.

### PASSO B: Configurar a Página de Cadastro (A captação)
1. Vá em **Loja Online > Páginas > Adicionar página**.
2. Título: `Cadastro Veterinário`.
3. No lado direito, em **Modelo de página (Template)**, escolha `Página Padrão`.
4. Salve a página.
5. Agora, vá em **Personalizar Tema** (Editor Visual):
   - Navegue até a página de Cadastro que você criou.
   - Adicione uma seção de **"Liquid Personalizado"**.
   - No campo de código, cole: `{% render 'snippet-registro-veterinario' %}`.

### PASSO C: Configurar o Portal (A área restrita)
1. Crie uma nova página chamada `Portal do Veterinário`.
2. No Editor Visual do Tema:
   - Navegue até a página do Portal.
   - No topo da página, adicione uma seção de **"Liquid Personalizado"** e cole: `{% render 'snippet-acesso-restrito-FIX' %}`.
   - Logo abaixo, clique em **"Adicionar Seção"** e procure por **"Portal do Veterinário"**.
   - Configure as coleções de produtos que deseja exibir.

---

## 3. FLUXO DE GESTÃO DE CLIENTES (IMPORTANTE)

O acesso automático é baseado em **TAGS**. Siga este fluxo para cada novo cliente:

1.  **O Registro:** O médico se cadastra pelo formulário. Ele recebe automaticamente as tags `proposito:veterinario` e `aprovacao:pendente`.
2.  **A Verificação:** Você acessa o painel de **Clientes** da Shopify, vê os dados do CRMV e valida o profissional.
3.  **A Aprovação:** 
    - Remova a tag `aprovacao:pendente`.
    - Adicione a tag **`veterinario`** (em letras minúsculas).
4.  **O Acesso:** Apenas clientes com a tag `veterinario` conseguirão ver o conteúdo do Portal. Os demais serão redirecionados ou verão a tela de bloqueio.

---

## 4. FUNCIONALIDADES EXCLUSIVAS
*   **Upsell (Combo Clínica):** Configure uma coleção de kits na seção do portal para incentivar compras de maior volume.
*   **Cross-sell (Recomendados):** Opcional na parte inferior do portal, ideal para produtos complementares (ex: seringas + medicamentos).

---
**Suporte Técnico Antigravity**
*Gerado para: Otimiza FarmaVet*
