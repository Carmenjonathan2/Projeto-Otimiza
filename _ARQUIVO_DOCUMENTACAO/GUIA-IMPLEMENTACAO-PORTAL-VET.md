# Guia de Implementação: Portal Exclusivo B2B (Médicos Veterinários)

Este guia detalha como configurar a página exclusiva para veterinários na sua loja Shopify, com acesso restrito, cadastro profissional e funcionalidades de Upsell/Cross-sell.

## Componentes Gerados
1. `snippet-registro-veterinario.liquid`: Formulário de cadastro com campo CRMV.
2. `snippet-acesso-restrito.liquid`: Bloqueio de segurança para não-veterinários.
3. `section-portal-veterinario.liquid`: Interface premium do portal com vitrine e ofertas.

---

## Passo 1: Configurar o Cadastro Profissional

1. No Admin da Shopify, vá em **Loja Online > Páginas**.
2. Crie uma nova página chamada `Cadastro Veterinário`.
3. Se você usa o Online Store 2.0 (Temas modernos):
   - Crie um novo modelo de página (template) chamado `cadastro-vet`.
   - No editor do tema, adicione um bloco de "Liquid Personalizado" e cole:
     ```liquid
     {% render 'snippet-registro-veterinario' %}
     ```
4. **O que acontece aqui:** Quando o veterinário se cadastra, ele recebe as tags `proposito:veterinario` e `aprovacao:pendente`. Você deverá revisar o CRMV e, quando aprovado, alterar a tag para apenas `veterinario`.

---

## Passo 2: Configurar o Portal Exclusivo

1. Crie uma nova página chamada `Portal do Veterinário`.
2. Crie um novo modelo de página (template) chamado `portal-vets`.
3. No editor do tema, no topo da página (antes de qualquer conteúdo), adicione um bloco de "Liquid Personalizado" e cole:
   ```liquid
   {% render 'snippet-acesso-restrito' %}
   ```
4. Abaixo disso, adicione a seção **Portal do Veterinário** que criamos.
5. Nas configurações da seção, selecione uma **Coleção** que contenha produtos que você deseja que sejam exclusivos ou que tenham ofertas profissionais.

---

## Passo 3: Gerenciar o Acesso (Workflow)

O acesso é controlado pela tag **`veterinario`**.

- **Novos Cadastros:** Ficam com status "pendente". Eles verão a mensagem de "Aguardando aprovação" ao tentar acessar o portal.
- **Aprovação:** Após validar o CRMV do médico, vá no painel de Clientes da Shopify e adicione a tag `veterinario` e remova `aprovacao:pendente`.
- **Produtos Exclusivos:** Se desejar ocultar os produtos do portal da sua loja pública, você pode criar uma coleção com condição "Tag do produto igual a 'exclusivo-vet'" e garantir que essa coleção não esteja vinculada ao menu principal da loja.

---

## Diferenciais Implementados

### 🟢 Upsell e Cross-sell
A seção do portal já inclui uma estrutura de **Combo Clínica** (Upsell) e **Recomendados** (Cross-sell). Você pode configurar quais coleções aparecem nesses blocos diretamente pelo Editor de Tema da Shopify.

### 🟢 Design Premium (Aesthetics)
- **Glassmorphism**: Efeitos sutis de transparência e sombras suaves.
- **Identidade Visual**: Uso de tons de verde institucional (#1a4d33) e badges de verificação profissionais.
- **Responsividade**: Layout otimizado para tablets e celulares (comum no uso em clínicas).

### 🟢 Segurança
O `snippet-acesso-restrito` utiliza `window.stop()` e limpeza de DOM para garantir que, mesmo que o Liquid demore um segundo para processar, o conteúdo restrito não seja "piscado" para usuários não autorizados.

---
**Desenvolvido por Antigravity (Advanced Agentic Coding - Google Deepmind)**
