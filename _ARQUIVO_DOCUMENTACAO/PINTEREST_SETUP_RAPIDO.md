# 🚀 GUIA RÁPIDO DE SETUP - Pinterest Automation

## ⚡ Setup em 5 Minutos

### 1️⃣ Configurar Google API Key

Edite o arquivo `.env`:
```bash
GOOGLE_API_KEY=sua_chave_google_aqui
```

### 2️⃣ Instalar Dependências

```bash
pip install -r requirements.txt
```

### 3️⃣ Testar Sistema

```bash
# Testar geração de imagem IA
python image_creator.py

# Testar geração de conteúdo
python content_generator.py

# Gerar 1 post completo
python main.py --single
```

### 4️⃣ Verificar Resultado

1. **Post no Shopify:** `https://otimizafarmavet.com.br/blogs/blog-para-tutores`
2. **Feed RSS:** `https://otimizafarmavet.com.br/pages/blog-rss-feed`
3. **Imagem gerada:** Pasta `generated_pins/`

### 5️⃣ Configurar Pinterest

1. Acesse Pinterest Business → Settings → Auto-publish
2. Cole URL: `https://otimizafarmavet.com.br/pages/blog-rss-feed`
3. Selecione board de destino
4. Salve

---

## 🎯 Modo Produção

### Agendar Posts Automáticos (3x/dia)

```bash
python main.py
```

**Horários configurados:**
- 12:00
- 12:30
- 12:45

---

## ✅ Checklist de Validação

- [ ] Google API Key configurada
- [ ] Dependências instaladas
- [ ] Teste de imagem IA funcionou
- [ ] Post de teste criado no Shopify
- [ ] Feed RSS acessível
- [ ] Pinterest conectado ao feed

---

## 📊 O Que Esperar

**Primeiras 24h:**
- 3 posts publicados automaticamente
- Feed RSS atualizado
- Pinterest começa a sincronizar

**Primeira semana:**
- 21 posts publicados
- Primeiras impressões no Pinterest
- Primeiros cliques para o blog

**Primeiro mês:**
- 90 posts publicados
- 15.000-30.000 impressões Pinterest
- 800-1.500 cliques para blog

---

## 🆘 Problemas Comuns

**Imagem não gerou com IA?**
→ Sistema usa design básico automaticamente (fallback)

**Post não apareceu no Shopify?**
→ Verifique credenciais no `.env`

**Pinterest não sincronizou?**
→ Aguarde até 24h para primeira sincronização

---

**Tudo pronto! Sistema otimizado e funcionando! 🎉**
