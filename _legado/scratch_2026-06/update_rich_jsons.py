# -*- coding: utf-8 -*-
import os
import json

base_dir = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Manual-Semanal\Fila-Pinterest"

rich_data = {
    "Post-01_Quarta_2026-06-10": {
        "posting_time": "2026-06-10 09:00",
        "dia_nome": "Quarta",
        "titulo_pin": "Ração Premium vs Ração Comum: Qual Escolher",
        "descricao_pin": "Entenda as principais diferenças entre a Ração Comum, Premium e Super Premium para a nutrição e saúde do seu cão ou gato. Conheça as tabelas comparativas e saiba como escolher com base na idade, porte e necessidades do seu melhor amigo. #saudepet #nutricaopet #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de cotar rações ou tirar dúvidas sobre alimentação pet.",
        "infographic_data": {
            "header": {
                "title": "Ração Premium vs Ração Comum: Qual Escolher",
                "subtitle": "GUIA COMPLETO DE ALIMENTAÇÃO PARA PETS",
                "category": "NUTRIÇÃO",
                "schedule": "QUARTA, 10 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Diferenças",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Diferenças entre ração premium, super premium e comum afetam saúde do pet",
                    "content": {
                        "nodes": [
                            {"label": "Comum", "desc": "Ingredientes básicos, menor digestibilidade e custo mais baixo."},
                            {"label": "Premium", "desc": "Melhores ingredientes, equilíbrio nutricional e ótima aceitação."},
                            {"label": "Super Premium", "desc": "Maior qualidade de proteína, ingredientes funcionais e alta digestibilidade."}
                        ]
                    }
                },
                {
                    "title": "Compare",
                    "type": "table",
                    "icon": "compare",
                    "description": "Compare a qualidade de ingredientes, valor nutricional e custo-benefício",
                    "content": {
                        "headers": ["Critério", "Comum", "Premium", "Super Premium"],
                        "rows": [
                            {"criterio": "Ingredientes", "comum": "Subprodutos / Grãos", "premium": "Farinhas selecionadas", "super_premium": "Carne fresca e selecionada"},
                            {"criterio": "Valor Nutricional", "comum": "Básico", "premium": "Equilibrado (Vitaminas)", "super_premium": "Funcional (Vitaminas + Minerais)"},
                            {"criterio": "Digestibilidade", "comum": "Baixa (fezes volumosas)", "premium": "Média / Boa", "super_premium": "Alta (fezes firmes e menores)"},
                            {"criterio": "Custo-Benefício", "comum": "Baixo a Médio", "premium": "Excelente", "super_premium": "Alto a Longo Prazo"}
                        ]
                    }
                },
                {
                    "title": "Aprenda",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Como escolher a ração ideal para as necessidades do seu cão ou gato",
                    "content": {
                        "steps": [
                            {"step": "Idade", "options": ["filhote", "adulto", "sênior"]},
                            {"step": "Porte", "options": ["pequeno", "médio", "grande"]},
                            {"step": "Necessidades Especiais", "options": ["estômago sensível", "controle de peso", "alergias"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-02_Sexta_2026-06-12": {
        "posting_time": "2026-06-12 09:00",
        "dia_nome": "Sexta",
        "titulo_pin": "Gatos em Apartamento: Como Criar um Espaço Vertical",
        "descricao_pin": "A verticalização é fundamental para o bem-estar físico e mental dos felinos. Veja como prateleiras, nichos e redes podem transformar a rotina do seu gato no apartamento, reduzindo o estresse e promovendo exercícios. #gatosemapartamento #comportamentofelino #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de saber mais sobre bem-estar e cuidados com gatos.",
        "infographic_data": {
            "header": {
                "title": "Gatos em Apartamento: Como Criar um Espaço Vertical",
                "subtitle": "MAXIMIZANDO O BEM-ESTAR FELINO EM PEQUENOS ESPAÇOS",
                "category": "COMPORTAMENTO",
                "schedule": "SEXTA, 12 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Benefícios",
                    "type": "list",
                    "icon": "check",
                    "description": "Por que verticalizar o apartamento para os gatos?",
                    "content": {
                        "items": [
                            {"label": "Segurança", "desc": "Gatos no alto sentem-se protegidos de predadores imaginários."},
                            {"label": "Exercício Físico", "desc": "Estimula o instinto de caça, saltos, equilíbrio e escaladas."},
                            {"label": "Harmonia", "desc": "Reduz conflitos territoriais entre múltiplos gatos."}
                        ]
                    }
                },
                {
                    "title": "Estruturas",
                    "type": "diagram",
                    "icon": "compare",
                    "description": "Elementos ideais para compor a verticalização",
                    "content": {
                        "nodes": [
                            {"label": "Prateleiras", "desc": "Caminhos nas paredes com carpete para melhor aderência."},
                            {"label": "Nichos", "desc": "Esconderijos fechados no alto para sonecas seguras."},
                            {"label": "Pontes / Redes", "desc": "Conectores suspensos para transitar entre móveis."}
                        ]
                    }
                },
                {
                    "title": "Como Fazer",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Planeje a instalação com segurança para o pet",
                    "content": {
                        "steps": [
                            {"step": "Localização", "options": ["Próximo a janelas com tela", "Sala principal"]},
                            {"step": "Altura", "options": ["Fácil acesso", "Escadas progressivas"]},
                            {"step": "Segurança", "options": ["Suportes reforçados", "Superfícies antiderrapantes"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-03_Segunda_2026-06-15": {
        "posting_time": "2026-06-15 09:00",
        "dia_nome": "Segunda",
        "titulo_pin": "Mitos e Verdades sobre a Alimentação Crua (BARF)",
        "descricao_pin": "Dieta Natural Crua (BARF) para cães e gatos: mitos e verdades. Saiba os reais benefícios para pelagem e digestão e os cuidados higiênicos essenciais que você deve ter antes de iniciar. #dietabarf #alimentacaonaturalpet #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de tirar dúvidas sobre alimentação natural para meu pet.",
        "infographic_data": {
            "header": {
                "title": "Mitos e Verdades sobre a Alimentação Crua (BARF)",
                "subtitle": "ENTENDA OS PRÓS E CONTRAS DA DIETA NATURAL CRUA",
                "category": "NUTRIÇÃO",
                "schedule": "SEGUNDA, 15 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "O que é?",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Composição básica da dieta biologicamente adequada",
                    "content": {
                        "nodes": [
                            {"label": "Carnes e Ossos", "desc": "Ossos carnudos crus de aves ou suínos."},
                            {"label": "Vísceras e Órgãos", "desc": "Fontes ricas em vitaminas lipossolúveis."},
                            {"label": "Vegetais e Suplementos", "desc": "Fibras, minerais e óleos essenciais saudáveis."}
                        ]
                    }
                },
                {
                    "title": "Mitos e Verdades",
                    "type": "table",
                    "icon": "compare",
                    "description": "Esclarecendo as dúvidas mais comuns sobre dieta crua",
                    "content": {
                        "headers": ["Afirmação", "Classificação", "Explicação"],
                        "rows": [
                            {"afirmacao": "Limpa os dentes", "class": "Verdade", "expl": "A mastigação de ossos crus ajuda a remover mecanicamente a placa bucal."},
                            {"afirmacao": "Transmite bactérias", "class": "Verdade", "expl": "Exige higiene rigorosa no preparo e congelamento profilático para evitar salmonela."},
                            {"afirmacao": "Qualquer carne serve", "class": "Mito", "expl": "Exige balanceamento feito por nutrólogo veterinário para evitar desnutrição."}
                        ]
                    }
                },
                {
                    "title": "Como Iniciar",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Passos essenciais para uma transição alimentar segura",
                    "content": {
                        "steps": [
                            {"step": "Exames de Rotina", "options": ["Hemograma", "Função renal e hepática"]},
                            {"step": "Transição Lenta", "options": ["Cozido para semi-cru", "Cru final formulado"]},
                            {"step": "Manejo Seguro", "options": ["Congelamento prévio", "Desinfecção de utensílios"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-04_Quarta_2026-06-17": {
        "posting_time": "2026-06-17 09:00",
        "dia_nome": "Quarta",
        "titulo_pin": "Cuidados com Gatos Brancos: O Risco do Câncer de Pele",
        "descricao_pin": "A exposição solar sem proteção é perigosa para felinos de pelagem branca. Saiba como identificar os sinais precoces do Carcinoma Espinocelular e como proteger o nariz e orelhas do seu gato com filtro solar pet. #gatosbrancos #dermatologiafelina #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de cotar filtro solar pet ou marcar consulta.",
        "infographic_data": {
            "header": {
                "title": "Cuidados com Gatos Brancos: O Risco do Câncer de Pele",
                "subtitle": "PROTEÇÃO SOLAR E CUIDADOS DERMATOLÓGICOS",
                "category": "SAÚDE",
                "schedule": "QUARTA, 17 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Áreas em Risco",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Zonas desprovidas de melanina e pelos",
                    "content": {
                        "nodes": [
                            {"label": "Orelhas", "desc": "Bordas finas e com pouca cobertura de pelos."},
                            {"label": "Focinho / Nariz", "desc": "Pele rosada e exposta diretamente ao sol."},
                            {"label": "Pálpebras", "desc": "Pele extremamente delicada e sensível."}
                        ]
                    }
                },
                {
                    "title": "Sintomas",
                    "type": "table",
                    "icon": "compare",
                    "description": "Evolução clínica do Carcinoma Espinocelular",
                    "content": {
                        "headers": ["Estágio", "Aparência", "Gravidade"],
                        "rows": [
                            {"estagio": "Inicial", "aparencia": "Vermelhidão leve, descamação nas pontas", "grav": "Leve - Fácil reversão"},
                            {"estagio": "Intermediário", "aparencia": "Feridas pequenas que não cicatrizam", "grav": "Moderada - Exige biópsia"},
                            {"estagio": "Avançado", "aparencia": "Ulcerações profundas e sangramento", "grav": "Grave - Cirúrgico"}
                        ]
                    }
                },
                {
                    "title": "Proteção",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Rotina diária para prevenir queimaduras solares",
                    "content": {
                        "steps": [
                            {"step": "Filtro Solar Pet", "options": ["Uso diário nas áreas rosadas", "FPS específico para pets"]},
                            {"step": "Restrição Solar", "options": ["Manter dentro de casa", "Horário crítico: 10h às 16h"]},
                            {"step": "Barreiras UV", "options": ["Películas em janelas", "Áreas de sombra na casa"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-05_Sexta_2026-06-19": {
        "posting_time": "2026-06-19 09:00",
        "dia_nome": "Sexta",
        "titulo_pin": "Gatos e Caixas de Papelão: O Mistério Revelado",
        "descricao_pin": "Por que os gatos são obcecados por caixas de papelão? Descubra as explicações biológicas, desde a redução de estresse até o isolamento térmico, e veja como enriquecer o ambiente do seu felino. #gatos #comportamentofelino #curiosidadespet #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de saber mais sobre comportamento de gatos.",
        "infographic_data": {
            "header": {
                "title": "Gatos e Caixas de Papelão: O Mistério Revelado",
                "subtitle": "POR QUE ELES AMAM ESPAÇOS CONFINADOS?",
                "category": "CURIOSIDADES",
                "schedule": "SEXTA, 19 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Motivos",
                    "type": "list",
                    "icon": "check",
                    "description": "A ciência por trás do amor felino pelo papelão",
                    "content": {
                        "items": [
                            {"label": "Alívio de Estresse", "desc": "Estudos mostram que caixas reduzem os níveis de cortisol rapidamente."},
                            {"label": "Isolamento Térmico", "desc": "Papelão mantém o calor. Gatos preferem ambientes quentes (30-36°C)."},
                            {"label": "Zona de Segurança", "desc": "Espaço ideal para se esconder e observar presas sem ser visto."}
                        ]
                    }
                },
                {
                    "title": "Tipos Ideais",
                    "type": "diagram",
                    "icon": "compare",
                    "description": "Formatos de caixas que fazem mais sucesso",
                    "content": {
                        "nodes": [
                            {"label": "Pequenas", "desc": "Forçam o gato a se encolher, gerando sensação de conforto."},
                            {"label": "Com Aberturas", "desc": "Excelentes para tocas e jogos de esconde-esconde."},
                            {"label": "Grandes com Furos", "desc": "Espaço de exploração com brinquedos inseridos."}
                        ]
                    }
                },
                {
                    "title": "Playground",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Como preparar uma caixa com segurança",
                    "content": {
                        "steps": [
                            {"step": "Inspeção", "options": ["Remover grampos e pregos", "Retirar fitas plásticas"]},
                            {"step": "Posicionamento", "options": ["Área tranquila", "Locais altos e estáveis"]},
                            {"step": "Diversão", "options": ["Adicionar petiscos", "Colocar brinquedos ou catnip"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-06_Segunda_2026-06-22": {
        "posting_time": "2026-06-22 09:00",
        "dia_nome": "Segunda",
        "titulo_pin": "Coprofagia em Cães: Por Que Eles Comem Fezes?",
        "descricao_pin": "Entenda as causas médicas e comportamentais da coprofagia (cão que come fezes). Descubra tratamentos, exames de rotina e manejos eficientes para solucionar este problema comum. #coprofagia #comportamentocanino #saudepet #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de cotar inibidores de coprofagia ou suplementos.",
        "infographic_data": {
            "header": {
                "title": "Coprofagia em Cães: Por Que Eles Comem Fezes?",
                "subtitle": "ENTENDA AS CAUSAS E SAIBA COMO TRATAR",
                "category": "COMPORTAMENTO",
                "schedule": "SEGUNDA, 22 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Causas Médicas",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Fatores fisiológicos que geram a coprofagia",
                    "content": {
                        "nodes": [
                            {"label": "Má Absorção", "desc": "Ingredientes não digeridos saem inteiros e atrativos nas fezes."},
                            {"label": "Verminoses", "desc": "Parasitas roubam nutrientes, gerando fome extrema."},
                            {"label": "Deficiências", "desc": "Falta de enzimas pancreáticas específicas ou nutrientes."}
                        ]
                    }
                },
                {
                    "title": "Comportamental",
                    "type": "table",
                    "icon": "compare",
                    "description": "Fatores emocionais e ambientais envolvidos",
                    "content": {
                        "headers": ["Gatilho", "Comportamento", "Solução"],
                        "rows": [
                            {"gatilho": "Busca de atenção", "comportamento": "Cão come fezes para o dono correr atrás", "solucao": "Recolher sem alarde"},
                            {"gatilho": "Medo de bronca", "comportamento": "Ingere as fezes para esconder a sujeira", "solucao": "Parar de punir o pet"},
                            {"gatilho": "Tédio / Isolamento", "comportamento": "Brinca e consome por falta de estímulo", "solucao": "Enriquecimento ambiental"}
                        ]
                    }
                },
                {
                    "title": "Plano de Ação",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Passos práticos para resolver o hábito",
                    "content": {
                        "steps": [
                            {"step": "Check-up Clínico", "options": ["Exame de fezes (copro)", "Exames de sangue"]},
                            {"step": "Manejo Imediato", "options": ["Limpar fezes sem dar bronca", "Distrair pet com petisco"]},
                            {"step": "Inibidores de Sabor", "options": ["Suplementos antiparasitários", "Produtos específicos na comida"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-07_Quarta_2026-06-24": {
        "posting_time": "2026-06-24 09:00",
        "dia_nome": "Quarta",
        "titulo_pin": "Cognição Canina: Sinais da 'Demência' em Pets Idosos",
        "descricao_pin": "Seu cão idoso troca o dia pela noite ou fica desorientado? Conheça a Síndrome de Disfunção Cognitiva (SDC), popularmente chamada de Alzheimer canino, e saiba como melhorar a qualidade de vida do seu pet sênior. #cãesidosos #saudepet #demenciacanina #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de saber sobre suplementos para cães idosos e saúde cerebral.",
        "infographic_data": {
            "header": {
                "title": "Cognição Canina: Sinais da 'Demência' em Pets Idosos",
                "subtitle": "ENTENDA A SÍNDROME DE DISFUNÇÃO COGNITIVA (SDC)",
                "category": "IDOSOS",
                "schedule": "QUARTA, 24 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Sinais Clínicos",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Sintomas que indicam declínio cognitivo em cães",
                    "content": {
                        "nodes": [
                            {"label": "Desorientação", "desc": "Cão fica preso em cantos, encara paredes ou parece perdido."},
                            {"label": "Troca de Sono", "desc": "Vaga e chora pela noite, dorme profundamente durante o dia."},
                            {"label": "Perda de Hábitos", "desc": "Urina em locais incorretos e esquece comandos básicos."}
                        ]
                    }
                },
                {
                    "title": "SDC vs Velhice",
                    "type": "table",
                    "icon": "compare",
                    "description": "Comparativo entre envelhecimento normal e demência",
                    "content": {
                        "headers": ["Comportamento", "Envelhecimento Saudável", "Disfunção Cognitiva (SDC)"],
                        "rows": [
                            {"comportamento": "Interação Social", "saudavel": "Ligeiramente mais quieto", "sdc": "Ignora visitas e evita carinho"},
                            {"comportamento": "Rotina bucal/sono", "saudavel": "Dorme um pouco mais", "sdc": "Insônia noturna com choro"},
                            {"comportamento": "Reconhecimento", "saudavel": "Reconhece a família e rotina", "sdc": "Assusta-se com pessoas próximas"}
                        ]
                    }
                },
                {
                    "title": "Como Tratar",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Abordagens para retardar o avanço da demência",
                    "content": {
                        "steps": [
                            {"step": "Alimentação Mental", "options": ["Suplementação de Antioxidantes", "Ácidos graxos essenciais (DHA)"]},
                            {"step": "Enriquecimento", "options": ["Brinquedos de farejar", "Caminhadas em rotas novas"]},
                            {"step": "Adaptação na Casa", "options": ["Evitar mudar móveis de lugar", "Colocar tapetes antiderrapantes"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-08_Sexta_2026-06-26": {
        "posting_time": "2026-06-26 09:00",
        "dia_nome": "Sexta",
        "titulo_pin": "Plantas Tóxicas para Pets: O Que Evitar Ter em Casa",
        "descricao_pin": "Algumas plantas comuns em vasos podem ser fatais para cães e gatos. Conheça as principais espécies proibidas, os sintomas de envenenamento e como agir rápido em caso de ingestão acidental. #plantastoxicas #segurancapet #saudepet #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de tirar dúvidas sobre intoxicação pet ou primeiros socorros.",
        "infographic_data": {
            "header": {
                "title": "Plantas Tóxicas para Pets: O Que Evitar Ter em Casa",
                "subtitle": "PREVENÇÃO DE ACIDENTES DOMÉSTICOS COM PLANTAS",
                "category": "SAÚDE PREVENTIVA",
                "schedule": "SEXTA, 26 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Espécies Perigosas",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Plantas populares de alta toxicidade",
                    "content": {
                        "nodes": [
                            {"label": "Comigo-Ninguém-Pode", "desc": "Causa queimação oral extrema, salivação e asfixia."},
                            {"label": "Espada-de-São-Jorge", "desc": "Causa irritação gástrica intensa, vômitos e diarreia."},
                            {"label": "Lírio (Gatos)", "desc": "Extremamente letal para gatos, causa falência renal fulminante."}
                        ]
                    }
                },
                {
                    "title": "Sintomas",
                    "type": "table",
                    "icon": "compare",
                    "description": "Sinais de envenenamento por ingestão de plantas",
                    "content": {
                        "headers": ["Área Afetada", "Sinal Clínico", "Gravidade"],
                        "rows": [
                            {"area": "Boca / Garganta", "sinal": "Salivação excessiva, inchaço da língua", "grav": "Alta (Risco de asfixia)"},
                            {"area": "Gastrointestinal", "sinal": "Vômitos, diarreia, letargia profunda", "grav": "Moderada a Alta"},
                            {"area": "Fisiologia Geral", "sinal": "Tremores, pupilas dilatadas, convulsões", "grav": "Crítica / Emergência"}
                        ]
                    }
                },
                {
                    "title": "Primeiro Socorro",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Conduta imediata pós-ingestão",
                    "content": {
                        "steps": [
                            {"step": "Identificação", "options": ["Fotografar a planta ingerida", "Medir quantidade consumida"]},
                            {"step": "Ação Rápida", "options": ["Lavar boca com água (se corrosivo)", "NÃO induzir vômito sem orientação"]},
                            {"step": "Atendimento", "options": ["Levar pet e planta ao veterinário", "Iniciar fluidoterapia na clínica"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-09_Segunda_2026-06-29": {
        "posting_time": "2026-06-29 09:00",
        "dia_nome": "Segunda",
        "titulo_pin": "Doenças Comuns em Filhotes: Prevenção",
        "descricao_pin": "Filhotes possuem sistema imunológico sensível e estão vulneráveis a viroses e parasitas. Saiba quais são as doenças mais frequentes (como parvovirose e cinomose) e o calendário de prevenção. #filhotes #saudepet #vacinacaopet #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de saber sobre vacinas essenciais ou vermífugos para filhotes.",
        "infographic_data": {
            "header": {
                "title": "Doenças Comuns em Filhotes: Prevenção",
                "subtitle": "PROTEJA SEU FILHOTE DAS VIROSES MAIS GRAVES",
                "category": "SAÚDE",
                "schedule": "SEGUNDA, 29 DE JUNHO | 09:00"
            },
            "columns": [
                {
                    "title": "Viroses Frequentes",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Doenças virais graves que atacam filhotes",
                    "content": {
                        "nodes": [
                            {"label": "Parvovirose", "desc": "Provoca diarreia hemorrágica severa e desidratação rápida."},
                            {"label": "Cinomose", "desc": "Ataca o sistema respiratório, digestivo e atinge o neurológico."},
                            {"label": "Coronavirose", "desc": "Causa infecção intestinal altamente contagiosa em cães novos."}
                        ]
                    }
                },
                {
                    "title": "Sinais de Alerta",
                    "type": "table",
                    "icon": "compare",
                    "description": "Identificando sintomas iniciais de doenças",
                    "content": {
                        "headers": ["Sintoma", "Aparência", "Ação Recomendada"],
                        "rows": [
                            {"sintoma": "Gastrointestinal", "aparencia": "Vômitos frequentes e diarreia escura", "acao": "Internação imediata"},
                            {"sintoma": "Respiratório", "aparencia": "Corrimento nasal/ocular e tosses", "acao": "Consulta em até 24h"},
                            {"sintoma": "Geral", "aparencia": "Tristeza profunda, recusa em brincar", "acao": "Monitorar temperatura"}
                        ]
                    }
                },
                {
                    "title": "Prevenção",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Protocolo de saúde nos primeiros meses",
                    "content": {
                        "steps": [
                            {"step": "Vacinação", "options": ["V8/V10 aos 45 dias", "3 doses com intervalo de 21 dias"]},
                            {"step": "Isolamento", "options": ["NÃO passear na rua", "NÃO aproximar de cães não vacinados"]},
                            {"step": "Parasitas", "options": ["Vermifugação mensal", "Controle de pulgas e carrapatos"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    },
    "Post-10_Quarta_2026-07-01": {
        "posting_time": "2026-07-01 09:00",
        "dia_nome": "Quarta",
        "titulo_pin": "O Sexto Sentido dos Pets: Como eles Percebem o Mundo",
        "descricao_pin": "Como cães e gatos percebem o ambiente? Conheça os incríveis sentidos aguçados dos pets, desde a audição ultrassônica até a detecção de mudanças barométricas antes de tempestades. #sentidospet #curiosidadesanimais #otimizafarmavet",
        "whatsapp_link": "https://wa.me/5531987936822?text=Olá! Vim pelo Pinterest e gostaria de saber mais sobre comportamento e bem-estar dos pets.",
        "infographic_data": {
            "header": {
                "title": "O Sexto Sentido dos Pets: Como eles Percebem o Mundo",
                "subtitle": "A INCRÍVEL BIOLOGIA DOS SENTIDOS DE CÃES E GATOS",
                "category": "CURIOSIDADES",
                "schedule": "QUARTA, 01 DE JULHO | 09:00"
            },
            "columns": [
                {
                    "title": "Super Sentidos",
                    "type": "diagram",
                    "icon": "check",
                    "description": "Capacidades sensoriais muito superiores às humanas",
                    "content": {
                        "nodes": [
                            {"label": "Super Olfato", "desc": "Cães possuem até 300 milhões de receptores olfativos na trufa."},
                            {"label": "Audição Aguçada", "desc": "Gatos escutam frequências inaudíveis para nós (ultrassons)."},
                            {"label": "Tapete Lúcido", "desc": "Membrana ocular que reflete luz e otimiza visão na penumbra."}
                        ]
                    }
                },
                {
                    "title": "Percepções",
                    "type": "table",
                    "icon": "compare",
                    "description": "Coisas incríveis que os pets conseguem detectar",
                    "content": {
                        "headers": ["Fenômeno", "Como Detectam", "Reação do Pet"],
                        "rows": [
                            {"fenomeno": "Tempestades", "como": "Queda na pressão barométrica", "reacao": "Busca abrigo / Fica inquieto"},
                            {"fenomeno": "Diabetes / Crise", "como": "Odores químicos na pele", "reacao": "Lamber ou alertar tutor"},
                            {"fenomeno": "Emoções", "como": "Leitura de microexpressões", "reacao": "Aproximação afetiva"}
                        ]
                    }
                },
                {
                    "title": "Como Apoiar",
                    "type": "flowchart",
                    "icon": "bulb",
                    "description": "Cuidados para respeitar a sensibilidade do pet",
                    "content": {
                        "steps": [
                            {"step": "Estímulos Olfativos", "options": ["Deixar cheirar no passeio", "Farejamento de petiscos"]},
                            {"step": "Proteção Auditiva", "options": ["Evitar som muito alto em casa", "Proteger de fogos de artifício"]},
                            {"step": "Ambiente Calmo", "options": ["Evitar luzes piscantes", "Respeitar sonecas no escuro"]}
                        ]
                    }
                }
            ],
            "footer": {
                "cta_text": "Dúvidas? Chame no WhatsApp!",
                "hashtags": "#saudepet #otimizafarmavet"
            }
        }
    }
}

for folder_name, data in rich_data.items():
    # Encontrar a pasta física correspondente ignorando o dia da semana se necessário,
    # mas o nome das pastas foi gerado no formato: Post-XX_Dia_Data
    # Vamos buscar no diretório do base_dir as pastas que começam com o mesmo prefixo ex: Post-01_
    prefix = folder_name.split("_")[0] # ex: Post-01
    
    matched_folder = None
    if os.path.exists(base_dir):
        for name in os.listdir(base_dir):
            if name.startswith(prefix) and os.path.isdir(os.path.join(base_dir, name)):
                matched_folder = os.path.join(base_dir, name)
                break
                
    if matched_folder:
        json_path = os.path.join(matched_folder, "infographic_data.json")
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[OK] Atualizado JSON rico para: {json_path}")
        except Exception as e:
            print(f"[ERROR] Falha ao salvar JSON em {json_path}: {e}")
    else:
        print(f"[WARN] Pasta com prefixo {prefix} não encontrada.")

# Também salvar o arquivo geral atualizado na pasta central do projeto
central_json_path = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Manual-Semanal\calendario_posts_pinterest.json"
try:
    with open(central_json_path, 'w', encoding='utf-8') as f:
        # Exportar uma lista de todas as estruturas ricas
        all_posts_list = list(rich_data.values())
        json.dump(all_posts_list, f, ensure_ascii=False, indent=2)
    print(f"[OK] Atualizado JSON rico geral em: {central_json_path}")
except Exception as e:
    print(f"[ERROR] Falha ao salvar JSON rico geral: {e}")

# Salvar também no projeto-pinterest
project_json_path = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\projeto-pinterest\calendario_posts_pinterest.json"
try:
    with open(project_json_path, 'w', encoding='utf-8') as f:
        all_posts_list = list(rich_data.values())
        json.dump(all_posts_list, f, ensure_ascii=False, indent=2)
    print(f"[OK] Atualizado JSON rico de desenvolvimento em: {project_json_path}")
except Exception as e:
    print(f"[ERROR] Falha ao salvar JSON rico de desenvolvimento: {e}")
