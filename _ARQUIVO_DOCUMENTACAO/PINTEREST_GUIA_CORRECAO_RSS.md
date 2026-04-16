# GUIA PASSO A PASSO: Corrigir Feed RSS no Shopify

## O que mudou?

A diferenca principal e a linha `{% layout none %}` no inicio do arquivo.
Isso garante que o Shopify retorne APENAS o XML, sem o layout HTML do tema.

## Passos para Implementar

### Passo 1: Acessar Editor de Codigo

1. Acesse: https://admin.shopify.com/
2. No menu lateral: **Online Store**
3. Clique em **Themes**
4. No tema ativo, clique em **Actions** (botao com 3 pontinhos)
5. Selecione **Edit code**

### Passo 2: Editar/Criar Template

**Na barra lateral esquerda**, procure a secao **Templates**

#### Se o arquivo `page.rss.liquid` JA EXISTE:

1. Clique em `page.rss.liquid`
2. **Selecione TODO o conteudo** (Ctrl+A)
3. **Delete tudo**
4. **Cole o novo codigo** do arquivo `page.rss.liquid` (neste projeto)
5. **Clique em SAVE** (botao verde no topo)

#### Se o arquivo `page.rss.liquid` NAO EXISTE:

1. Clique em **Add a new template**
2. No popup:
   - **Template type**: Selecione `page`
   - **Template name**: Digite `rss`
3. Clique em **Create template**
4. **Delete o conteudo padrao** que aparece
5. **Cole o novo codigo** do arquivo `page.rss.liquid` (neste projeto)
6. **Clique em SAVE** (botao verde no topo)

### Passo 3: Aplicar Template na Pagina

1. Volte ao menu principal do Shopify
2. Vá em **Online Store** → **Pages**
3. Encontre a pagina **"Blog RSS Feed"**
4. Clique nela para editar
5. **No painel DIREITO**, procure por:
   - "Theme template" ou
   - "Template" ou
   - "Template suffix"
6. No dropdown, selecione **`page.rss`**
7. **Clique em SAVE** (botao verde no topo direito)

### Passo 4: Verificar se Funcionou

Aguarde 1-2 minutos e teste:

1. Abra uma aba anonima/privada no navegador
2. Acesse: `https://otimizafarmavet.com.br/pages/blog-rss-feed`
3. Voce deve ver um XML que comeca com:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <rss version="2.0" ...>
   ```

OU execute o script de teste:
```bash
python test_rss_fixed.py
```

## Checklist de Verificacao

- [ ] Arquivo `page.rss.liquid` criado/editado no Shopify
- [ ] Codigo comeca com `{% layout none %}`
- [ ] Template salvo (botao SAVE clicado)
- [ ] Pagina "Blog RSS Feed" configurada para usar template `page.rss`
- [ ] Pagina salva
- [ ] URL testada em aba anonima
- [ ] Feed retorna XML (nao HTML)

## Troubleshooting

### Problema: Ainda retorna HTML

**Solucao**:
1. Verifique se clicou em SAVE no template
2. Verifique se a pagina esta usando o template `page.rss`
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Aguarde 5 minutos e teste novamente

### Problema: Erro 404

**Solucao**:
1. Verifique se a pagina "Blog RSS Feed" esta publicada (nao em draft)
2. Verifique se o handle da pagina e `blog-rss-feed`

### Problema: XML vazio ou sem artigos

**Solucao**:
1. Verifique se o blog tem artigos publicados
2. Verifique se o handle do blog e `blog-para-tutores`
3. No template, verifique a linha: `{% assign blog_handle = 'blog-para-tutores' %}`

## Proximos Passos Apos Correcao

1. ✅ Validar feed em: https://validator.w3.org/feed/
2. ✅ Configurar no Pinterest com a URL: `https://otimizafarmavet.com.br/pages/blog-rss-feed`
3. ✅ Aguardar ate 24h para primeira sincronizacao

## Codigo do Template

O codigo completo esta no arquivo: `page.rss.liquid`

**IMPORTANTE**: A primeira linha DEVE ser `{% layout none %}` - isso e crucial!
