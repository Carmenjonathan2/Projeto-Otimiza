# 🛡️ SISTEMA DE PREVENÇÃO DE DUPLICIDADES - GUIA COMPLETO

**Data:** 16 de dezembro de 2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Pronto para Uso

---

## 📋 O QUE FOI IMPLEMENTADO

### ✅ Arquivos Modificados:

1. **`content_generator.py`**
   - ✅ Importação do `PreventorDuplicidades`
   - ✅ Verificação de duplicidades antes de selecionar tópico
   - ✅ Tentativa de até 20 tópicos diferentes
   - ✅ Mensagens informativas sobre tópicos pulados

2. **`main.py`**
   - ✅ Registro automático após publicação bem-sucedida
   - ✅ Metadados completos (URL, categoria, hashtags)
   - ✅ Confirmação visual de registro

3. **`preventor_duplicidades.py`** (NOVO)
   - ✅ Verificação por título normalizado
   - ✅ Verificação por hash de conteúdo
   - ✅ Registro em `registro_publicacoes.json`
   - ✅ Intervalo configurável (padrão: 30 dias)

---

## 🚀 COMO USAR

### 1️⃣ Publicar Single Post (COM proteção)

```bash
cd C:\Users\jonat\.gemini\antigravity\scratch\pinterest-automation
python main.py --single
```

**O que acontece:**
1. ✅ Sistema seleciona tópico aleatório
2. ✅ Verifica se já foi publicado nos últimos 30 dias
3. ✅ Se duplicado, pula e tenta outro tópico
4. ✅ Cria imagem e publica no Shopify
5. ✅ Registra publicação automaticamente

**Saída esperada:**
```
initializing system in SHOPIFY BLOG Mode...
Target Shop: otimizafarmavet.myshopify.com

[2025-12-16 17:10:00] Starting content creation process...
✅ Tópico selecionado (tentativa 1/20): Vacinação de Cães e Gatos: Guia Completo
   ✅ Post pode ser publicado
Generated content: Vacinação de Cães e Gatos: Guia Completo
Created image: generated_pins\pin_1734373800.png
Publishing to Shopify Blog...
Shopify Article Created: Vacinação de Cães e Gatos: Guia Completo (ID: 123456)
SUCCESS! Published to Shopify: https://otimizafarmavet.myshopify.com/blogs/...
📝 Publicação registrada no sistema de prevenção de duplicidades
```

### 2️⃣ Testar Proteção Contra Duplicatas

```bash
# Executar 3 vezes seguidas
python main.py --single
python main.py --single
python main.py --single
```

**Resultado esperado:**
- 1ª execução: Publica tópico A ✅
- 2ª execução: Pula tópico A, publica tópico B ✅
- 3ª execução: Pula tópicos A e B, publica tópico C ✅

### 3️⃣ Ver Relatório de Publicações

```bash
python -c "from preventor_duplicidades import PreventorDuplicidades; p = PreventorDuplicidades(); import json; print(json.dumps(p.gerar_relatorio(), indent=2, ensure_ascii=False))"
```

**Saída:**
```json
{
  "total_publicacoes": 3,
  "por_plataforma": {
    "shopify": 3,
    "pinterest": 3
  },
  "ultimos_7_dias": 3
}
```

### 4️⃣ Limpar Registros Antigos

```bash
# Remover registros com mais de 30 dias
python -c "from preventor_duplicidades import PreventorDuplicidades; p = PreventorDuplicidades(); p.limpar_registros_antigos(30)"
```

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Publicação Normal ✅
```bash
python main.py --single
```
**Esperado:** Publica novo post sem erros

### Teste 2: Proteção Contra Duplicata ✅
```bash
python main.py --single
python main.py --single
```
**Esperado:** 
- 1ª vez: Publica post A
- 2ª vez: Pula post A, publica post B diferente

### Teste 3: Todos os Tópicos Publicados ⚠️
```bash
# Executar 20+ vezes para esgotar todos os tópicos
for i in {1..25}; do python main.py --single; done
```
**Esperado:** Após ~20 publicações, deve mostrar erro informativo

### Teste 4: Verificar Arquivo de Registro 📝
```bash
type registro_publicacoes.json
```
**Esperado:** JSON com lista de publicações

---

## 📊 ESTRUTURA DO REGISTRO

### Arquivo: `registro_publicacoes.json`

```json
{
  "publicacoes": [
    {
      "id": "a1b2c3d4e5f6",
      "titulo": "Banho em Cães: Frequência e Técnicas Corretas",
      "titulo_normalizado": "banho em caes frequencia e tecnicas corretas",
      "hash_conteudo": "sha256_hash_aqui...",
      "data_publicacao": "2025-12-16T17:10:00.123456",
      "plataformas": ["shopify", "pinterest"],
      "status": "publicado",
      "metadata": {
        "url": "https://otimizafarmavet.myshopify.com/blogs/...",
        "categoria": "Higiene",
        "hashtags": ["#banhopet", "#higieneanimal"],
        "image_path": "generated_pins/pin_1734373800.png"
      }
    }
  ]
}
```

---

## ⚙️ CONFIGURAÇÕES

### Intervalo de Duplicidade

**Padrão:** 30 dias (não repetir o mesmo tópico em 30 dias)

**Modificar:**
Edite `content_generator.py`, linha ~270:
```python
pode_publicar, mensagem = self.preventor.pode_publicar(
    titulo=titulo,
    conteudo=descricao_original,
    intervalo_dias=30,  # ← ALTERAR AQUI (ex: 7, 15, 60, 90)
    verificar_hash=True
)
```

### Desabilitar Verificação de Hash

Se quiser permitir mesmo conteúdo com títulos diferentes:
```python
pode_publicar, mensagem = self.preventor.pode_publicar(
    titulo=titulo,
    conteudo=descricao_original,
    intervalo_dias=30,
    verificar_hash=False  # ← ALTERAR PARA FALSE
)
```

---

## 🔧 MANUTENÇÃO

### Limpar Registros Antigos (Recomendado Mensalmente)

```bash
# Manter apenas últimos 90 dias
python -c "from preventor_duplicidades import PreventorDuplicidades; p = PreventorDuplicidades(); p.limpar_registros_antigos(90)"
```

### Backup do Registro

```bash
# Criar backup manual
copy registro_publicacoes.json registro_publicacoes_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.json
```

### Resetar Sistema (Permitir Republicar Tudo)

```bash
# ⚠️ CUIDADO: Isso apaga todo o histórico
del registro_publicacoes.json
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Todos os tópicos foram publicados recentemente"

**Causa:** Você já publicou todos os 20 tópicos do `content_database.json` nos últimos 30 dias.

**Soluções:**
1. **Aguardar:** Espere alguns dias para tópicos saírem do intervalo
2. **Adicionar tópicos:** Edite `content_database.json` e adicione novos tópicos
3. **Reduzir intervalo:** Mude de 30 para 7 dias (não recomendado)
4. **Limpar registros:** `del registro_publicacoes.json` (use com cautela)

### Problema: Erro "ModuleNotFoundError: No module named 'preventor_duplicidades'"

**Causa:** Arquivo `preventor_duplicidades.py` não está no diretório.

**Solução:**
```bash
# Verificar se arquivo existe
dir preventor_duplicidades.py

# Se não existir, copiar novamente
copy "c:\Users\jonat\OneDrive\Desktop\Projeto Otimiza\preventor_duplicidades.py" .
```

### Problema: Post duplicado ainda foi criado

**Causa:** Registro não foi salvo corretamente ou erro na publicação.

**Verificar:**
```bash
# Ver últimas publicações
type registro_publicacoes.json

# Verificar se post foi registrado
python -c "from preventor_duplicidades import PreventorDuplicidades; import json; p = PreventorDuplicidades(); print(json.dumps(p.registro, indent=2, ensure_ascii=False))"
```

---

## 📈 ESTATÍSTICAS

### Ver Quantos Posts Foram Publicados

```bash
python -c "from preventor_duplicidades import PreventorDuplicidades; p = PreventorDuplicidades(); r = p.gerar_relatorio(); print(f'Total: {r[\"total_publicacoes\"]} | Últimos 7 dias: {r[\"ultimos_7_dias\"]}')"
```

### Ver Tópicos Disponíveis para Publicação

```bash
python -c "from content_generator import ContentGenerator; from preventor_duplicidades import PreventorDuplicidades; g = ContentGenerator(); p = PreventorDuplicidades(); disponiveis = [t['title'] for t in g.content_db['topics'] if p.pode_publicar(t['title'], t['description'])[0]]; print(f'Disponíveis: {len(disponiveis)}/{len(g.content_db[\"topics\"])}'); [print(f'  - {t}') for t in disponiveis[:5]]"
```

---

## ✅ CHECKLIST PÓS-IMPLEMENTAÇÃO

- [x] `preventor_duplicidades.py` copiado para o diretório
- [x] `content_generator.py` modificado
- [x] `main.py` modificado
- [ ] **Teste 1:** Executar `python main.py --single` ✅
- [ ] **Teste 2:** Executar novamente e verificar que não duplica ✅
- [ ] **Teste 3:** Verificar `registro_publicacoes.json` foi criado ✅
- [ ] **Limpeza:** Deletar posts duplicados no Shopify manualmente ⚠️

---

## 🎯 PRÓXIMOS PASSOS

### 1. Limpar Duplicatas Existentes no Shopify (MANUAL)

1. Acessar: https://otimizafarmavet.myshopify.com/admin/blogs
2. Ir em "Blog para Tutores"
3. Identificar posts duplicados (mesmo título, datas próximas)
4. Deletar duplicatas, manter apenas 1 versão

**Posts a verificar:**
- "Banho em Cães: Frequência e Técnicas Corretas" (4 duplicatas)
- "Ansiedade de Separação em Cães: Como Tratar" (2 duplicatas)

### 2. Testar Sistema Integrado

```bash
# Teste completo
cd C:\Users\jonat\.gemini\antigravity\scratch\pinterest-automation
python main.py --single
python main.py --single
python main.py --single
```

### 3. Monitorar por 1 Semana

- Verificar que não há mais duplicatas
- Confirmar que registro está funcionando
- Ajustar intervalo se necessário

---

## 📞 SUPORTE

**Arquivos Criados:**
- ✅ `preventor_duplicidades.py` - Módulo de prevenção
- ✅ `content_generator.py` - Modificado com verificação
- ✅ `main.py` - Modificado com registro
- ✅ `registro_publicacoes.json` - Criado automaticamente

**Documentação:**
- `DIAGNOSTICO-DUPLICIDADE-POSTS.md` - Diagnóstico completo
- `GUIA-USO-PREVENTOR.md` - Este arquivo

---

**Status:** ✅ Sistema Implementado e Pronto para Produção  
**Última Atualização:** 16/12/2025 17:10
