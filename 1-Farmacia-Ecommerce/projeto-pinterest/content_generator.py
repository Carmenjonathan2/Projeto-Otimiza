import json
import random
import os
import re
from typing import Dict
from preventor_duplicidades import PreventorDuplicidades
import google.generativeai as genai
import config
from dotenv import load_dotenv

load_dotenv()

class ContentGenerator:
    def __init__(self, db_path="content_database.json"):
        self.db_path = db_path
        self.content_db = self._load_database()
        self.preventor = PreventorDuplicidades()
        
        # Configure AI (Google Generative AI or Vertex AI)
        self.use_ai = False
        self.model = None
        
        # 1. Try Google Generative AI (API Key) - Proven to work in this environment
        if config.GOOGLE_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=config.GOOGLE_API_KEY)
                self.model = genai.GenerativeModel('gemini-flash-latest')
                self.use_ai = True
                print("[OK] Google Generative AI configurado via API Key.")
            except Exception as e:
                print(f"[WARN] Erro ao configurar Google GenAI: {e}")

        # 2. Try Vertex AI (GCP) as fallback
        if not self.use_ai:
            project_id = os.getenv("GOOGLE_PROJECT_ID")
            location = os.getenv("GOOGLE_LOCATION", "us-central1")
            
            if project_id:
                try:
                    import vertexai
                    from vertexai.generative_models import GenerativeModel
                    vertexai.init(project=project_id, location=location)
                    self.model = GenerativeModel("gemini-1.5-flash") 
                    self.use_ai = True
                    print(f"[OK] Vertex AI configurado (Projeto: {project_id})")
                except Exception as e:
                    print(f"[WARN] Erro ao configurar Vertex AI: {e}")
        
        # Brand System Rules
        self.brand_rules = {
            "prohibited": [
                r"cachorrinho", r"gatinho", r"bichinho", r"petzinho", r"totózinho",
                r"amigo de quatro patas", r"peludinho", r"filho de quatro patas",
                r"mamãe de pet", r"papai de pet", r"paidog", r"maedog",
                r"você sabia\?", r"no mundo de hoje", r"nos dias atuais",
                r"excelência", r"soluções inovadoras", r"sinergia", r"disrupção",
                r"o melhor da região", r"atendimento nota 10", r"qualidade incomparável",
                r"últimas unidades", r"corre!!!", r"para quem ama de verdade",
                r"espero ter ajudado", r"qualquer dúvida, estamos à disposição", r"obrigado pela atenção"
            ],
            "personas": {
                "Kyenner": {
                    "role": "Dr. Kyenner (veterinário e co-fundador)",
                    "tone": "Didático, firme, protetor. Usa termos técnicos mas explica. 'Como veterinário, eu te digo...'",
                    "signature": "Dr. Kyenner, veterinário Otimiza FarmaVet 🩺",
                    "emojis": ["🩺", "🟣", "✅"]
                },
                "Carmen": {
                    "role": "Carmen (CEO)",
                    "tone": "Visionária, direta, resolutiva. Fala de processo, custo-benefício, tempo. 'Fiz as contas por você...'",
                    "signature": "Carmen, CEO Otimiza FarmaVet 🟣",
                    "emojis": ["🟣", "📊", "✅"]
                },
                "Aika": {
                    "role": "Aika (mascote oficial)",
                    "tone": "Fofa, bem-humorada, meiga mas esperta. 'Oi! Sou eu, a Aika...'",
                    "signature": "Aika, mascote oficial 🐾",
                    "emojis": ["🐾", "🟣", "✨"]
                }
            }
        }

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

    def _apply_prohibitions(self, text: str) -> str:
        """Removes prohibited words and applies brand vocabulary."""
        for pattern in self.brand_rules["prohibited"]:
            text = re.sub(pattern, "pet", text, flags=re.IGNORECASE)
        
        # Specific replacements
        text = text.replace("seu animalzinho", "seu pet")
        text = text.replace("o bichinho", "o pet")
        
        return text

    def _select_persona(self, category: str) -> Dict:
        """Selects the best persona for the category based on Brand System."""
        if category in ["Saúde", "Saúde Preventiva", "Primeiros Socorros", "Idosos"]:
            return self.brand_rules["personas"]["Kyenner"]
        elif category in ["Nutrição", "Higiene", "Longevidade"]:
            return self.brand_rules["personas"]["Carmen"]
        else:
            return self.brand_rules["personas"]["Aika"]

    def _generate_with_ai(self, topic: Dict, persona: Dict) -> str:
        """Generates blog content using Gemini following Brand System instructions."""
        prompt = f"""
        VOCÊ É: {persona['role']}.
        ESTILO DE VOZ: {persona['tone']}.
        
        TAREFA: Escreva um artigo rico e educativo para o blog da Otimiza FarmaVet sobre o tema: "{topic['title']}".
        
        REGRAS DE OURO (NÃO NEGOCIÁVEIS):
        1. NUNCA use diminutivos como 'cachorrinho', 'gatinho' ou 'petzinho'. Use 'cachorro', 'gato' ou 'pet'.
        2. NUNCA use 'papai/mamãe de pet'. Use 'tutor', 'tutora' ou 'você'.
        3. NUNCA inicie com clichês como 'Você sabia?' ou 'No mundo de hoje'.
        4. LOCALIZAÇÃO: Somos de Belo Horizonte. Cite bairros como Savassi, Pampulha ou Buritis se fizer sentido.
        5. TONS: Não use medo como gatilho. Seja empático e confiante.
        6. FORMATAÇÃO: Use negrito para destacar pontos essenciais (preços, nomes de produtos, ações).
        7. EMOJIS: Use os permitidos: {', '.join(persona['emojis'])}. (Nota: O limite de 1 emoji por parágrafo não se aplica a este formato de blog longo).
        8. PARÁGRAFOS: Podem ser mais longos que 5 linhas se necessário, por ser um artigo de blog.
        9. ASSINATURA: Termine com: "{persona['signature']}".
        
        CONTEÚDO BASE: {topic['description']}
        
        FORMATO: Use HTML para estruturar o texto (<h2>, <p>, <ul>, <li>).
        """
        
        try:
            response = self.model.generate_content(prompt)
            return self._apply_prohibitions(response.text)
        except Exception as e:
            print(f"[ERROR] Erro na geração Gemini: {e}. Usando fallback.")
            return None

    def _create_rich_content(self, topic: Dict) -> str:
        """
        Cria conteúdo RICO e EDUCATIVO para blog seguindo o Brand System.
        """
        category = topic.get("category", "Geral")
        persona = self._select_persona(category)
        
        # Tentar gerar com IA
        if self.use_ai:
            ai_content = self._generate_with_ai(topic, persona)
            if ai_content:
                # Wrap with brand container and CTA
                return self._wrap_brand_content(ai_content, topic, persona)

        # Fallback (Manual templates updated to Brand System)
        return self._create_fallback_content(topic, persona)

    def _wrap_brand_content(self, html_body: str, topic: Dict, persona: Dict) -> str:
        """Wraps the content in a brand-consistent HTML structure."""
        keywords = topic.get("keywords", [])
        
        html_content = f"""
        <div class="otimiza-article" style="font-family: sans-serif; color: #333; line-height: 1.8;">
            <div class="article-body">
                {html_body}
            </div>

            <div class="cta-section" style="margin: 3em 0; padding: 2.5em; background: linear-gradient(135deg, #470C51 0%, #6C0C51 100%); border-radius: 15px; color: white; text-align: center; box-shadow: 0 10px 20px rgba(71, 12, 81, 0.2);">
                <h3 style="color: white; margin-bottom: 1em; font-size: 1.6em;">
                    🏠 Atendimento Veterinário em Casa em BH
                </h3>
                <p style="font-size: 1.15em; margin-bottom: 2em; line-height: 1.6; opacity: 0.9;">
                    A Otimiza FarmaVet leva o cuidado até você. Sem estresse de trânsito na Savassi ou salas de espera lotadas.
                    Consultas, vacinas e exames no conforto do seu lar.
                </p>
                <p style="margin-bottom: 0;">
                    <a href="https://otimizafarmavet.com.br/pages/agendamento" 
                       style="display: inline-block; background: white; color: #470C51; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 1.2em; transition: all 0.3s ease;">
                        Agendar com a Otimiza →
                    </a>
                </p>
            </div>

            <div class="article-footer" style="margin-top: 3em; padding-top: 2em; border-top: 2px solid #f0f0f0;">
                <p style="color: #999; font-size: 0.9em; margin-bottom: 1.5em;">
                    <strong>Tags:</strong> {', '.join(keywords[:5])}
                </p>
                
                <div class="disclaimer" style="background: #fff9e6; padding: 1.5em; border-radius: 10px; border-left: 5px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 0.9em; line-height: 1.6;">
                        <strong>⚠️ Aviso da Otimiza:</strong> Este conteúdo é educativo e não substitui a consulta veterinária presencial. 
                        Cada pet é único e merece uma avaliação individualizada por um profissional qualificado.
                    </p>
                </div>
            </div>
        </div>
        """
        return html_content

    def _create_fallback_content(self, topic: Dict, persona: Dict) -> str:
        """Manual content generation as fallback, following basic Brand System rules."""
        title = topic["title"]
        subtitle = topic["subtitle"]
        description = topic["description"]
        
        # Simple structure following the persona
        html_body = f"""
        <h2>{title}</h2>
        <p><strong>{subtitle}</strong></p>
        <p>{description}</p>
        <p>Como parte da família Otimiza, acreditamos que a saúde do pet começa com informação de qualidade e carinho.</p>
        <p>Assinado, <br>{persona['signature']}</p>
        """
        return self._wrap_brand_content(self._apply_prohibitions(html_body), topic, persona)

    def generate_pin_content(self) -> Dict:
        """Selects and enhances a topic from the database for Blog/Pinterest."""
        if not self.content_db["topics"]:
            raise Exception("Banco de dados vazio.")
        
        # Shuffle for variety
        topics_disponiveis = self.content_db["topics"].copy()
        random.shuffle(topics_disponiveis)
        
        for topic in topics_disponiveis:
            titulo = topic["title"]
            descricao_original = topic["description"]
            
            pode_publicar, _ = self.preventor.pode_publicar(
                titulo=titulo,
                conteudo=descricao_original,
                intervalo_dias=90
            )
            
            if pode_publicar:
                print(f"[OK] Gerando conteúdo Brand System para: {titulo}")
                rich_content = self._create_rich_content(topic)
                
                return {
                    "title": topic["title"],
                    "subtitle": topic["subtitle"],
                    "description": rich_content,
                    "original_desc": topic["description"],
                    "hashtags": topic["hashtags"],
                    "category": topic.get("category", "Geral"),
                    "keywords": topic.get("keywords", [])
                }
        
        raise Exception("Todos os tópicos foram publicados recentemente.")

if __name__ == "__main__":
    generator = ContentGenerator()
    content = generator.generate_pin_content()
    print("=" * 60)
    print(f"TÍTULO: {content['title']}")
    print("=" * 60)
    print(content['description'][:500] + "...")

