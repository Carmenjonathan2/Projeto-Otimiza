# 🚀 GUIA DE TESTE COMPLETO - AUTOMAÇÃO PINTEREST

## ✅ STATUS ATUAL DO SISTEMA

### Configurações Validadas:
- ✅ **Vertex AI Imagen**: Autenticado e funcionando
- ✅ **Aspect Ratio**: Corrigido para `9:16` (ideal para Pinterest)
- ✅ **Prompts Premium V2**: Configurados com qualidade fotorrealista
- ✅ **Shopify**: Configurado (otimizafarmavet.com.br)
- ✅ **RSS Feed**: Sistema local configurado

---

## 📋 PLANO DE TESTES

### TESTE 1: Gerar Imagem Individual com Vertex AI
**Objetivo**: Validar qualidade da imagem gerada

```bash
python test_vertex_ai.py
```

**Resultado Esperado**:
- ✅ Imagem salva em `test_images_vertex_ai/test_vertex_TIMESTAMP.png`
- ✅ Qualidade fotorrealista, sem texto
- ✅ Aspect ratio 9:16 (vertical)

---

### TESTE 2: Testar ImageCreator Completo
**Objetivo**: Validar o módulo principal de criação de imagens

```bash
python image_creator.py
```

**Resultado Esperado**:
- ✅ Arquivo `test_pin_ai.png` criado
- ✅ Deve usar Vertex AI (não fallback)
- ✅ Mensagem: `[OK] Google Vertex AI (Imagen) configurado com sucesso!`

---

### TESTE 3: Publicação Única no Shopify
**Objetivo**: Testar fluxo completo de criação + publicação no Shopify

```bash
python main.py --single
```

**O que acontece**:
1. ✅ Gera conteúdo aleatório do `content_database.json`
2. ✅ Cria imagem com Vertex AI
3. ✅ Faz upload da imagem para o Shopify
4. ✅ Publica artigo no blog `otimizafarmavet.com.br/blogs/blog-para-tutores`
5. ✅ Atualiza automaticamente o RSS feed do Shopify

**Resultado Esperado**:
```
[IMG] Gerando imagem FOTORREALISTA com Vertex AI para: [TÍTULO]
[OK] Imagem Vertex AI salva: generated_pins/pin_TIMESTAMP.png
Publishing to Shopify Blog...
SUCCESS! Published to Shopify: https://otimizafarmavet.com.br/blogs/blog-para-tutores/[SLUG]
```

---

### TESTE 4: Verificar RSS Feed do Shopify
**Objetivo**: Confirmar que o Pinterest consegue ler o feed

**URL do RSS Feed Shopify**:
```
https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom
```

**Validação Manual**:
1. Abra a URL no navegador
2. Deve mostrar XML válido
3. Verifique se tem `<entry>` com o artigo publicado
4. Confirme que tem tag `<link>` e `<content>`

**Validação Automática**:
```bash
python test_rss_feed.py
```

---

## 🎯 CONFIGURAR PINTEREST PARA LER O RSS FEED

### Passo 1: Acessar Configurações do Pinterest Business
1. Acesse: https://business.pinterest.com/
2. Login com sua conta business
3. Vá em **Settings** → **Claimed accounts**

### Passo 2: Conectar RSS Feed
1. Clique em **Claim website** (se ainda não fez)
2. Adicione: `otimizafarmavet.com.br`
3. Depois vá em **Auto-publish** (Publicação Automática)
4. Clique em **Add RSS feed**

### Passo 3: Adicionar URL do Feed
```
https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom
```

### Passo 4: Configurar Frequência
- Escolha: **Check for new content every day**
- Pinterest vai verificar automaticamente novas postagens

### Passo 5: Validar Conexão
- Pinterest vai fazer um teste inicial
- Se aprovado, mostrará ✅ **Connected**
- Pins serão criados automaticamente para novos artigos

---

## 📊 MONITORAMENTO

### Verificar Logs do Sistema
```bash
# Durante execução, você verá:
[INIT] Inicializando Vertex AI com projeto: pinterest-otimiza-farmavet
[OK] Google Vertex AI (Imagen) configurado com sucesso!
[IMG] Gerando imagem FOTORREALISTA com Vertex AI para: [TÍTULO]
Publishing to Shopify Blog...
SUCCESS! Published to Shopify: [URL]
```

### Verificar Artigos Publicados no Shopify
```
https://otimizafarmavet.com.br/blogs/blog-para-tutores
```

### Verificar Pins Criados no Pinterest
```
https://br.pinterest.com/otimizafarmave/
```

---

## 🔄 AUTOMAÇÃO CONTÍNUA

### Iniciar Agendamento Automático
```bash
python main.py
```

**Horários Configurados** (em `config.py`):
- 🕘 09:00
- 🕑 14:00  
- 🕖 19:00

**Frequência**: 3 posts/dia

---

## ❌ TROUBLESHOOTING

### Erro: "aspect ratio, 2:3"
**Solução**: ✅ JÁ CORRIGIDO - Agora usa `9:16`

### Erro: "Unable to authenticate"
**Solução**:
```bash
gcloud.cmd auth application-default login
```

### Imagens não aparecem no Pinterest
**Verificar**:
1. ✅ RSS feed está acessível publicamente
2. ✅ Imagens têm URLs públicas (não localhost)
3. ✅ Pinterest está conectado ao feed RSS
4. ⏱️ Aguardar até 24h para Pinterest processar

### Shopify não recebe posts
**Verificar**:
1. Credenciais no `.env`:
   - `SHOPIFY_SHOP_URL`
   - `SHOPIFY_ACCESS_TOKEN`
   - `SHOPIFY_BLOG_ID`
2. Permissões do token (precisa de `write_content`)

---

## 📁 ESTRUTURA DE ARQUIVOS GERADOS

```
pinterest-automation/
├── generated_pins/              ← Imagens prontas para Shopify
│   └── pin_TIMESTAMP.png
├── test_images_vertex_ai/       ← Testes do Vertex AI
│   └── test_vertex_TIMESTAMP.png
└── (Shopify hospeda as imagens automaticamente)
```

---

## 🎯 CHECKLIST FINAL

### Antes de Lançar em Produção
- [ ] Testar `python test_vertex_ai.py` ✅
- [ ] Testar `python main.py --single` 
- [ ] Verificar artigo publicado no Shopify
- [ ] Validar RSS feed: `otimizafarmavet.com.br/blogs/blog-para-tutores.atom`
- [ ] Conectar RSS no Pinterest Business
- [ ] Aguardar 24h e verificar se pins foram criados
- [ ] Iniciar automação: `python main.py`

---

## 📞 COMANDOS RÁPIDOS

```bash
# Teste único (recomendado primeiro)
python main.py --single

# Automação completa
python main.py

# Verificar RSS
python test_rss_feed.py

# Testar Vertex AI
python test_vertex_ai.py
```

---

## 🌟 PRÓXIMOS PASSOS APÓS SUCESSO

1. ✅ Configurar como serviço Windows (rodar 24/7)
2. ✅ Monitorar métricas no Pinterest Analytics
3. ✅ Ajustar horários conforme engajamento
4. ✅ Expandir `content_database.json` com mais tópicos
5. ✅ A/B testing de diferentes estilos de prompt

---

**Criado em**: 2025-12-11  
**Status**: ✅ Sistema pronto para testes
