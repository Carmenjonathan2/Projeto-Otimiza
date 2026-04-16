# Guia: Como Configurar RSS 2.0 no Shopify para Pinterest

## 🎯 Objetivo
Criar um feed RSS 2.0 compatível com Pinterest a partir do seu blog Shopify, já que o Pinterest não aceita feeds Atom (formato padrão do Shopify).

## 📋 Problema Identificado

- ✅ **Feed Atom existe**: `https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom`
- ❌ **Pinterest requer RSS 2.0**: Não aceita formato Atom
- ❌ **Shopify não gera RSS 2.0 por padrão**: Apenas Atom

## 🔧 Solução: Template Liquid Customizado

### Passo 1: Acessar o Editor de Código do Tema

1. Faça login no **Admin do Shopify**
2. Vá em **Online Store** → **Themes**
3. No tema ativo, clique em **Actions** → **Edit code**

### Passo 2: Criar o Template RSS

1. Na seção **Templates**, clique em **Add a new template**
2. Selecione o tipo: **page**
3. Nome do template: **rss** (ficará como `page.rss.liquid`)
4. Clique em **Create template**

### Passo 3: Adicionar o Código

1. Abra o arquivo `page.rss.liquid` recém-criado
2. **DELETE todo o conteúdo padrão**
3. Copie e cole o conteúdo do arquivo `shopify-rss-template.liquid` (fornecido neste projeto)
4. Clique em **Save**

### Passo 4: Criar a Página RSS

1. Vá em **Online Store** → **Pages**
2. Clique em **Add page**
3. Configure:
   - **Title**: `Blog RSS Feed` (ou qualquer título)
   - **Content**: Deixe vazio
   - **Template** (no painel direito): Selecione `page.rss`
4. Clique em **Save**
5. **Anote o handle da página** (geralmente será `blog-rss-feed`)

### Passo 5: URL do Feed RSS

Após criar a página, seu feed RSS estará disponível em:

```
https://otimizafarmavet.com.br/pages/blog-rss-feed
```

(Substitua `blog-rss-feed` pelo handle real da página que você criou)

## 🎨 Alternativa: Template para Blog (Mais Direto)

Se preferir que o RSS seja acessível diretamente pela URL do blog:

1. Em vez de criar um template `page.rss.liquid`, crie `blog.rss.liquid`
2. Use o mesmo código do template
3. Não precisa criar uma página separada
4. O feed estará disponível em:
   ```
   https://otimizafarmavet.com.br/blogs/blog-para-tutores/rss
   ```

### Como fazer:

1. **Templates** → **Add a new template**
2. Tipo: **blog**
3. Nome: **rss**
4. Cole o código do template
5. Salve

Depois, você precisa aplicar este template ao seu blog:

1. Vá em **Online Store** → **Blog posts**
2. Selecione o blog "Blog para Tutores"
3. No painel direito, em **Template suffix**, selecione **rss**
4. Salve

⚠️ **PROBLEMA**: Isso mudaria o template do blog inteiro. **NÃO RECOMENDADO**.

## ✅ Solução Recomendada Final

Use a **Opção 1 (Template de Página)** que é mais segura e não interfere com o blog existente.

## 📌 Configurar no Pinterest

Depois de criar o feed RSS:

1. Acesse sua conta **Pinterest Business**
2. Vá em **Settings** → **Bulk create Pins**
3. Clique em **Auto-publish**
4. Cole a URL do seu feed RSS:
   ```
   https://otimizafarmavet.com.br/pages/blog-rss-feed
   ```
5. Selecione o board de destino
6. Clique em **Save**

## ⏱️ Tempo de Processamento

- Pode levar até **24 horas** para os primeiros Pins aparecerem
- Pinterest pode publicar até **200 itens por dia** de um feed RSS

## 🔍 Verificação

Para testar se o feed está funcionando:

1. Abra no navegador: `https://otimizafarmavet.com.br/pages/blog-rss-feed`
2. Você deve ver um XML com a estrutura RSS 2.0
3. Verifique se as imagens estão sendo incluídas nas tags `<media:content>` e `<enclosure>`

## 📝 Características do Template

O template criado inclui:

- ✅ **Formato RSS 2.0** (compatível com Pinterest)
- ✅ **Imagem destacada** do artigo (`<media:content>` e `<enclosure>`)
- ✅ **Múltiplas imagens** extraídas do conteúdo HTML
- ✅ **Metadados completos** (título, descrição, data, autor)
- ✅ **Tags/categorias** do artigo
- ✅ **Namespace media** para suporte a imagens
- ✅ **Últimos 50 artigos** do blog

## ⚠️ Limitação Conhecida

O Shopify não permite alterar o header HTTP `content-type` para `application/rss+xml`. Alguns leitores RSS podem reclamar, mas o **Pinterest deve aceitar normalmente** pois valida o conteúdo XML.

## 🆘 Troubleshooting

### Erro: "RSS feed cannot be parsed"
- Verifique se o XML está bem formatado
- Teste o feed em um validador RSS online

### Erro: "Links in the RSS feed are not under the claimed domain"
- Certifique-se de que `otimizafarmavet.com.br` está reivindicado no Pinterest
- Vá em Settings → Claimed accounts → Website

### Feed não aparece
- Verifique se a página foi publicada (não está em draft)
- Teste a URL diretamente no navegador
- Limpe o cache do navegador

## 📚 Recursos Adicionais

- [Documentação Pinterest RSS](https://help.pinterest.com/en/business/article/auto-publish-pins-from-your-rss-feed)
- [Shopify Liquid Reference](https://shopify.dev/docs/api/liquid)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
