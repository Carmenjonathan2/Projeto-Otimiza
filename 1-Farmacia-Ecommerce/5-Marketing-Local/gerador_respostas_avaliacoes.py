# -*- coding: utf-8 -*-
"""
⭐ GERADOR DE RESPOSTAS PARA AVALIAÇÕES - GOOGLE MEU NEGÓCIO
=============================================================

Sistema inteligente para responder avaliações de forma
personalizada e estratégica.

Autor: Sistema de Automação Otimiza FarmaVet
Data: 16 de dezembro de 2025
"""

import json
import random
from datetime import datetime
from typing import Dict, List
import re
import sys
import io

# Configurar encoding UTF-8 para o console Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class GeradorRespostasAvaliacoes:
    """
    Gera respostas personalizadas para avaliações do Google Meu Negócio
    baseado na nota, sentimento e contexto.
    """
    
    # Templates de resposta por nota
    TEMPLATES_5_ESTRELAS = [
        "Olá {nome}! 🌟\n\nFicamos muito felizes que você e o {pet} tiveram uma ótima experiência conosco! {elogio_especifico}\n\nNosso time trabalha com amor e dedicação para cuidar dos pets de BH. Conte sempre conosco para o que precisar!\n\n🐾 Equipe Otimiza FarmaVet",
        
        "{nome}, que alegria receber seu feedback! 💙\n\n{elogio_especifico} É exatamente esse cuidado que buscamos oferecer a cada cliente.\n\nO {pet} sempre será bem-vindo aqui! Obrigado pela confiança!\n\n🩺 Equipe Otimiza FarmaVet",
        
        "Muito obrigado, {nome}! ⭐\n\nSua avaliação nos motiva a continuar oferecendo o melhor para você e o {pet}. {elogio_especifico}\n\nEstamos sempre à disposição no WhatsApp 24/7!\n\n❤️ Equipe Otimiza FarmaVet"
    ]
    
    TEMPLATES_4_ESTRELAS = [
        "Oi {nome}! 😊\n\nObrigado pelo seu feedback! {reconhecimento}\n\nEstamos sempre buscando melhorar. O que podemos fazer para transformar sua próxima experiência em 5 estrelas?\n\nMande um WhatsApp: {whatsapp}\n\n🐾 Equipe Otimiza FarmaVet",
        
        "{nome}, agradecemos sua avaliação! 💙\n\n{reconhecimento} Queremos sempre oferecer o melhor para você e o {pet}.\n\nTem alguma sugestão de melhoria? Adoraríamos ouvir!\n\n📱 WhatsApp: {whatsapp}\n\nAbraços, Equipe Otimiza",
        
        "Olá {nome}! ⭐\n\nQue bom que gostou! {reconhecimento}\n\nSua opinião é muito importante. Se tiver qualquer sugestão, estamos de portas abertas!\n\n💬 Fale conosco: {whatsapp}\n\nEquipe Otimiza FarmaVet"
    ]
    
    TEMPLATES_3_ESTRELAS = [
        "{nome}, obrigado pelo feedback sincero. 🙏\n\n{pedido_desculpas} Isso não representa nosso padrão de atendimento.\n\nPodemos conversar para entender melhor o que aconteceu? Nossa gerente {gerente} quer falar com você.\n\n📞 Ligue: {telefone}\n💬 WhatsApp: {whatsapp}\n\nVamos resolver isso!\n\nDr. {diretor} - Diretor Otimiza FarmaVet",
        
        "Olá {nome}, 😔\n\n{pedido_desculpas} Levamos seu feedback muito a sério.\n\nQueremos a chance de melhorar sua experiência. Pode nos dar essa oportunidade?\n\n📱 Entre em contato: {whatsapp}\n\nContamos com você!\n\nEquipe Otimiza FarmaVet"
    ]
    
    TEMPLATES_1_2_ESTRELAS = [
        "{nome}, sentimos MUITO pela experiência ruim. 😔\n\n{pedido_desculpas_enfatico}\n\nIsso é inaceitável e não representa quem somos. Nossa gerente {gerente} precisa conversar com você HOJE.\n\n🚨 URGENTE:\n📞 Ligue AGORA: {telefone}\n💬 WhatsApp: {whatsapp}\n\nVamos resolver isso imediatamente!\n\nDr. {diretor} - Diretor Otimiza FarmaVet",
        
        "{nome}, estamos chocados com o que aconteceu. 😢\n\n{pedido_desculpas_enfatico}\n\nPor favor, nos dê a chance de corrigir isso. Você merece muito mais!\n\n📱 Ligue agora: {telefone}\n💬 WhatsApp: {whatsapp}\n\nEstamos aguardando seu contato.\n\nDr. {diretor} - Diretor Otimiza FarmaVet"
    ]
    
    # Frases de reconhecimento específico
    ELOGIOS_ESPECIFICOS = {
        "atendimento": [
            "Nossa equipe fica muito feliz em saber que o atendimento foi excepcional!",
            "É maravilhoso saber que nosso time fez a diferença!",
            "Atendimento humanizado é nossa prioridade!"
        ],
        "rapidez": [
            "Agilidade é nosso compromisso com você!",
            "Sabemos que quando se trata de pets, tempo é essencial!",
            "Entrega rápida salva vidas!"
        ],
        "produto": [
            "Trabalhamos apenas com produtos certificados e de qualidade!",
            "Seu pet merece o melhor, e é isso que oferecemos!",
            "Qualidade é inegociável para nós!"
        ],
        "preco": [
            "Preço justo com qualidade premium é possível!",
            "Buscamos sempre o melhor custo-benefício para você!",
            "Seu bolso e seu pet agradecem!"
        ],
        "veterinario": [
            "Nossa equipe veterinária está sempre pronta para ajudar!",
            "Orientação profissional faz toda a diferença!",
            "Veterinários de verdade, cuidado de verdade!"
        ]
    }
    
    RECONHECIMENTOS = [
        "Ficamos felizes que gostou da experiência!",
        "É ótimo saber que conseguimos ajudar!",
        "Sua satisfação é nossa maior recompensa!",
        "Obrigado por escolher a Otimiza!"
    ]
    
    PEDIDOS_DESCULPAS = [
        "Lamentamos que sua experiência não tenha sido perfeita.",
        "Sentimos muito pelo inconveniente.",
        "Isso não deveria ter acontecido.",
        "Pedimos sinceras desculpas."
    ]
    
    PEDIDOS_DESCULPAS_ENFATICOS = [
        "Estamos profundamente arrependidos pelo que aconteceu.",
        "Isso é completamente inaceitável e vamos corrigir AGORA.",
        "Falhamos com você e com seu pet. Isso não pode acontecer.",
        "Não há desculpas para o que você passou."
    ]
    
    def __init__(
        self, 
        whatsapp: str = "31999999999",
        telefone: str = "(31) 3333-4444",
        gerente: str = "Carla Silva",
        diretor: str = "João Santos"
    ):
        """Inicializa o gerador de respostas."""
        self.whatsapp = whatsapp
        self.telefone = telefone
        self.gerente = gerente
        self.diretor = diretor
        self.historico_respostas = []
    
    def extrair_nome(self, texto_avaliacao: str) -> str:
        """Tenta extrair o nome do cliente da avaliação."""
        # Procurar por padrões como "Sou a Maria", "Meu nome é João", etc.
        padroes = [
            r"[Ss]ou (?:a |o )?([A-Z][a-zá-ú]+)",
            r"[Mm]eu nome é ([A-Z][a-zá-ú]+)",
            r"[Cc]hamo ([A-Z][a-zá-ú]+)"
        ]
        
        for padrao in padroes:
            match = re.search(padrao, texto_avaliacao)
            if match:
                return match.group(1)
        
        return None
    
    def extrair_nome_pet(self, texto_avaliacao: str) -> str:
        """Tenta extrair o nome do pet da avaliação."""
        # Procurar por padrões como "meu cachorro Thor", "minha gata Mel", etc.
        padroes = [
            r"(?:meu|minha) (?:cachorro|cachorra|cão|cadela|gato|gata|pet) ([A-Z][a-zá-ú]+)",
            r"(?:o|a) ([A-Z][a-zá-ú]+) (?:está|ficou|é meu)",
            r"nome (?:dele|dela) é ([A-Z][a-zá-ú]+)"
        ]
        
        for padrao in padroes:
            match = re.search(padrao, texto_avaliacao)
            if match:
                return match.group(1)
        
        return None
    
    def detectar_contexto(self, texto_avaliacao: str) -> List[str]:
        """Detecta o contexto da avaliação (atendimento, rapidez, etc)."""
        texto_lower = texto_avaliacao.lower()
        contextos = []
        
        palavras_chave = {
            "atendimento": ["atendimento", "atendente", "educado", "simpático", "gentil", "atencioso"],
            "rapidez": ["rápido", "rápida", "agilidade", "entrega", "urgente", "emergência"],
            "produto": ["produto", "medicamento", "remédio", "ração", "qualidade"],
            "preco": ["preço", "barato", "caro", "valor", "desconto", "economia"],
            "veterinario": ["veterinário", "vet", "orientação", "ajuda", "explicou"]
        }
        
        for contexto, palavras in palavras_chave.items():
            if any(palavra in texto_lower for palavra in palavras):
                contextos.append(contexto)
        
        return contextos if contextos else ["geral"]
    
    def gerar_resposta(
        self,
        nota: int,
        texto_avaliacao: str,
        nome_avaliador: str = None,
        nome_pet_informado: str = None
    ) -> Dict:
        """
        Gera resposta personalizada para uma avaliação.
        
        Args:
            nota: Nota de 1 a 5 estrelas
            texto_avaliacao: Texto da avaliação do cliente
            nome_avaliador: Nome do avaliador (opcional)
            nome_pet_informado: Nome do pet (opcional)
        
        Returns:
            Dicionário com a resposta e metadados
        """
        # Extrair informações
        nome = nome_avaliador or self.extrair_nome(texto_avaliacao) or "Cliente"
        pet = nome_pet_informado or self.extrair_nome_pet(texto_avaliacao) or "seu pet"
        contextos = self.detectar_contexto(texto_avaliacao)
        
        # Selecionar template baseado na nota
        if nota == 5:
            template = random.choice(self.TEMPLATES_5_ESTRELAS)
            elogio = self._gerar_elogio_especifico(contextos)
            resposta = template.format(
                nome=nome,
                pet=pet,
                elogio_especifico=elogio
            )
            tom = "muito positivo"
            
        elif nota == 4:
            template = random.choice(self.TEMPLATES_4_ESTRELAS)
            reconhecimento = random.choice(self.RECONHECIMENTOS)
            resposta = template.format(
                nome=nome,
                pet=pet,
                reconhecimento=reconhecimento,
                whatsapp=self.whatsapp
            )
            tom = "positivo com abertura"
            
        elif nota == 3:
            template = random.choice(self.TEMPLATES_3_ESTRELAS)
            pedido_desculpas = random.choice(self.PEDIDOS_DESCULPAS)
            resposta = template.format(
                nome=nome,
                pedido_desculpas=pedido_desculpas,
                gerente=self.gerente,
                telefone=self.telefone,
                whatsapp=self.whatsapp,
                diretor=self.diretor
            )
            tom = "preocupado e proativo"
            
        else:  # 1 ou 2 estrelas
            template = random.choice(self.TEMPLATES_1_2_ESTRELAS)
            pedido_desculpas = random.choice(self.PEDIDOS_DESCULPAS_ENFATICOS)
            resposta = template.format(
                nome=nome,
                pedido_desculpas_enfatico=pedido_desculpas,
                gerente=self.gerente,
                telefone=self.telefone,
                whatsapp=self.whatsapp,
                diretor=self.diretor
            )
            tom = "urgente e comprometido"
        
        # Criar registro
        registro = {
            "timestamp": datetime.now().isoformat(),
            "nota": nota,
            "avaliacao_original": texto_avaliacao,
            "resposta_gerada": resposta,
            "nome_cliente": nome,
            "nome_pet": pet,
            "contextos_detectados": contextos,
            "tom": tom,
            "necessita_followup": nota <= 3
        }
        
        self.historico_respostas.append(registro)
        
        return registro
    
    def _gerar_elogio_especifico(self, contextos: List[str]) -> str:
        """Gera elogio específico baseado no contexto."""
        if not contextos or contextos == ["geral"]:
            return "É maravilhoso saber que superamos suas expectativas!"
        
        contexto_principal = contextos[0]
        if contexto_principal in self.ELOGIOS_ESPECIFICOS:
            return random.choice(self.ELOGIOS_ESPECIFICOS[contexto_principal])
        
        return "Ficamos muito felizes com seu feedback!"
    
    def gerar_relatorio(self) -> str:
        """Gera relatório das respostas geradas."""
        if not self.historico_respostas:
            return "📊 Nenhuma resposta gerada ainda."
        
        total = len(self.historico_respostas)
        por_nota = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        necessitam_followup = 0
        
        for resposta in self.historico_respostas:
            por_nota[resposta["nota"]] += 1
            if resposta["necessita_followup"]:
                necessitam_followup += 1
        
        nota_media = sum(nota * qtd for nota, qtd in por_nota.items()) / total
        
        relatorio = "📊 RELATÓRIO DE RESPOSTAS A AVALIAÇÕES\n"
        relatorio += "=" * 50 + "\n\n"
        relatorio += f"Total de respostas geradas: {total}\n"
        relatorio += f"⭐ Nota média: {nota_media:.1f}\n\n"
        relatorio += "Distribuição por nota:\n"
        for nota in range(5, 0, -1):
            qtd = por_nota[nota]
            percentual = (qtd / total * 100) if total > 0 else 0
            estrelas = "⭐" * nota
            relatorio += f"  {estrelas} ({nota}): {qtd} ({percentual:.1f}%)\n"
        
        if necessitam_followup > 0:
            relatorio += f"\n⚠️ {necessitam_followup} avaliações necessitam follow-up urgente!\n"
        
        return relatorio
    
    def exportar_para_json(self, arquivo: str = "respostas_avaliacoes.json"):
        """Exporta histórico para JSON."""
        with open(arquivo, 'w', encoding='utf-8') as f:
            json.dump(self.historico_respostas, f, ensure_ascii=False, indent=2)
        print(f"✅ Respostas exportadas para: {arquivo}")


# Teste do módulo
if __name__ == "__main__":
    print("⭐ GERADOR DE RESPOSTAS PARA AVALIAÇÕES GMB\n")
    
    gerador = GeradorRespostasAvaliacoes(
        whatsapp="31999887766",
        telefone="(31) 3333-4444",
        gerente="Carla Silva",
        diretor="Dr. João Santos"
    )
    
    # Teste 1: Avaliação 5 estrelas
    print("=" * 60)
    print("TESTE 1: Avaliação 5 Estrelas")
    print("=" * 60)
    avaliacao_5 = """Adorei o atendimento! Meu cachorro Thor precisava 
    de antibiótico urgente e em 2 horas já estava em casa. A veterinária 
    ainda me orientou pelo WhatsApp. Recomendo demais!"""
    
    resposta_5 = gerador.gerar_resposta(5, avaliacao_5)
    print(f"\n📝 Avaliação original:\n{avaliacao_5}\n")
    print(f"💬 Resposta gerada:\n{resposta_5['resposta_gerada']}\n")
    print(f"🎯 Contextos detectados: {', '.join(resposta_5['contextos_detectados'])}")
    print(f"😊 Tom: {resposta_5['tom']}\n")
    
    # Teste 2: Avaliação 4 estrelas
    print("=" * 60)
    print("TESTE 2: Avaliação 4 Estrelas")
    print("=" * 60)
    avaliacao_4 = """Bom atendimento, produtos de qualidade. 
    Só achei o preço um pouco alto, mas valeu a pena."""
    
    resposta_4 = gerador.gerar_resposta(4, avaliacao_4, nome_avaliador="Maria")
    print(f"\n📝 Avaliação original:\n{avaliacao_4}\n")
    print(f"💬 Resposta gerada:\n{resposta_4['resposta_gerada']}\n")
    
    # Teste 3: Avaliação 3 estrelas
    print("=" * 60)
    print("TESTE 3: Avaliação 3 Estrelas")
    print("=" * 60)
    avaliacao_3 = """Demorou mais que o esperado para entregar. 
    O produto é bom, mas a entrega poderia ser mais rápida."""
    
    resposta_3 = gerador.gerar_resposta(3, avaliacao_3, nome_avaliador="Carlos")
    print(f"\n📝 Avaliação original:\n{avaliacao_3}\n")
    print(f"💬 Resposta gerada:\n{resposta_3['resposta_gerada']}\n")
    print(f"⚠️ Necessita follow-up: {resposta_3['necessita_followup']}\n")
    
    # Teste 4: Avaliação 1 estrela
    print("=" * 60)
    print("TESTE 4: Avaliação 1 Estrela (CRÍTICA)")
    print("=" * 60)
    avaliacao_1 = """Péssimo! Pedi um remédio urgente e demoraram 3 dias. 
    Minha gata Mel ficou sofrendo. Nunca mais compro aqui!"""
    
    resposta_1 = gerador.gerar_resposta(1, avaliacao_1)
    print(f"\n📝 Avaliação original:\n{avaliacao_1}\n")
    print(f"💬 Resposta gerada:\n{resposta_1['resposta_gerada']}\n")
    print(f"🚨 URGENTE - Necessita follow-up: {resposta_1['necessita_followup']}\n")
    
    # Relatório final
    print("=" * 60)
    print(gerador.gerar_relatorio())
    print("=" * 60)
    
    # Exportar
    gerador.exportar_para_json()
    print("\n✅ Sistema pronto para uso!")
