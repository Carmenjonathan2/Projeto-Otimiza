import json
import random
import os
from typing import Dict
from preventor_duplicidades import PreventorDuplicidades

class ContentGenerator:
    def __init__(self, db_path="content_database.json"):
        self.db_path = db_path
        self.content_db = self._load_database()
        self.preventor = PreventorDuplicidades()  # Sistema de prevenção de duplicidades

    def _load_database(self) -> Dict:
        """Loads the content database from JSON file."""
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: Database file {self.db_path} not found.")
            return {"topics": []}
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in {self.db_path}.")
            return {"topics": []}

    def _create_rich_content(self, topic: Dict) -> str:
        """
        Cria conteúdo RICO e EDUCATIVO para blog
        Estrutura profissional com seções bem definidas
        """
        
        category = topic.get("category", "Geral")
        title = topic["title"]
        subtitle = topic["subtitle"]
        description = topic["description"]
        keywords = topic.get("keywords", [])
        
        # Templates específicos por categoria com conteúdo EDUCATIVO
        category_sections = {
            "Saúde Preventiva": {
                "icon": "🛡️",
                "sections": [
                    {
                        "title": "Por Que Este Cuidado é Fundamental",
                        "content": f"A prevenção é a base da medicina veterinária moderna. {description.split('.')[0]}. Este cuidado preventivo pode evitar complicações graves, economizar recursos e, principalmente, garantir mais anos de vida saudável ao lado do seu companheiro."
                    },
                    {
                        "title": "Protocolo Recomendado por Veterinários",
                        "content": "Veterinários brasileiros seguem protocolos internacionais atualizados. A frequência e o tipo de prevenção variam conforme a idade, raça, peso e histórico de saúde do animal. Consulte sempre um profissional para um plano personalizado."
                    },
                    {
                        "title": "Sinais de Alerta - Quando Procurar Ajuda",
                        "content": "Fique atento a mudanças no comportamento, apetite, disposição ou aspecto físico do seu pet. Sintomas como apatia, vômitos recorrentes, diarreia persistente ou dificuldade respiratória requerem avaliação veterinária imediata."
                    }
                ]
            },
            "Nutrição": {
                "icon": "🥗",
                "sections": [
                    {
                        "title": "Fundamentos da Nutrição de Alta Performance",
                        "content": f"A alimentação adequada é o pilar da saúde animal. {description.split('.')[0]}. Atualmente, tendências como dietas liofilizadas (freeze-dried) e alimentação natural (AN) balanceada estão revolucionando a vitalidade dos pets, promovendo pelagem mais brilhante e maior disposição."
                    },
                    {
                        "title": "Como Escolher a Alimentação Ideal",
                        "content": "Considere o estágio de vida e o nível de atividade. Ingredientes minimamente processados e a ausência de corantes artificiais são marcadores de qualidade. Para gatos, a inclusão de alimentos úmidos (sachês) é inegociável para garantir a hidratação e prevenir doenças renais."
                    },
                    {
                        "title": "Sinais de uma Dieta Eficiente",
                        "content": "Pelo brilhante, fezes firmes e com pouco odor, e energia constante são sinais de que a nutrição está correta. Fique atento ao 'Kindchenschema' (aparência saudável e vital) que reflete o bem-estar interno do seu companheiro."
                    }
                ]
            },
            "Longevidade": {
                "icon": "🕰️",
                "sections": [
                    {
                        "title": "A Ciência do Healthspan Animal",
                        "content": f"Viver muito é bom, mas viver bem é essencial. {description.split('.')[0]}. O conceito de Healthspan foca em manter as funções cognitivas e físicas ativas pelo maior tempo possível, utilizando estratégias preventivas antes mesmo dos sinais de velhice aparecerem."
                    },
                    {
                        "title": "Prevenção do Declínio Cognitivo",
                        "content": "A saúde cerebral em pets idosos pode ser protegida com enriquecimento ambiental e suplementação específica (como Ômega-3 e antioxidantes). Manter o cérebro ativo com novos desafios é tão importante quanto o exercício físico."
                    },
                    {
                        "title": "Monitoramento Proativo",
                        "content": "Check-ups semestrais são fundamentais a partir dos 7 anos. Exames de imagem e sangue detectam precocemente alterações renais ou cardíacas que, se tratadas cedo, permitem muitos anos extras de alegria e conforto."
                    }
                ]
            },
            "Small Pets": {
                "icon": "🐹",
                "sections": [
                    {
                        "title": "O Mundo dos Pequenos Roedores",
                        "content": f"Porquinhos-da-índia e outros roedores possuem necessidades fisiológicas únicas. {description.split('.')[0]}. A escala reduzida exige uma atenção macro: cada detalhe do ambiente e da dieta impacta diretamente na longevidade desses pets sensíveis."
                    },
                    {
                        "title": "A Importância do Feno e da Vitamina C",
                        "content": "Para porquinhos-da-índia, o feno de alta qualidade deve estar disponível 24h para o desgaste dental e saúde digestiva. Além disso, a suplementação de Vitamina C (via alimentos frescos como pimentão ou suplemento) é vital, já que eles não a produzem."
                    },
                    {
                        "title": "Socialização e Espaço Seguro",
                        "content": "Pequenos animais são presas na natureza e precisam de locais de refúgio. Cercados espaçosos e a companhia de outros da mesma espécie (no caso de porquinhos-da-índia) são essenciais para evitar o stress e a depressão."
                    }
                ]
            },
            "Higiene": {
                "icon": "🛁",
                "sections": [
                    {
                        "title": "Importância da Higiene Regular",
                        "content": f"Manter a higiene adequada previne doenças de pele, parasitas e problemas de saúde. {description.split('.')[0]}. Além dos benefícios para o pet, a higiene regular também protege a família contra zoonoses (doenças transmitidas de animais para humanos)."
                    },
                    {
                        "title": "Higiene Oral: O Ponto Cego",
                        "content": "A saúde dental é frequentemente negligenciada. A escovação regular previne a doença periodontal, que pode causar infecções graves no coração e rins. Comece a higienização cedo para que o pet se acostume com o processo."
                    },
                    {
                        "title": "Frequência e Produtos Adequados",
                        "content": "Sempre use produtos formulados especificamente para pets (pH balanceado). Cães com dobras de pele ou orelhas caídas exigem limpeza semanal rigorosa nessas áreas para evitar proliferação de fungos e bactérias."
                    }
                ]
            },
            "Comportamento": {
                "icon": "🐕",
                "sections": [
                    {
                        "title": "Decodificando a Psicologia Animal",
                        "content": f"Comportamento é a linguagem silenciosa do bem-estar. {description.split('.')[0]}. Entender fenômenos como os 'Zoomies' ou a ansiedade de separação permite criar um ambiente muito mais harmonioso e feliz para o pet."
                    },
                    {
                        "title": "Linguagem Corporal e Sinais de Stress",
                        "content": "Fique atento a sinais sutis: lamber o focinho, bocejar fora de hora ou virar o rosto. Estes são sinais de apaziguamento que indicam que o pet está desconfortável. Já os 'Zoomies' geralmente indicam alívio de tensão e alegria pura."
                    },
                    {
                        "title": "Enriquecimento Ambiental",
                        "content": "Transforme a casa em um playground cognitivo. Brinquedos de rechear, tapetes de lambedura e desafios de faro (o 'Sniffari') são essenciais para gastar energia mental e prevenir comportamentos destrutivos."
                    }
                ]
            },
            "Saúde": {
                "icon": "🏥",
                "sections": [
                    {
                        "title": "Aspectos Clínicos Importantes",
                        "content": f"A saúde do seu pet depende de cuidados contínuos e atenção aos sinais. {description.split('.')[0]}. Diagnóstico e tratamento precoces são fundamentais para o sucesso terapêutico e manutenção da qualidade de vida."
                    },
                    {
                        "title": "Opções de Tratamento Disponíveis",
                        "content": "A medicina veterinária moderna oferece diversas opções: tratamentos medicamentosos, fisioterapia, acupuntura, terapias alternativas complementares e, quando necessário, procedimentos cirúrgicos. O veterinário avaliará a melhor abordagem para cada caso."
                    },
                    {
                        "title": "Cuidados Pós-Tratamento e Acompanhamento",
                        "content": "Siga rigorosamente as orientações veterinárias sobre medicações (dose, horário, duração), retornos programados e restrições de atividade. Mantenha um registro de saúde do pet com datas de consultas, vacinas, vermifugações e tratamentos realizados."
                    }
                ]
            },
            "Idosos": {
                "icon": "👴",
                "sections": [
                    {
                        "title": "Geriatria Veterinária e Envelhecimento Saudável",
                        "content": f"Pets idosos merecem cuidados especiais e adaptados. {description.split('.')[0]}. Com os avanços da medicina veterinária, pets vivem mais e melhor. O objetivo da geriatria é manter qualidade de vida, conforto e dignidade na terceira idade."
                    },
                    {
                        "title": "Adaptações Necessárias no Ambiente",
                        "content": "Facilite o acesso: rampas para cama/sofá, pisos antiderrapantes, cama ortopédica, comedouros elevados. Mantenha temperatura confortável (idosos têm dificuldade de termorregulação), iluminação adequada e ambiente seguro sem obstáculos."
                    },
                    {
                        "title": "Monitoramento de Doenças Crônicas",
                        "content": "Check-ups geriátricos são recomendados a cada 6 meses. Exames de rotina detectam precocemente: insuficiência renal, diabetes, problemas cardíacos, artrite, câncer. Muitas doenças crônicas, se diagnosticadas cedo, podem ser controladas efetivamente."
                    }
                ]
            },
            "Primeiros Socorros": {
                "icon": "🚑",
                "sections": [
                    {
                        "title": "Preparação Para Emergências",
                        "content": f"Estar preparado pode salvar a vida do seu pet. {description.split('.')[0]}. Tenha sempre à mão: telefone do veterinário de confiança, clínica 24h mais próxima, táxi pet ou meio de transporte rápido."
                    },
                    {
                        "title": "Procedimentos de Emergência Passo a Passo",
                        "content": "Em caso de emergência: 1) Mantenha a calma, 2) Avalie o estado geral do animal (consciência, respiração, batimentos), 3) Ligue para o veterinário descrevendo a situação, 4) Siga as orientações recebidas, 5) Transporte com segurança para atendimento."
                    },
                    {
                        "title": "Limites da Atuação do Tutor",
                        "content": "IMPORTANTE: Primeiros socorros são medidas TEMPORÁRIAS até atendimento profissional. Não substitua o veterinário. Nunca medique por conta própria. Medicamentos humanos podem ser tóxicos para pets. Em emergências graves, vá direto para a clínica."
                    }
                ]
            },
            "Curiosidades": {
                "icon": "🔍",
                "sections": [
                    {
                        "title": "Ciência Por Trás do Comportamento",
                        "content": f"Entender seu pet vai além do amor - é ciência! {description.split('.')[0]}. Estudos em etologia (ciência do comportamento animal) revelam aspectos fascinantes da comunicação, cognição e emoções dos nossos companheiros."
                    },
                    {
                        "title": "Evolução e Domesticação",
                        "content": "Cães foram domesticados há aproximadamente 15.000-40.000 anos, desenvolvendo habilidades únicas de comunicação com humanos. Gatos se auto-domesticaram há cerca de 10.000 anos. Essa longa convivência moldou comportamentos específicos de cada espécie."
                    },
                    {
                        "title": "Aplicações Práticas do Conhecimento",
                        "content": "Conhecer as curiosidades do seu pet melhora a convivência, previne problemas comportamentais e fortalece o vínculo. Use esse conhecimento para: enriquecer o ambiente, proporcionar estímulos adequados e respeitar as necessidades naturais da espécie."
                    }
                ]
            }
        }
        
        # Selecionar template (default para Saúde)
        template = category_sections.get(category, category_sections["Saúde"])
        
        # Construir HTML rico e estruturado
        html_content = f"""
        <div class="article-intro">
            <p class="lead" style="font-size: 1.2em; color: #555; line-height: 1.8;">
                <strong>{subtitle}</strong>
            </p>
            <p style="line-height: 1.8; margin-bottom: 2em;">
                {description}
            </p>
        </div>

        <div class="article-content" style="margin-top: 2em;">
"""
        
        # Adicionar seções educativas
        for i, section in enumerate(template["sections"], 1):
            html_content += f"""
            <div class="content-section" style="margin-bottom: 2.5em; padding: 1.5em; background: #f8f9fa; border-left: 4px solid #470C51; border-radius: 8px;">
                <h3 style="color: #470C51; margin-bottom: 1em; font-size: 1.3em;">
                    {template['icon']} {section['title']}
                </h3>
                <p style="line-height: 1.8; color: #333;">
                    {section['content']}
                </p>
            </div>
"""
        
        # Adicionar seção de ação
        html_content += f"""
        </div>

        <div class="cta-section" style="margin: 3em 0; padding: 2em; background: linear-gradient(135deg, #470C51 0%, #6C0C51 100%); border-radius: 12px; color: white; text-align: center;">
            <h3 style="color: white; margin-bottom: 1em; font-size: 1.5em;">
                🏠 Atendimento Veterinário em Casa
            </h3>
            <p style="font-size: 1.1em; margin-bottom: 1.5em; line-height: 1.6;">
                Nossa equipe de veterinários especializados atende você no conforto do seu lar.
                Consultas, vacinação, exames e muito mais com toda segurança e carinho que seu pet merece.
            </p>
            <p style="margin-bottom: 0;">
                <a href="https://otimizafarmavet.com.br/pages/agendamento" 
                   style="display: inline-block; background: white; color: #470C51; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 1.1em; transition: transform 0.2s;">
                    Agende Sua Consulta Domiciliar →
                </a>
            </p>
        </div>

        <div class="article-footer" style="margin-top: 3em; padding-top: 2em; border-top: 2px solid #f0f0f0;">
            <div class="keywords" style="margin-bottom: 1.5em;">
                <h4 style="color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8em;">
                    Palavras-chave relacionadas:
                </h4>
                <p style="color: #999; font-size: 0.95em;">
                    {', '.join(keywords[:8])}
                </p>
            </div>
            
            <div class="disclaimer" style="background: #fff9e6; padding: 1.5em; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 0.95em; line-height: 1.6;">
                    <strong>⚠️ Aviso Importante:</strong> Este conteúdo tem caráter educativo e informativo. 
                    Não substitui consulta, diagnóstico ou tratamento veterinário profissional. 
                    Sempre consulte um médico veterinário para orientações específicas sobre seu pet.
                </p>
            </div>
        </div>
        """
        
        return html_content

    def generate_pin_content(self) -> Dict:
        """Selects and enhances a topic from the database for Blog/Pinterest."""
        if not self.content_db["topics"]:
            return {
                "title": "Erro no Conteúdo",
                "subtitle": "Verifique o banco de dados",
                "description": "Não foi possível carregar conteúdo.",
                "hashtags": [],
                "category": "Geral"
            }
        
        # 🛡️ PROTEÇÃO CONTRA DUPLICIDADES
        max_tentativas = 20  # Tentar até 20 tópicos diferentes
        topics_disponiveis = self.content_db["topics"].copy()
        random.shuffle(topics_disponiveis)  # Embaralhar para variedade
        
        for tentativa, topic in enumerate(topics_disponiveis, 1):
            titulo = topic["title"]
            descricao_original = topic["description"]
            
            # Verificar se pode publicar (não foi publicado nos últimos 30 dias)
            pode_publicar, mensagem = self.preventor.pode_publicar(
                titulo=titulo,
                conteudo=descricao_original,
                intervalo_dias=30,  # Não repetir nos últimos 30 dias
                verificar_hash=True
            )
            
            if pode_publicar:
                print(f"[OK] Tópico selecionado (tentativa {tentativa}/{len(topics_disponiveis)}): {titulo}")
                print(f"   {mensagem}")
                
                # Criar conteúdo RICO e EDUCATIVO
                rich_content = self._create_rich_content(topic)
                
                return {
                    "title": topic["title"],
                    "subtitle": topic["subtitle"],
                    "description": rich_content,  # Agora é HTML rico e estruturado
                    "original_desc": topic["description"],  # Descrição curta original
                    "hashtags": topic["hashtags"],
                    "category": topic.get("category", "Geral"),
                    "keywords": topic.get("keywords", [])
                }
            else:
                print(f"[SKIP] Pulando (tentativa {tentativa}/{len(topics_disponiveis)}): {titulo}")
                print(f"   Motivo: {mensagem}")
        
        # Se chegou aqui, todos os tópicos foram publicados recentemente
        print("\n[AVISO] Todos os tópicos foram publicados recentemente!")
        print(f"   Total de tópicos no banco: {len(self.content_db['topics'])}")
        print(f"   Sugestões:")
        print(f"   1. Aguarde alguns dias antes de publicar novamente")
        print(f"   2. Adicione novos tópicos ao content_database.json")
        print(f"   3. Limpe registros antigos: python -c \"from preventor_duplicidades import PreventorDuplicidades; p = PreventorDuplicidades(); p.limpar_registros_antigos(30)\"")
        
        raise Exception("Todos os tópicos foram publicados recentemente. Aguarde ou adicione novos tópicos.")

if __name__ == "__main__":
    # Test the generator
    generator = ContentGenerator()
    content = generator.generate_pin_content()
    print("=" * 60)
    print(f"TÍTULO: {content['title']}")
    print(f"CATEGORIA: {content['category']}")
    print("=" * 60)
    print(content['description'])
