# SOLUCAO: Feed RSS nao esta funcionando

## Problema Identificado

O template `page.rss.liquid` nao esta sendo aplicado corretamente. O Shopify esta retornando metadados da pagina em vez do conteudo RSS.

## Solucao: Usar Shopify Liquid Ajax API

Em vez de criar um template customizado (que pode nao funcionar em todos os temas), vamos usar uma abordagem mais confiavel:

### Opcao 1: Usar o Feed Atom Existente com Conversor

O Shopify ja tem um feed Atom funcionando:
```
https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom
```

Podemos criar um conversor que transforma Atom em RSS 2.0 e hospedar em um servico gratuito.

### Opcao 2: Criar Snippet Liquid (RECOMENDADO)

1. **Acesse o Editor de Codigo do Tema**
   - Admin Shopify → Online Store → Themes → Actions → Edit code

2. **Crie um novo Snippet**
   - Na secao "Snippets", clique em "Add a new snippet"
   - Nome: `rss-feed`
   - Cole o conteudo do arquivo `shopify-rss-template-v2.liquid`
   - Salve

3. **Crie um novo Template de Pagina**
   - Na secao "Templates", clique em "Add a new template"
   - Tipo: `page`
   - Nome: `feed`
   - Substitua TODO o conteudo por:
   ```liquid
   {% layout none %}
   {% render 'rss-feed' %}
   ```
   - Salve

4. **Edite a Pagina "Blog RSS Feed"**
   - Online Store → Pages → Blog RSS Feed
   - No painel direito, em "Theme template", selecione `page.feed`
   - Salve

5. **Teste a URL**
   ```
   https://otimizafarmavet.com.br/pages/blog-rss-feed
   ```

### Opcao 3: Usar Servico de Conversao RSS (MAIS FACIL)

Use um servico como FeedBurner ou RSS.app para converter o feed Atom em RSS 2.0:

1. **Acesse**: https://rss.app/
2. **Crie uma conta gratuita**
3. **Adicione o feed Atom**: `https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom`
4. **Copie a URL do feed RSS 2.0 gerado**
5. **Use essa URL no Pinterest**

### Opcao 4: Criar Aplicacao Shopify (AVANCADO)

Criar uma app Shopify que gera o feed RSS dinamicamente via API.

## Recomendacao

**Use a Opcao 3 (Servico de Conversao)** por ser:
- Mais rapida
- Nao requer modificacoes no tema
- Gratuita
- Confiavel

## Proximos Passos

1. Escolha uma das opcoes acima
2. Teste a URL do feed em um validador RSS
3. Configure no Pinterest

## Validador RSS Online

Teste seu feed em:
- https://validator.w3.org/feed/
- https://www.feedvalidator.org/
