# 🎯 CONTENÇÃO: Coerência Blog vs Imagem

**Data:** 16 de dezembro de 2025  
**Sistema:** Pinterest Automation + Shopify Blog  
**Objetivo:** Garantir que imagens geradas sejam COERENTES com o conteúdo do blog

---

## ✅ PROBLEMA IDENTIFICADO

### Situação Atual:
O sistema gera imagens baseadas em prompts, mas **NÃO valida se a imagem é coerente** com o tema do blog post.

**Exemplos de Incoerência:**
```
❌ Post sobre "Banho em Cães" → Imagem de gato comendo
❌ Post sobre "Vacinação" → Imagem de pet brincando no parque
❌ Post sobre "Nutrição" → Imagem de consulta veterinária
```

**Impacto:**
- ❌ Confusão do leitor (imagem não relacionada ao conteúdo)
- ❌ Baixo engajamento no Pinterest
- ❌ Perda de credibilidade profissional
- ❌ Possível rejeição de pins pelo Pinterest

---

## 🛠️ SOLUÇÃO IMPLEMENTADA

### **Validador de Coerência** (`validador_coerencia.py`)

Sistema inteligente que valida 3 aspectos:

#### 1. **Categoria vs Elementos Visuais**
Cada categoria tem elementos visuais obrigatórios:

| Categoria | Elementos Obrigatórios | Animal Esperado | Estilo |
|-----------|------------------------|-----------------|--------|
| **Saúde Preventiva** | veterinário, clínica, exame, vacina | cão/gato em consulta | profissional, médico |
| **Nutrição** | ração, alimento, tigela, comida | pet comendo | natural, saudável |
| **Higiene** | banho, escova, limpeza | pet sendo banhado | limpo, refrescante |
| **Comportamento** | treinamento, interação | pet ativo | dinâmico, alegre |
| **Primeiros Socorros** | emergência, kit, socorro | pet sendo socorrido | urgente, profissional |

#### 2. **Título vs Palavras-Chave Críticas**
Palavras no título que DEVEM aparecer no prompt:

```python
"vacinação" → ["vacina", "veterinário", "seringa"]
"banho" → ["água", "shampoo", "banheira", "molhado"]
"alimentação" → ["comida", "ração", "tigela"]
"filhote" → ["filhote", "jovem", "pequeno"]
"idoso" → ["idoso", "senior", "grisalho"]
```

#### 3. **Score de Coerência**
- **Score Geral:** 0.0 a 1.0
- **Fórmula:** (Categoria 60%) + (Título 40%)
- **Limiar de Aprovação:** ≥ 0.5

---

## 📋 COMO USAR

### **Integração com `image_creator.py`**

```python
from validador_coerencia import ValidadorCoerencia

class ImageCreator:
    def __init__(self):
        # ... código existente ...
        self.validador = ValidadorCoerencia()
    
    def create_pin_image(self, title, subtitle, output_path, category="Geral"):
        # 1. Criar prompt
        prompt = self._create_optimized_prompt(title, subtitle, category)
        
        # 2. VALIDAR COERÊNCIA ANTES DE GERAR
        aprovado, mensagem, relatorio = self.validador.validar_coerencia_completa(
            titulo=title,
            categoria=category,
            descricao=subtitle,
            prompt_imagem=prompt
        )
        
        print(f"\n🔍 Validação de Coerência:")
        print(mensagem)
        
        if not aprovado:
            # 3. SUGERIR MELHORIAS
            sugestoes = self.validador.sugerir_melhorias_prompt(
                title, category, prompt
            )
            print(f"\n💡 Sugestões de Melhoria:")
            print(sugestoes)
            
            # 4. OPÇÃO: Regenerar prompt ou abortar
            raise ValueError(f"Prompt incoerente! Score: {relatorio['score_geral']:.2f}")
        
        # 5. Gerar imagem (apenas se aprovado)
        # ... código de geração ...
```

### **Uso Standalone (Teste)**

```python
from validador_coerencia import ValidadorCoerencia

validador = ValidadorCoerencia()

# Validar antes de gerar
aprovado, msg, relatorio = validador.validar_coerencia_completa(
    titulo="Banho em Cães: Frequência e Técnicas Corretas",
    categoria="Higiene",
    descricao="Como dar banho sem estressar",
    prompt_imagem="Cachorro golden retriever sendo banhado em banheira, água morna, shampoo pet, ambiente limpo"
)

print(msg)
if aprovado:
    print("✅ Pode gerar a imagem!")
else:
    print("❌ Melhorar o prompt primeiro!")
```

---

## 🎯 EXEMPLOS DE VALIDAÇÃO

### ✅ **EXEMPLO 1: APROVADO**

**Conteúdo:**
- Título: "Vacinação de Cães e Gatos: Guia Completo"
- Categoria: Saúde Preventiva

**Prompt:**
```
"Veterinário aplicando vacina em cachorro golden retriever em clínica moderna, 
ambiente profissional, iluminação natural, fotografia editorial"
```

**Resultado:**
```
✅ COERÊNCIA VALIDADA (score: 0.85)
   ✅ Coerência OK (score: 0.90) - Categoria
   ✅ Palavras-chave OK (score: 0.75) - Título
```

---

### ❌ **EXEMPLO 2: REPROVADO**

**Conteúdo:**
- Título: "Banho em Cães: Frequência e Técnicas Corretas"
- Categoria: Higiene

**Prompt:**
```
"Gato comendo ração em tigela vermelha na cozinha"
```

**Resultado:**
```
❌ COERÊNCIA INSUFICIENTE (score: 0.15)
   ❌ Baixa coerência (score: 0.10)
      Categoria: Higiene
      Elementos faltantes: banho, escova, limpeza
      ⚠️ Nenhum animal identificado no prompt
   ❌ Palavras-chave insuficientes (score: 0.25)
      Título: Banho em Cães: Frequência e Técnicas Corretas
      Faltam: água, shampoo, banheira, molhado

🔧 AÇÃO NECESSÁRIA: Regenerar prompt da imagem
```

**Sugestões:**
```
📋 Categoria 'Higiene':
   • Estilo: limpo, refrescante, cuidadoso
   • Incluir: banho, escova, limpeza
   • Animal: cão sendo banhado
   • Cores: azul água, branco, tons pastéis

🔑 Palavras-chave do título:
   • Incluir: água, shampoo, banheira, molhado
```

---

## 🔧 INTEGRAÇÃO COMPLETA

### **FASE 1: Modificar `image_creator.py`**

```python
# Adicionar no início do arquivo
from validador_coerencia import ValidadorCoerencia

class ImageCreator:
    def __init__(self):
        # ... código existente ...
        self.validador = ValidadorCoerencia()  # NOVO
    
    def create_pin_image(self, title, subtitle, output_path, category="Geral"):
        """Cria imagem COM validação de coerência"""
        
        # Criar prompt otimizado
        prompt = self._create_optimized_prompt(title, subtitle, category)
        
        # VALIDAR COERÊNCIA
        max_tentativas = 3
        for tentativa in range(max_tentativas):
            aprovado, mensagem, relatorio = self.validador.validar_coerencia_completa(
                titulo=title,
                categoria=category,
                descricao=subtitle,
                prompt_imagem=prompt
            )
            
            print(f"\n🔍 Validação {tentativa + 1}/{max_tentativas}:")
            print(mensagem)
            
            if aprovado:
                break
            else:
                # Tentar melhorar o prompt
                if tentativa < max_tentativas - 1:
                    print("\n🔄 Regenerando prompt...")
                    # Aqui você pode implementar lógica para melhorar o prompt
                    # baseado nas sugestões do validador
        
        if not aprovado:
            raise ValueError(f"Não foi possível gerar prompt coerente após {max_tentativas} tentativas")
        
        # Gerar imagem (código existente)
        # ...
```

### **FASE 2: Modificar `content_generator.py`**

```python
# Passar categoria para o image_creator
def generate_pin_content(self):
    # ... código existente ...
    
    # Adicionar categoria ao retorno
    return {
        'title': content['title'],
        'subtitle': content['subtitle'],
        'description': rich_content,
        'category': content['category'],  # IMPORTANTE!
        'hashtags': content['hashtags'],
        'keywords': content['keywords']
    }
```

### **FASE 3: Modificar `main.py`**

```python
# Passar categoria para create_pin_image
image_path = self.image_creator.create_pin_image(
    content['title'],
    content['subtitle'],
    image_filename,
    category=content['category']  # NOVO
)
```

---

## 📊 MÉTRICAS DE QUALIDADE

### **Score de Coerência**

| Score | Classificação | Ação |
|-------|---------------|------|
| 0.8 - 1.0 | 🟢 Excelente | Publicar imediatamente |
| 0.6 - 0.79 | 🟡 Bom | Publicar (revisar manualmente) |
| 0.5 - 0.59 | 🟠 Aceitável | Melhorar prompt |
| < 0.5 | 🔴 Insuficiente | Regenerar obrigatório |

### **Relatório de Validações**

```python
# Gerar relatório após várias validações
print(validador.gerar_relatorio())
```

**Saída:**
```
📊 RELATÓRIO DE VALIDAÇÕES DE COERÊNCIA
==================================================

Total de validações: 10
✅ Aprovados: 8 (80.0%)
❌ Reprovados: 2 (20.0%)
📈 Score médio: 0.72

⚠️ POSTS REPROVADOS:
  • Banho em Cães (score: 0.45)
  • Obesidade em Pets (score: 0.38)
```

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Testar validador
cd "C:\Users\jonat\OneDrive\Desktop\Projeto Otimiza"
python validador_coerencia.py

# Testar com conteúdo real
python -c "from validador_coerencia import ValidadorCoerencia; v = ValidadorCoerencia(); print(v.validar_coerencia_completa('Vacinação de Cães', 'Saúde Preventiva', 'Vacinas essenciais', 'veterinário vacinando cachorro')[1])"
```

---

## 🎯 PRÓXIMOS PASSOS

### 1️⃣ **TESTAR VALIDADOR**
```bash
python validador_coerencia.py
```

### 2️⃣ **INTEGRAR COM IMAGE_CREATOR**
- [ ] Adicionar `ValidadorCoerencia` ao `__init__`
- [ ] Validar prompt antes de gerar imagem
- [ ] Implementar retry com melhorias

### 3️⃣ **INTEGRAR COM CONTENT_GENERATOR**
- [ ] Passar `category` no retorno
- [ ] Garantir que categoria está sempre presente

### 4️⃣ **INTEGRAR COM MAIN.PY**
- [ ] Passar `category` para `create_pin_image`
- [ ] Logar resultados de validação

### 5️⃣ **MONITORAR QUALIDADE**
- [ ] Gerar relatórios periódicos
- [ ] Ajustar limiares se necessário
- [ ] Melhorar mapeamentos de categorias

---

## 📞 ARQUIVOS CRIADOS

1. ✅ `validador_coerencia.py` - Módulo de validação
2. ✅ `DIAGNOSTICO-COERENCIA-BLOG-IMAGEM.md` - Este documento

**Próximos Arquivos:**
- `image_creator.py` (modificado com validação)
- `content_generator.py` (modificado com categoria)
- `main.py` (modificado com categoria)

---

## 🔒 PROTEÇÕES IMPLEMENTADAS

### ✅ Validação de Categoria
- Verifica elementos visuais obrigatórios
- Confirma presença de animais
- Valida estilo e ambiente

### ✅ Validação de Palavras-Chave
- Extrai termos críticos do título
- Verifica presença no prompt
- Score baseado em cobertura

### ✅ Score de Qualidade
- Métrica objetiva (0.0 a 1.0)
- Limiar configurável
- Relatórios detalhados

### ✅ Sugestões Automáticas
- Elementos faltantes
- Cores sugeridas
- Estilo recomendado

---

**Status:** ✅ Validador Criado | ⏳ Aguardando Integração

**Autor:** Sistema de Automação Pinterest  
**Versão:** 1.0  
**Data:** 16/12/2025
