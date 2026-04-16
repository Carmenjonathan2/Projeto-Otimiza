# -*- coding: utf-8 -*-
"""
🎯 VALIDADOR DE COERÊNCIA: Blog vs Imagem
==========================================

Sistema de contenção para garantir que a imagem gerada
seja COERENTE com o tema do blog post.

Versão 2.1 - Multilíngue (PT/EN) e Melhoria de Detecção
Data: 05 de janeiro de 2026
"""

import json
import re
from typing import Dict, Tuple, List
from datetime import datetime
import sys
import io

# Configurar encoding UTF-8 para o console Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class ValidadorCoerencia:
    """
    Valida se a imagem gerada está coerente com o conteúdo do blog.
    
    Verifica:
    - Categoria do conteúdo vs elementos visuais esperados
    - Palavras-chave do título vs prompt da imagem (Suporta PT e EN)
    - Presença de animais corretos
    """
    
    # Mapeamento de categorias para elementos visuais esperados (Bilingue)
    ELEMENTOS_VISUAIS_POR_CATEGORIA = {
        "Saúde Preventiva": {
            "elementos_obrigatorios": [
                "veterinário", "clínica", "exame", "vacina", "prevenção", 
                "veterinarian", "clinic", "exam", "vaccine", "prevention", "medical"
            ],
            "animais": ["cão", "gato", "cachorro", "felino", "canino", "dog", "cat", "puppy", "kitten"],
            "ambiente": ["consultório", "clínica veterinária", "ambiente médico", "veterinary clinic", "medical clinic"],
            "cores_sugeridas": ["branco", "azul claro", "verde menta"],
            "estilo": "profissional, limpo, médico"
        },
        "Nutrição": {
            "elementos_obrigatorios": [
                "ração", "alimento", "tigela", "comida", "nutrição", 
                "food", "bowl", "eating", "nutrition", "meal", "kibble"
            ],
            "animais": ["cão comendo", "gato comendo", "pet alimentando", "dog eating", "cat eating"],
            "ambiente": ["cozinha", "área de alimentação", "tigela", "kitchen", "feeding area"],
            "cores_sugeridas": ["marrom", "bege", "verde natural"],
            "estilo": "natural, saudável, apetitoso"
        },
        "Higiene": {
            "elementos_obrigatorios": [
                "banho", "escova", "limpeza", "higiene", "cuidado", 
                "bath", "brush", "cleaning", "groomed", "grooming", "spa", "shampoo"
            ],
            "animais": ["cão sendo banhado", "gato sendo escovado", "pet limpo", "dog being bathed", "cat being brushed"],
            "ambiente": ["banheira", "salão pet", "ambiente de banho", "bathtub", "grooming salon", "pet spa"],
            "cores_sugeridas": ["azul água", "branco", "tons pastéis"],
            "estilo": "limpo, refrescante, cuidadoso"
        },
        "Comportamento": {
            "elementos_obrigatorios": [
                "treinamento", "interação", "comportamento", "adestramento", 
                "training", "interaction", "behavior", "playing", "play", "active"
            ],
            "animais": ["cão interagindo", "gato brincando", "pet ativo", "dog playing", "cat playing", "kitten playing"],
            "ambiente": ["parque", "casa", "área de treino", "park", "home", "training area"],
            "cores_sugeridas": ["verde", "azul", "tons vibrantes"],
            "estilo": "dinâmico, alegre, interativo"
        },
        "Saúde": {
            "elementos_obrigatorios": [
                "saúde", "cuidado", "tratamento", "bem-estar", 
                "health", "care", "treatment", "wellness", "clinical"
            ],
            "animais": ["pet saudável", "animal sendo examinado", "healthy pet", "being examined"],
            "ambiente": ["clínica", "casa", "ambiente cuidadoso", "clinic", "home"],
            "cores_sugeridas": ["branco", "azul", "verde"],
            "estilo": "profissional, confiável, cuidadoso"
        },
        "Curiosidades": {
            "elementos_obrigatorios": [
                "pet", "animal", "comportamento natural", 
                "natural behavior", "curious", "interesting"
            ],
            "animais": ["cão expressivo", "gato curioso", "pet característico", "expressive dog", "curious cat"],
            "ambiente": ["natural", "casa", "ambiente cotidiano", "daily", "home"],
            "cores_sugeridas": ["cores naturais", "tons quentes"],
            "estilo": "natural, expressivo, interessante"
        },
        "Idosos": {
            "elementos_obrigatorios": [
                "pet idoso", "cuidado senior", "conforto", 
                "senior", "elderly", "old", "comfort", "graying"
            ],
            "animais": ["cão idoso", "gato senior", "pet grisalho", "senior dog", "senior cat", "graying muzzle"],
            "ambiente": ["ambiente confortável", "cama", "área de descanso", "bed", "rest area"],
            "cores_sugeridas": ["tons suaves", "bege", "cinza claro"],
            "estilo": "acolhedor, tranquilo, respeitoso"
        },
        "Primeiros Socorros": {
            "elementos_obrigatorios": [
                "emergência", "socorro", "kit", "primeiros socorros", 
                "emergency", "aid", "first aid", "help"
            ],
            "animais": ["pet sendo socorrido", "animal em cuidado", "animal in care"],
            "ambiente": ["kit médico", "emergência", "atendimento", "first aid kit", "emergency"],
            "cores_sugeridas": ["vermelho", "branco", "azul"],
            "estilo": "urgente, profissional, preparado"
        }
    }
    
    # Palavras-chave que DEVEM aparecer no prompt baseado no título (Suporte Bilingue)
    PALAVRAS_CHAVE_CRITICAS = {
        "vacinação": ["vacina", "veterinário", "seringa", "imunização", "vaccine", "vaccination", "veterinarian"],
        "banho": ["água", "shampoo", "banheira", "molhado", "bath", "water", "wet"],
        "alimentação": ["comida", "ração", "tigela", "alimentar", "food", "eating", "bowl", "kibble"],
        "castração": ["cirurgia", "veterinário", "procedimento", "surgery", "neutered", "spayed"],
        "dental": ["dentes", "escova", "boca", "higiene bucal", "teeth", "dental", "brushing"],
        "filhote": ["filhote", "jovem", "pequeno", "bebê", "puppy", "kitten", "young"],
        "idoso": ["idoso", "senior", "grisalho", "velho", "senior", "elderly", "old"],
        "ansiedade": ["estresse", "ansioso", "comportamento", "anxiety", "anxious", "stress"],
        "pulgas": ["pulga", "carrapato", "parasita", "flea", "tick", "parasite"],
        "engasgo": ["emergência", "socorro", "asfixia", "choking", "choke"]
    }
    
    def __init__(self):
        """Inicializa o validador de coerência."""
        self.historico_validacoes = []
    
    def normalizar_texto(self, texto: str) -> str:
        """Normaliza texto para comparação (lowercase e sem acentos)."""
        if not texto: return ""
        texto = texto.lower()
        texto = re.sub(r'[áàâãä]', 'a', texto)
        texto = re.sub(r'[éèêë]', 'e', texto)
        texto = re.sub(r'[íìîï]', 'i', texto)
        texto = re.sub(r'[óòôõö]', 'o', texto)
        texto = re.sub(r'[úùûü]', 'u', texto)
        texto = re.sub(r'[ç]', 'c', texto)
        # Remover plurais simples para melhorar busca (heurística)
        texto = re.sub(r'oes$', 'ao', texto)
        return texto
    
    def extrair_palavras_chave(self, titulo: str) -> List[str]:
        """Extrai palavras-chave críticas do título mapeadas no dicionário."""
        titulo_norm = self.normalizar_texto(titulo)
        palavras_encontradas = []
        
        for palavra_chave, termos_relacionados in self.PALAVRAS_CHAVE_CRITICAS.items():
            palavra_chave_norm = self.normalizar_texto(palavra_chave)
            if palavra_chave_norm in titulo_norm:
                palavras_encontradas.extend(termos_relacionados)
        
        return palavras_encontradas
    
    def validar_categoria_vs_prompt(
        self, 
        categoria: str, 
        prompt_imagem: str
    ) -> Tuple[bool, str, float]:
        """
        Valida se o prompt da imagem contém elementos visuais
        apropriados para a categoria do conteúdo.
        """
        if categoria not in self.ELEMENTOS_VISUAIS_POR_CATEGORIA:
            return True, f"⚠️ Categoria '{categoria}' não mapeada", 0.5
        
        elementos = self.ELEMENTOS_VISUAIS_POR_CATEGORIA[categoria]
        prompt_norm = self.normalizar_texto(prompt_imagem)
        
        # Verificar elementos obrigatórios (Conceitos)
        palavras_encontradas = []
        for e in elementos["elementos_obrigatorios"]:
            if self.normalizar_texto(e) in prompt_norm:
                palavras_encontradas.append(e)
        
        # Score de elementos: Incentiva encontrar pelo menos 2 a 3 termos da categoria
        score_elementos = min(len(palavras_encontradas) / 2.5, 1.0) 
        
        # Verificar presença de animais (Busca ampla)
        tem_animal = False
        keywords_animais = ["cao", "gato", "cachorro", "pet", "animal", "dog", "cat", "puppy", "kitten", "retriever", "tabby", "beagle", "felino", "canino"]
        
        for kw in keywords_animais:
            if kw in prompt_norm:
                tem_animal = True
                break
        
        score_animal = 1.0 if tem_animal else 0.0
        
        # Score final: 60% elementos + 40% animal
        score_final = (score_elementos * 0.6) + (score_animal * 0.4)
        
        # Limiar de aceitação
        LIMIAR_MINIMO = 0.5
        
        if score_final >= LIMIAR_MINIMO:
            return True, f"✅ Coerência OK (score: {score_final:.2f})", score_final
        else:
            elementos_faltantes = [e for e in elementos["elementos_obrigatorios"][:5] if self.normalizar_texto(e) not in prompt_norm]
            mensagem = f"❌ Baixa coerência (score: {score_final:.2f})\n"
            mensagem += f"   Categoria: {categoria}\n"
            if elementos_faltantes:
                mensagem += f"   Faltam termos como: {', '.join(elementos_faltantes[:3])}\n"
            if not tem_animal:
                mensagem += f"   ⚠️ Nenhum animal identificado no prompt\n"
            
            return False, mensagem, score_final
    
    def validar_titulo_vs_prompt(
        self, 
        titulo: str, 
        prompt_imagem: str
    ) -> Tuple[bool, str, float]:
        """
        Valida se o prompt contém palavras-chave críticas extraídas do título.
        """
        palavras_criticas = self.extrair_palavras_chave(titulo)
        
        if not palavras_criticas:
            # Título não tem palavras-chave críticas mapeadas, aceitar com score base
            return True, "ℹ️ Título sem palavras-chave críticas mapeadas", 0.7
        
        prompt_norm = self.normalizar_texto(prompt_imagem)
        palavras_encontradas = []
        
        for palavra in palavras_criticas:
            palavra_norm = self.normalizar_texto(palavra)
            if palavra_norm in prompt_norm:
                palavras_encontradas.append(palavra)
        
        # Score: proporção de palavras críticas encontradas
        total_palavras = len(palavras_criticas)
        score = len(palavras_encontradas) / total_palavras if total_palavras > 0 else 0
        
        # Limiar baixo (30%) pois títulos variam muito
        LIMIAR_MINIMO = 0.3
        
        if score >= LIMIAR_MINIMO:
            return True, f"✅ Palavras-chave do título OK (score: {score:.2f})", score
        else:
            palavras_faltantes = [p for p in palavras_criticas if self.normalizar_texto(p) not in prompt_norm]
            mensagem = f"❌ Título vs Prompt incoerente (score: {score:.2f})\n"
            mensagem += f"   Título: {titulo}\n"
            mensagem += f"   Sugestão incluir: {', '.join(palavras_faltantes[:3])}"
            return False, mensagem, score
    
    def validar_coerencia_completa(
        self,
        titulo: str,
        categoria: str,
        descricao: str,
        prompt_imagem: str,
        metadata: Dict = None
    ) -> Tuple[bool, str, Dict]:
        """
        Validação completa: Categoria + Título.
        """
        relatorio = {
            "timestamp": datetime.now().isoformat(),
            "titulo": titulo,
            "categoria": categoria,
            "validacoes": {},
            "score_geral": 0.0,
            "aprovado": False
        }
        
        # 1. Categoria vs Prompt
        cat_ok, cat_msg, cat_score = self.validar_categoria_vs_prompt(categoria, prompt_imagem)
        relatorio["validacoes"]["categoria"] = {"aprovado": cat_ok, "mensagem": cat_msg, "score": cat_score}
        
        # 2. Título vs Prompt
        tit_ok, tit_msg, tit_score = self.validar_titulo_vs_prompt(titulo, prompt_imagem)
        relatorio["validacoes"]["titulo"] = {"aprovado": tit_ok, "mensagem": tit_msg, "score": tit_score}
        
        # Score geral: média ponderada (categoria 60%, título 40%)
        score_geral = (cat_score * 0.6) + (tit_score * 0.4)
        relatorio["score_geral"] = score_geral
        
        # Decisão final (Limiar 0.5 + categoria deve passar minimamente)
        aprovado = score_geral >= 0.5 and cat_score > 0.3
        relatorio["aprovado"] = aprovado
        
        # Mensagem final
        if aprovado:
            mensagem = f"✅ COERÊNCIA VALIDADA (score: {score_geral:.2f})\n   {cat_msg}\n   {tit_msg}"
        else:
            mensagem = f"❌ COERÊNCIA INSUFICIENTE (score: {score_geral:.2f})\n   {cat_msg}\n   {tit_msg}"
        
        self.historico_validacoes.append(relatorio)
        return aprovado, mensagem, relatorio


# Teste rápido se executado diretamente
if __name__ == "__main__":
    v = ValidadorCoerencia()
    # Testar prompt em INGLÊS com categoria em PT
    res, msg, rel = v.validar_coerencia_completa(
        "Vacinação de Cães", 
        "Saúde Preventiva", 
        "Vacina", 
        "A professional photograph of a veterinarian vaccinating a golden retriever dog in a modern clinic"
    )
    print(msg)
    print("-" * 50)
    # Testar plurais
    res2, msg2, rel2 = v.validar_coerencia_completa(
        "Banho em Gatos", 
        "Higiene", 
        "Banho", 
        "A cat being bathed in a bathtub with bubbles and shampoo"
    )
    print(msg2)
