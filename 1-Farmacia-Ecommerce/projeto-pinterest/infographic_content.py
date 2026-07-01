# -*- coding: utf-8 -*-
"""
📝 CURATED INFOGRAPHIC CONTENTS FOR OTIMIZA FARMAVET
Contains hand-crafted high-impact infographics and dynamic fallback generators.
"""

import re

# Curated infographics for top pet care topics
CURATED_INFOGRAPHICS = {
    "Alimentos Tóxicos para Cães e Gatos": {
        "title": "ALIMENTOS PROIBIDOS",
        "subtitle": "O que seu pet NUNCA deve comer",
        "items": [
            {"icon": "danger", "label": "Chocolate", "description": "Contém teobromina, que ataca o coração e o sistema nervoso do pet."},
            {"icon": "danger", "label": "Uvas e Passas", "description": "Mesmo em doses mínimas, podem causar falência renal aguda grave."},
            {"icon": "danger", "label": "Cebola e Alho", "description": "Contêm substâncias que destroem glóbulos vermelhos, causando anemia."}
        ]
    },
    "Vacinação de Cães e Gatos: Guia Completo": {
        "title": "VACINAS ESSENCIAIS",
        "subtitle": "Proteção vital para a saúde do seu pet",
        "items": [
            {"icon": "check", "label": "V8 / V10 (Cães)", "description": "Protege contra cinomose, parvovirose, hepatite e leptospirose."},
            {"icon": "check", "label": "V4 / V5 (Gatos)", "description": "Protege contra panleucopenia, calicivirose e clamidiose felina."},
            {"icon": "check", "label": "Antirrábica", "description": "Obrigatória por lei, previne a Raiva (doença 100% letal e transmissível)."}
        ]
    },
    "Ansiedade de Separação em Cães: Como Tratar": {
        "title": "PET SOZINHO E CALMO",
        "subtitle": "Dicas para acalmar seu cão quando sair",
        "items": [
            {"icon": "tip", "label": "Gasto de Energia", "description": "Faça um passeio produtivo antes de sair para que o pet descanse."},
            {"icon": "tip", "label": "Brinquedos Recheáveis", "description": "Ofereça brinquedos com petiscos congelados para mantê-lo ocupado."},
            {"icon": "tip", "label": "Sem Despedidas Longas", "description": "Saia de forma neutra. Despedidas longas aumentam a ansiedade."}
        ]
    },
    "Higiene Dental em Cães e Gatos": {
        "title": "HIGIENE BUCAL PET",
        "subtitle": "Dentes limpos e hálito fresco sempre",
        "items": [
            {"icon": "check", "label": "Escovação Regular", "description": "Use escova macia e pasta específica para pets (nunca de humanos)."},
            {"icon": "tip", "label": "Brinquedos Mastigáveis", "description": "Ajudam a raspar mecanicamente o tártaro de forma leve."},
            {"icon": "danger", "label": "Atenção ao Hálito", "description": "Cheiro forte e gengiva vermelha indicam infecção bacteriana."}
        ]
    },
    "Vermifugação: Quando e Como Vermifugar seu Pet": {
        "title": "VERMIFUGAÇÃO ATIVA",
        "subtitle": "Proteção contra vermes e parasitas",
        "items": [
            {"icon": "check", "label": "Filhotes", "description": "Iniciar vermifugação nas primeiras semanas de vida (consulte dose)."},
            {"icon": "check", "label": "Adultos", "description": "Repetir a dose preventiva de 3 em 3 meses, dependendo do estilo de vida."},
            {"icon": "tip", "label": "Proteção Familiar", "description": "Evita que vermes de pets sejam transmitidos para a família."}
        ]
    },
    "Castração de Cães e Gatos: Benefícios e Cuidados": {
        "title": "BENEFÍCIOS DA CASTRAÇÃO",
        "subtitle": "Saúde, comportamento e prevenção",
        "items": [
            {"icon": "check", "label": "Previne Câncer", "description": "Evita tumor de mama em fêmeas e problemas de próstata em machos."},
            {"icon": "tip", "label": "Melhora Comportamento", "description": "Reduz marcação de território e fugas associadas ao cio."},
            {"icon": "info", "label": "Pós-Operatório", "description": "Exige repouso, colar elizabetano e medicação indicada pelo veterinário."}
        ]
    },
    "Cuidado com o Calor: Como Proteger seu Pet no Verão": {
        "title": "PET SEGURO NO CALOR",
        "subtitle": "Proteja seu amigo da hipertermia",
        "items": [
            {"icon": "danger", "label": "Atenção às Patas", "description": "Não passeie no asfalto quente. Se estiver quente para sua mão, está para o pet."},
            {"icon": "check", "label": "Hidratação Constante", "description": "Deixe água fresca disponível e use cubos de gelo para refrescar."},
            {"icon": "danger", "label": "Choque Térmico", "description": "Nunca deixe o pet preso dentro do carro, mesmo com janelas abertas."}
        ]
    },
    "Cuidado com as Orelhas: Prevenindo a Otite em Cães": {
        "title": "PREVENÇÃO DE OTITE",
        "subtitle": "Mantenha os ouvidos do pet secos e limpos",
        "items": [
            {"icon": "tip", "label": "Proteção no Banho", "description": "Use algodão impermeável para evitar entrada de água no canal auditivo."},
            {"icon": "check", "label": "Limpeza Semanal", "description": "Use solução otológica indicada e limpe apenas a área externa visível."},
            {"icon": "danger", "label": "Sinais de Alerta", "description": "Coceira na cabeça, odor forte e chacoalhar de cabeça indicam dor."}
        ]
    },
    "Verme do Coração (Dirofilariose): O Inimigo Silencioso": {
        "title": "VERME DO CORAÇÃO",
        "subtitle": "Dirofilariose é grave, mas tem prevenção",
        "items": [
            {"icon": "info", "label": "Transmissão", "description": "Transmitido por mosquitos infectados, comum em regiões de praia/lagos."},
            {"icon": "danger", "label": "Sintomas Graves", "description": "Causa tosse, cansaço extremo, perda de peso e insuficiência cardíaca."},
            {"icon": "check", "label": "Prevenção", "description": "Uso regular de vermífugos mensais ou aplicação anual de preventivo."}
        ]
    },
    "Linguagem Corporal dos Cães: Entenda seu Pet": {
        "title": "LINGUAGEM DOS CÃES",
        "subtitle": "O que seu cão está te dizendo?",
        "items": [
            {"icon": "info", "label": "Rabo Abanando", "description": "Pode significar alegria, mas também ansiedade ou estado de alerta."},
            {"icon": "info", "label": "Lamber os Beiços", "description": "Quando não há comida por perto, indica desconforto, stress ou submissão."},
            {"icon": "tip", "label": "Bocejo Frequente", "description": "Se o cão boceja em situações sociais, é uma forma de tentar se acalmar."}
        ]
    },
    "Coprofagia em Cães: Por Que Eles Comem Fezes?": {
        "title": "CÃO COMENDO FEZES?",
        "subtitle": "Entenda as causas da Coprofagia",
        "items": [
            {"icon": "info", "label": "Causas Médicas", "description": "Pode indicar deficiência de nutrientes, vermes ou má digestão da ração."},
            {"icon": "info", "label": "Fatores Comportamentais", "description": "Ansiedade, tédio ou medo de broncas pós-sujeira causam o hábito."},
            {"icon": "tip", "label": "Como Tratar", "description": "Melhore a qualidade da ração, use brinquedos e remova as fezes rápido."}
        ]
    },
    "Plantas Tóxicas para Pets: O Que Evitar Ter em Casa": {
        "title": "PLANTAS TÓXICAS PET",
        "subtitle": "Plantas comuns perigosas para cães e gatos",
        "items": [
            {"icon": "danger", "label": "Comigo-Ninguém-Pode", "description": "Causa queimação grave na boca, inchaço da língua e asfixia."},
            {"icon": "danger", "label": "Espada-de-São-Jorge", "description": "Contém substâncias irritantes que causam salivação e vômito."},
            {"icon": "danger", "label": "Lírio (Gatos)", "description": "Extremamente tóxico para felinos, pode causar falência renal rápida."}
        ]
    },
    "O Perigo do Chocolate: Por que é um Veneno para Cães": {
        "title": "PERIGO DO CHOCOLATE",
        "subtitle": "Por que chocolate faz mal para cães?",
        "items": [
            {"icon": "info", "label": "Teobromina", "description": "O cão não consegue digerir essa substância química do cacau."},
            {"icon": "danger", "label": "Chocolate Amargo", "description": "Quanto mais escuro o chocolate, maior o teor de teobromina e toxidade."},
            {"icon": "danger", "label": "Sintomas", "description": "Vômitos, tremores, convulsões e, em casos graves, parada cardíaca."}
        ]
    },
    "Sinais de Dor em Gatos: Identificação Sutil": {
        "title": "GATO SENTINDO DOR?",
        "subtitle": "Aprenda a decifrar os sinais do felino",
        "items": [
            {"icon": "danger", "label": "Isolamento Incomum", "description": "Gatos com dor tendem a se esconder em locais escuros e baixos."},
            {"icon": "danger", "label": "Falta de Higiene", "description": "Parar de se lamber ou lamber fixamente apenas um ponto com dor."},
            {"icon": "info", "label": "Expressão Facial", "description": "Olhos semicerrados, orelhas abertas para o lado e bigodes caídos."}
        ]
    },
    "Guia de Cuidados: Porquinhos-da-Índia felizes": {
        "title": "PORQUINHOS-DA-ÍNDIA",
        "subtitle": "Cuidados essenciais para roedores felizes",
        "items": [
            {"icon": "check", "label": "Vitamina C", "description": "Eles não produzem. Ofereça pimentão ou suplemento diariamente."},
            {"icon": "check", "label": "Feno Ilimitado", "description": "Essencial para o desgaste dos dentes e bom funcionamento intestinal."},
            {"icon": "info", "label": "Espaço Amplo", "description": "Gaiolas comuns são pequenas. Eles precisam de cercados para se exercitar."}
        ]
    }
}

def clean_sentence(text: str) -> str:
    """Limpa e formata a sentença."""
    text = text.strip()
    # Remover hashtags ou termos soltos no fim
    text = re.sub(r'#\w+', '', text).strip()
    return text

def get_infographic_data(topic_dict: dict) -> dict:
    """
    Retorna os dados do infográfico estruturados baseados no dicionário do tema.
    Usa o mapeamento curado ou gera dinamicamente a partir da descrição.
    """
    title = topic_dict.get("title", "Dicas de Saúde Pet")
    category = topic_dict.get("category", "Geral").upper()
    
    # 1. Se estiver no banco curado
    if title in CURATED_INFOGRAPHICS:
        data = CURATED_INFOGRAPHICS[title].copy()
        data["category"] = category
        data["cta_text"] = "Dúvidas? Chame no WhatsApp!"
        return data
        
    # 2. Geração dinâmica baseada na descrição (Fallback Inteligente)
    desc = topic_dict.get("description", "")
    
    # Quebrar por pontos finais
    sentences = [clean_sentence(s) for s in re.split(r'\.|\!|\?', desc) if s.strip()]
    
    # Garantir que temos 3 itens
    items = []
    default_labels = ["Prevenção", "Fique Atento", "Dica de Saúde"]
    
    for idx in range(3):
        if idx < len(sentences):
            text_body = sentences[idx]
        else:
            text_body = "Consulte sempre o veterinário para cuidados personalizados."
            
        # Tentar extrair uma primeira palavra de destaque como label
        words = text_body.split(' ')
        label = default_labels[idx]
        if len(words) > 1 and len(words[0]) > 3:
            # Pegar a primeira palavra e torná-la label curta (limitar tamanho)
            label = words[0].replace(',', '').replace(':', '').capitalize()
            # Se a palavra for muito curta, pega duas
            if len(label) <= 4 and len(words) > 2:
                label = f"{label} {words[1].replace(',', '')}"
                
        # Limitar label a 20 chars
        label = label[:20].strip()
        
        # O resto é a descrição
        description = text_body
        
        # Determinar ícone com base no conteúdo
        icon = "check"
        lowered_desc = description.lower()
        if any(w in lowered_desc for w in ["perigo", "evite", "tóxico", "nunca", "proibido", "risco", "emergência", "doença"]):
            icon = "danger"
        elif any(w in lowered_desc for w in ["dica", "aprenda", "descubra", "como", "tente", "sugestão"]):
            icon = "tip"
            
        items.append({
            "icon": icon,
            "label": label,
            "description": description
        })
        
    # Simplificar o título se ele for muito longo
    title_infog = title.split(':')[0].split('(')[0].strip().upper()
    if len(title_infog) > 24:
        title_infog = title_infog[:22] + "..."
        
    subtitle = topic_dict.get("subtitle", "Conselhos Otimiza FarmaVet")
    
    return {
        "title": title_infog,
        "subtitle": subtitle,
        "category": category,
        "items": items,
        "cta_text": "Dúvidas? Chame no WhatsApp!"
    }
