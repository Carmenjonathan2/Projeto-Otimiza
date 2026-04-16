# -*- coding: utf-8 -*-
"""
🤖 GERADOR AUTOMÁTICO DE POSTS - GOOGLE MEU NEGÓCIO
====================================================

Sistema inteligente para criar posts otimizados para GMB
focado em farmácia veterinária.

Autor: Sistema de Automação Otimiza FarmaVet
Data: 16 de dezembro de 2025
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import sys
import io

# Configurar encoding UTF-8 para o console Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


class GeradorPostsGMB:
    """
    Gera posts estratégicos para Google Meu Negócio
    com base em templates e dados do negócio.
    """
    
    # Banco de dados de conteúdo
    CATEGORIAS_POSTS = {
        "vet_casa": {
            "frequencia": "terça",
            "objetivo": "promover atendimento domiciliar",
            "cta": ["Agendar Visita!", "Chamar Vet em Casa!", "Agende pelo Whats!"],
            "emojis": ["🏠", "🐕", "🐱", "🩺", "🚐"]
        },
        "dica_saude": {
            "frequencia": "segunda",
            "objetivo": "educar e engajar",
            "cta": ["Dúvidas? WhatsApp!", "Fale com nosso vet!", "Tire suas dúvidas!"],
            "emojis": ["🐾", "💙", "🩺", "⚕️", "🏥"]
        },
        "produto_destaque": {
            "frequencia": "quarta",
            "objetivo": "vender e promover",
            "cta": ["Aproveite!", "Corre que acaba!", "Garanta o seu!"],
            "emojis": ["🔥", "💰", "✨", "⭐", "🎁"]
        },
        "depoimento": {
            "frequencia": "sexta",
            "objetivo": "prova social",
            "cta": ["Você também pode confiar!", "Estamos aqui 24/7!", "Conte conosco!"],
            "emojis": ["💙", "🌟", "😊", "🙏", "❤️"]
        },
        "urgencia": {
            "frequencia": "conforme necessário",
            "objetivo": "conversão imediata",
            "cta": ["ÚLTIMAS UNIDADES!", "SÓ HOJE!", "CORRE!"],
            "emojis": ["⚠️", "🚨", "⏰", "🔥", "💥"]
        },
        "educativo": {
            "frequencia": "quinzenal",
            "objetivo": "autoridade",
            "cta": ["Saiba mais!", "Leia o artigo completo!", "Compartilhe!"],
            "emojis": ["📚", "🎓", "💡", "🔍", "📖"]
        }
    }
    
    # Templates de posts por categoria
    TEMPLATES = {
        "vet_casa": [
            {
                "titulo": "Veterinário no Conforto do Seu Lar",
                "corpo": """🏠 Chega de estresse com transporte e salas de espera barulhentas!

Levamos a clínica veterinária até você:
✅ Consultas completas
✅ Vacinação importada
✅ Coleta de exames
✅ Tudo no ambiente que seu pet ama

📍 Atendemos BH e Região Metropolitana.
💬 Agende agora pelo WhatsApp!""",
                "palavras_chave": ["vet em casa", "atendimento domiciliar", "bh"]
            },
            {
                "titulo": "Vacinação Sem Sair de Casa",
                "corpo": """💉 Proteção garantida sem o trauma da clínica!

Aplicamos:
• V8 e V10 (Importadas)
• Antirrábica
• Giardia e Gripe

❄️ Vacinas com rigoroso controle de temperatura.
📦 Farmácia completa na sua porta!

📱 Agende a vacinação do seu pet:""",
                "palavras_chave": ["vacina pet", "vacinação em casa", "saúde pet"]
            },
            {
                "titulo": "Comportamento Canino: Especialista em Casa",
                "corpo": """🐕 Problemas de comportamento? Nós ajudamos!

✨ Mais de 1.000 atendimentos desde 2012.
Avaliação completa de:
• Ansiedade e Medos
• Agressividade
• Destruição de objetos
• Adaptação de novos pets

🏠 No ambiente real onde os problemas acontecem.
💬 Saiba mais pelo WhatsApp!""",
                "palavras_chave": ["comportamento canino", "adestramento", "psicologia animal"]
            }
        ],
        "dica_saude": [
            {
                "titulo": "Vermifugação em Dia Salva Vidas",
                "corpo": """🐾 Seu pet tomou vermífugo nos últimos 3 meses?

Parasitas invisíveis podem causar:
• Anemia grave
• Perda de peso
• Vômitos e diarreia
• Problemas intestinais

📍 Temos todas as marcas em estoque
💬 Dúvidas? Nosso veterinário responde AGORA!""",
                "palavras_chave": ["vermífugo", "parasitas", "prevenção"]
            },
            {
                "titulo": "Antipulgas: Quando Aplicar?",
                "corpo": """🔍 Seu cachorro está coçando muito?

Pulgas se reproduzem RÁPIDO:
• 1 pulga = 50 ovos por dia
• Em 3 semanas = infestação total
• Causam alergias e anemia

✅ Aplicação mensal é ESSENCIAL
📦 Temos: Bravecto, Simparic, NexGard

💬 WhatsApp: Qual o melhor para seu pet?""",
                "palavras_chave": ["antipulgas", "bravecto", "simparic"]
            },
            {
                "titulo": "Hidratação no Verão: Cuidado Dobrado",
                "corpo": """☀️ Calor chegou! Seu pet está bebendo água suficiente?

Sinais de desidratação:
• Gengivas secas
• Olhos fundos
• Letargia
• Urina escura

💧 DICA: Troque a água 3x ao dia
🧊 Adicione cubos de gelo na tigela

🩺 Dúvida? Fale com nosso veterinário GRÁTIS!""",
                "palavras_chave": ["hidratação", "verão", "saúde"]
            },
            {
                "titulo": "Cuidado: Asfalto Quente Queima Patinhas",
                "corpo": """🔥 Você consegue andar descalço no asfalto agora? Se não, seu pet também não!

O asfalto pode atingir 50°C e causar queimaduras graves nos coxins (almofadinhas) das patas.

✅ Regra dos 5 segundos: toque o chão com as costas da mão. Se não aguentar 5 segundos, está muito quente!
⏰ Passeie antes das 9h ou após as 19h.

🐾 Patinha protegida é pet feliz! 
💬 Dúvidas sobre cuidados no verão? Chame no Whats!""",
                "palavras_chave": ["verão", "passeio", "cuidados"]
            }
        ],
        
        "produto_destaque": [
            {
                "titulo": "OFERTA: Ração Royal Canin 20% OFF",
                "corpo": """🔥 OFERTA DA SEMANA!

Royal Canin Terapêutica
DE: R$ 350,00
POR: R$ 280,00

✅ Entrega GRÁTIS em BH
✅ Orientação nutricional inclusa
✅ Parcelamos em 3x sem juros

⏰ Válido até sexta-feira!
📱 Peça pelo WhatsApp: [LINK]""",
                "palavras_chave": ["royal canin", "oferta", "ração"]
            },
            {
                "titulo": "Simparic: Proteção Completa",
                "corpo": """⭐ LANÇAMENTO: Simparic Trio

1 comprimido = 5 meses de proteção contra:
✓ Pulgas
✓ Carrapatos  
✓ Vermes
✓ Dirofilariose

💰 R$ 189,90 (economia de R$ 60!)
🚚 Entregamos HOJE em BH

📲 Chama no WhatsApp!""",
                "palavras_chave": ["simparic", "proteção", "lançamento"]
            }
        ],
        
        "depoimento": [
            {
                "titulo": "Salvaram Meu Gato às 23h!",
                "corpo": """💙 Depoimento da Dona Maria:

"Meu gato Thor estava com febre alta às 23h. 
Liguei desesperada e em 40 minutos:
✅ Entregaram o antibiótico
✅ Veterinário orientou pelo WhatsApp
✅ Hoje o Thor está CURADO!"

🌙 Emergência? Estamos aqui 24/7!
📱 WhatsApp: [NÚMERO]""",
                "palavras_chave": ["emergência", "depoimento", "24h"]
            },
            {
                "titulo": "Veterinária Confia na Otimiza",
                "corpo": """🩺 Dra. Ana Paula, veterinária há 15 anos:

"Indico a Otimiza para TODOS os meus clientes porque:
✓ Produtos certificados
✓ Entrega rápida
✓ Preços justos
✓ Equipe que entende do assunto"

👩‍⚕️ Profissionais confiam. Você também pode!
📍 Visite nossa loja em BH""",
                "palavras_chave": ["veterinário", "confiança", "profissional"]
            }
        ],
        
        "urgencia": [
            {
                "titulo": "⚠️ ÚLTIMAS UNIDADES: Bravecto",
                "corpo": """🚨 ALERTA DE ESTOQUE!

Bravecto 20-40kg:
❌ Só restam 8 unidades
⏰ Próxima entrega: só semana que vem

🔥 R$ 165,00 (menor preço de BH!)
🚚 Entrega em 2h (emergência)

📲 RESERVE AGORA: [WHATSAPP]
Primeiro que ligar, leva!""",
                "palavras_chave": ["bravecto", "urgência", "estoque"]
            }
        ],
        
        "educativo": [
            {
                "titulo": "5 Sinais de Que Seu Pet Precisa de Vet",
                "corpo": """📚 GUIA RÁPIDO DE EMERGÊNCIAS:

1️⃣ Vômito com sangue
2️⃣ Dificuldade para respirar
3️⃣ Convulsões
4️⃣ Não come há 24h
5️⃣ Gengivas brancas/azuladas

⚠️ QUALQUER um desses = VET URGENTE!

💬 Dúvida se é grave? 
Nosso veterinário avalia GRÁTIS pelo WhatsApp!

📖 Salve este post! Pode salvar vidas!""",
                "palavras_chave": ["emergência", "sintomas", "educação"]
            }
        ]
    }
    
    # Produtos populares para ofertas
    PRODUTOS = [
        {"nome": "Royal Canin Gastro Intestinal", "preco_de": 350, "preco_por": 280, "categoria": "ração"},
        {"nome": "Bravecto 20-40kg", "preco_de": 195, "preco_por": 165, "categoria": "antipulgas"},
        {"nome": "Simparic 40mg", "preco_de": 120, "preco_por": 95, "categoria": "antipulgas"},
        {"nome": "Advocate Cães 10-25kg", "preco_de": 85, "preco_por": 72, "categoria": "vermífugo"},
        {"nome": "NexGard Spectra M", "preco_de": 110, "preco_por": 89, "categoria": "antipulgas"},
        {"nome": "Condroton 1000mg", "preco_de": 180, "preco_por": 145, "categoria": "suplemento"},
        {"nome": "Hemolitan Pet 60ml", "preco_de": 45, "preco_por": 38, "categoria": "suplemento"},
        {"nome": "Carproflan 100mg", "preco_de": 95, "preco_por": 78, "categoria": "anti-inflamatório"}
    ]
    
    # Serviços Vet em Casa
    SERVICOS_VET_CASA = [
        {"nome": "Consulta Domiciliar", "preco_base": "Sob consulta", "icon": "🏠"},
        {"nome": "Pacote Vacinal", "preco_base": "Desconto Progressivo", "icon": "💉"},
        {"nome": "Consulta Comportamental", "preco_base": "Especialista", "icon": "🐕"},
        {"nome": "Coleta de Exames em Casa", "preco_base": "Praticidade", "icon": "🩸"}
    ]
    
    def __init__(self, whatsapp: str = "3135649606", instagram: str = "@otimizafarmavet"):
        """Inicializa o gerador de posts."""
        self.whatsapp = whatsapp
        self.instagram = instagram
        self.posts_gerados = []
    
    def gerar_post_vet_casa(self) -> Dict:
        """Gera um post focado no serviço Vet em Casa."""
        template = random.choice(self.TEMPLATES["vet_casa"])
        categoria = self.CATEGORIAS_POSTS["vet_casa"]
        
        post = {
            "tipo": "vet_casa",
            "titulo": template["titulo"],
            "corpo": template["corpo"],
            "cta_button": {
                "tipo": "WHATSAPP",
                "texto": random.choice(categoria["cta"]),
                "link": f"https://wa.me/55{self.whatsapp}?text=Olá!%20Vim%20pelo%20Google%20e%20quero%20saber%20mais%20sobre%20o%20Vet%20em%20Casa."
            },
            "palavras_chave": template["palavras_chave"],
            "emoji_destaque": random.choice(categoria["emojis"]),
            "melhor_horario": "10:00",
            "data_sugerida": self._proxima_terca()
        }
        return post

    def _proxima_terca(self) -> datetime:
        """Retorna a próxima terça-feira."""
        hoje = datetime.now()
        dias_ate_terca = (1 - hoje.weekday()) % 7
        if dias_ate_terca == 0:
            dias_ate_terca = 7
        return hoje + timedelta(days=dias_ate_terca)
    
    def gerar_post_dica_saude(self) -> Dict:
        """Gera um post de dica de saúde."""
        template = random.choice(self.TEMPLATES["dica_saude"])
        categoria = self.CATEGORIAS_POSTS["dica_saude"]
        
        corpo = template["corpo"].replace("[WHATSAPP]", self.whatsapp)
        
        post = {
            "tipo": "dica_saude",
            "titulo": template["titulo"],
            "corpo": corpo,
            "cta_button": {
                "tipo": "CALL",
                "texto": random.choice(categoria["cta"]),
                "link": f"tel:+55{self.whatsapp}"
            },
            "palavras_chave": template["palavras_chave"],
            "emoji_destaque": random.choice(categoria["emojis"]),
            "melhor_horario": "09:00",  # Segunda de manhã
            "data_sugerida": self._proxima_segunda()
        }
        
        return post
    
    def gerar_post_produto(self, produto: Dict = None) -> Dict:
        """Gera um post de produto em destaque."""
        if not produto:
            produto = random.choice(self.PRODUTOS)
        
        categoria = self.CATEGORIAS_POSTS["produto_destaque"]
        desconto_percentual = int(((produto["preco_de"] - produto["preco_por"]) / produto["preco_de"]) * 100)
        
        corpo = f"""🔥 OFERTA DA SEMANA!

{produto['nome']}
DE: R$ {produto['preco_de']:.2f}
POR: R$ {produto['preco_por']:.2f}
💰 Economia: {desconto_percentual}%!

✅ Entrega GRÁTIS em BH
✅ Parcelamos em 3x sem juros
✅ Produto certificado

⏰ Válido até sexta-feira!
📱 Peça pelo WhatsApp: {self.whatsapp}"""
        
        post = {
            "tipo": "produto_destaque",
            "titulo": f"{desconto_percentual}% OFF: {produto['nome']}",
            "corpo": corpo,
            "cta_button": {
                "tipo": "WHATSAPP",
                "texto": "Quero aproveitar!",
                "link": f"https://wa.me/55{self.whatsapp}?text=Oi!%20Quero%20a%20oferta%20de%20{produto['nome']}"
            },
            "palavras_chave": [produto["nome"], "oferta", produto["categoria"]],
            "emoji_destaque": "🔥",
            "melhor_horario": "14:00",  # Quarta à tarde
            "data_sugerida": self._proxima_quarta(),
            "produto": produto
        }
        
        return post
    
    def gerar_post_depoimento(self, nome_cliente: str = None, nome_pet: str = None) -> Dict:
        """Gera um post de depoimento."""
        template = random.choice(self.TEMPLATES["depoimento"])
        categoria = self.CATEGORIAS_POSTS["depoimento"]
        
        if nome_cliente:
            corpo = template["corpo"].replace("Dona Maria", nome_cliente)
        else:
            corpo = template["corpo"]
        
        if nome_pet:
            corpo = corpo.replace("Thor", nome_pet)
        
        corpo = corpo.replace("[NÚMERO]", self.whatsapp)
        
        post = {
            "tipo": "depoimento",
            "titulo": template["titulo"],
            "corpo": corpo,
            "cta_button": {
                "tipo": "WHATSAPP",
                "texto": random.choice(categoria["cta"]),
                "link": f"https://wa.me/55{self.whatsapp}"
            },
            "palavras_chave": template["palavras_chave"],
            "emoji_destaque": random.choice(categoria["emojis"]),
            "melhor_horario": "18:00",  # Sexta fim de tarde
            "data_sugerida": self._proxima_sexta()
        }
        
        return post
    
    def gerar_post_urgencia(self, produto: Dict = None) -> Dict:
        """Gera um post de urgência/escassez."""
        if not produto:
            produto = random.choice(self.PRODUTOS)
        
        categoria = self.CATEGORIAS_POSTS["urgencia"]
        unidades_restantes = random.randint(3, 12)
        
        corpo = f"""🚨 ALERTA DE ESTOQUE!

{produto['nome']}:
❌ Só restam {unidades_restantes} unidades
⏰ Próxima entrega: só semana que vem

🔥 R$ {produto['preco_por']:.2f} (menor preço de BH!)
🚚 Entrega em 2h (emergência)

📲 RESERVE AGORA: {self.whatsapp}
Primeiro que ligar, leva!"""
        
        post = {
            "tipo": "urgencia",
            "titulo": f"⚠️ ÚLTIMAS {unidades_restantes} UNIDADES: {produto['nome']}",
            "corpo": corpo,
            "cta_button": {
                "tipo": "CALL",
                "texto": "LIGAR AGORA!",
                "link": f"tel:+55{self.whatsapp}"
            },
            "palavras_chave": [produto["nome"], "urgência", "estoque limitado"],
            "emoji_destaque": "🚨",
            "melhor_horario": "IMEDIATO",
            "data_sugerida": datetime.now(),
            "produto": produto,
            "unidades_restantes": unidades_restantes
        }
        
        return post
    
    def gerar_calendario_mensal(self) -> List[Dict]:
        """Gera um calendário completo de posts para o mês."""
        calendario = []
        hoje = datetime.now()
        
        # 4 segundas-feiras (dicas de saúde)
        for i in range(4):
            data = self._proxima_segunda() + timedelta(weeks=i)
            if data.month == hoje.month or (data.month == hoje.month + 1 and i == 0):
                post = self.gerar_post_dica_saude()
                post["data_publicacao"] = data.strftime("%Y-%m-%d 09:00")
                calendario.append(post)
        
        # 4 quartas-feiras (produtos)
        for i in range(4):
            data = self._proxima_quarta() + timedelta(weeks=i)
            if data.month == hoje.month or (data.month == hoje.month + 1 and i == 0):
                produto = self.PRODUTOS[i % len(self.PRODUTOS)]
                post = self.gerar_post_produto(produto)
                post["data_publicacao"] = data.strftime("%Y-%m-%d 14:00")
                calendario.append(post)
        
        # 4 sextas-feiras (depoimentos)
        for i in range(4):
            data = self._proxima_sexta() + timedelta(weeks=i)
            if data.month == hoje.month or (data.month == hoje.month + 1 and i == 0):
                post = self.gerar_post_depoimento()
                post["data_publicacao"] = data.strftime("%Y-%m-%d 18:00")
                calendario.append(post)
        
        # 4 terças-feiras (Vet em Casa)
        for i in range(4):
            data = self._proxima_terca() + timedelta(weeks=i)
            if data.month == hoje.month or (data.month == hoje.month + 1 and i == 0):
                post = self.gerar_post_vet_casa()
                post["data_publicacao"] = data.strftime("%Y-%m-%d 10:00")
                calendario.append(post)
        
        # Ordenar por data
        calendario.sort(key=lambda x: x["data_publicacao"])
        
        return calendario
    
    def _proxima_segunda(self) -> datetime:
        """Retorna a próxima segunda-feira."""
        hoje = datetime.now()
        dias_ate_segunda = (7 - hoje.weekday()) % 7
        if dias_ate_segunda == 0:
            dias_ate_segunda = 7
        return hoje + timedelta(days=dias_ate_segunda)
    
    def _proxima_quarta(self) -> datetime:
        """Retorna a próxima quarta-feira."""
        hoje = datetime.now()
        dias_ate_quarta = (2 - hoje.weekday()) % 7
        if dias_ate_quarta == 0:
            dias_ate_quarta = 7
        return hoje + timedelta(days=dias_ate_quarta)
    
    def _proxima_sexta(self) -> datetime:
        """Retorna a próxima sexta-feira."""
        hoje = datetime.now()
        dias_ate_sexta = (4 - hoje.weekday()) % 7
        if dias_ate_sexta == 0:
            dias_ate_sexta = 7
        return hoje + timedelta(days=dias_ate_sexta)
    
    def exportar_para_json(self, calendario: List[Dict], arquivo: str = "calendario_posts_gmb.json"):
        """Exporta o calendário para JSON."""
        with open(arquivo, 'w', encoding='utf-8') as f:
            json.dump(calendario, f, ensure_ascii=False, indent=2, default=str)
        print(f"✅ Calendário exportado para: {arquivo}")
    
    def gerar_relatorio(self, calendario: List[Dict]) -> str:
        """Gera relatório do calendário de posts."""
        total = len(calendario)
        por_tipo = {}
        
        for post in calendario:
            tipo = post["tipo"]
            por_tipo[tipo] = por_tipo.get(tipo, 0) + 1
        
        relatorio = "📊 RELATÓRIO DO CALENDÁRIO DE POSTS GMB\n"
        relatorio += "=" * 50 + "\n\n"
        relatorio += f"Total de posts: {total}\n\n"
        relatorio += "Distribuição por tipo:\n"
        for tipo, qtd in por_tipo.items():
            relatorio += f"  • {tipo.replace('_', ' ').title()}: {qtd}\n"
        
        relatorio += f"\n📅 Período: {calendario[0]['data_publicacao']} até {calendario[-1]['data_publicacao']}\n"
        relatorio += f"📈 Frequência: {total / 4:.1f} posts por semana\n"
        
        return relatorio


# Teste do módulo
if __name__ == "__main__":
    print("🤖 GERADOR DE POSTS PARA GOOGLE MEU NEGÓCIO\n")
    
    gerador = GeradorPostsGMB(
        whatsapp="3135649606",
        instagram="@otimizafarmavet"
    )
    
    print("=" * 60)
    print("TESTE 1: Post de Dica de Saúde")
    print("=" * 60)
    post_dica = gerador.gerar_post_dica_saude()
    print(f"\n📌 {post_dica['titulo']}\n")
    print(post_dica['corpo'])
    print(f"\n🔘 CTA: {post_dica['cta_button']['texto']}")
    print(f"📅 Publicar em: {post_dica['data_sugerida'].strftime('%d/%m/%Y às %H:%M')}\n")
    
    print("=" * 60)
    print("TESTE 2: Post de Produto")
    print("=" * 60)
    post_produto = gerador.gerar_post_produto()
    print(f"\n📌 {post_produto['titulo']}\n")
    print(post_produto['corpo'])
    print(f"\n🔘 CTA: {post_produto['cta_button']['texto']}\n")
    
    print("=" * 60)
    print("TESTE 3: Post de Depoimento")
    print("=" * 60)
    post_depoimento = gerador.gerar_post_depoimento(
        nome_cliente="Carla Silva",
        nome_pet="Mel"
    )
    print(f"\n📌 {post_depoimento['titulo']}\n")
    print(post_depoimento['corpo'])
    print(f"\n🔘 CTA: {post_depoimento['cta_button']['texto']}\n")
    
    print("=" * 60)
    print("TESTE 4: Calendário Mensal Completo")
    print("=" * 60)
    calendario = gerador.gerar_calendario_mensal()
    print(gerador.gerar_relatorio(calendario))
    
    print("\n📋 Primeiros 5 posts do calendário:")
    for i, post in enumerate(calendario[:5], 1):
        print(f"\n{i}. [{post['data_publicacao']}] {post['tipo'].upper()}")
        print(f"   {post['titulo']}")
    
    # Exportar para JSON
    gerador.exportar_para_json(calendario)
    print("\n✅ Sistema pronto para uso!")
