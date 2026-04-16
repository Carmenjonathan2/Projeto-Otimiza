import os
import re
import random
import textwrap
import google.generativeai as genai
from PIL import Image
import io
import config
from dotenv import load_dotenv
from validador_coerencia import ValidadorCoerencia

load_dotenv()

class ImageCreator:
    def __init__(self):
        self.validador = ValidadorCoerencia()  # Validador de coerência blog vs imagem
        self.size = config.IMAGE_SIZE
        
        # Converter cores hex para RGB
        self.colors = {}
        for key, value in config.BRAND_COLORS.items():
            if isinstance(value, str) and value.startswith('#'):
                h = value.lstrip('#')
                self.colors[key] = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
            else:
                self.colors[key] = value
        self.use_ai = False
        self.model = None
        
        # Tentar configurar Google Vertex AI (Imagen)
        try:
            import vertexai
            from vertexai.preview.vision_models import ImageGenerationModel
            
            # Tentar pegar credenciais do .env ou usar defaults do sistema (gcloud auth)
            project_id = os.getenv("GOOGLE_PROJECT_ID")
            location = os.getenv("GOOGLE_LOCATION", "us-central1")
            
            # Inicializar Vertex AI
            if project_id:
                print(f"[INIT] Inicializando Vertex AI com projeto: {project_id}")
                vertexai.init(project=project_id, location=location)
            else:
                print("[INIT] Tentando inicializar Vertex AI com Default Credentials...")
                vertexai.init(location=location)
                
            # Carregar modelo Imagen
            # Usando imagegeneration@006 (melhor qualidade atual)
            self.model = ImageGenerationModel.from_pretrained("imagegeneration@006")
            self.use_ai = True
            print("[OK] Google Vertex AI (Imagen) configurado com sucesso!")
            
        except ImportError:
            print("[WARN] Biblioteca google-cloud-aiplatform não instalada.")
            print("       Execute: pip install google-cloud-aiplatform")
        except Exception as e:
            print(f"[WARN] Erro ao configurar Vertex AI: {e}")
            print("       Verifique se você fez login com: gcloud auth application-default login")
            print("       Ou defina GOOGLE_PROJECT_ID no arquivo .env")
            
        if not self.use_ai:
            print("[INFO] Usando metodo placeholder visual (sem IA)")

    def _create_optimized_prompt(self, title, subtitle, category="Geral"):
        """
        Cria prompts de FOTOGRAFIA AUTÊNTICA (Estilo Lifestyle Real)
        Versão 6.0 - Foco em Naturalidade e Imperfeições Fotográficas
        """
        
        # 1. Detecção de Animal
        def detectar_animal(texto):
            texto = texto.lower()
            texto = re.sub(r'[áàâãä]', 'a', texto)
            if any(x in texto for x in ['cao', 'caes', 'cachorro', 'canin', 'dog', 'puppy']):
                return "dog"
            if any(x in texto for x in ['gato', 'felin', 'cat', 'kitten', 'ronronar']):
                return "cat"
            if any(x in texto for x in ['porquinho', 'guinea pig', 'roedor', 'hamster', 'cavy']):
                return "guinea_pig"
            return "unknown"

        pet_type = detectar_animal(title)
        
        # 2. Biblioteca de Sujeitos (Mais realistas)
        subjects = {
            "dog": [
                "a real pet dog relaxing", "a pet dog looking at the camera", 
                "a family dog in a home setting", "a street-mix dog with authentic fur", "a happy dog in a natural pose"
            ],
            "cat": [
                "a real house cat on a sofa", "a curious cat exploring", 
                "a pet cat sitting by the window", "a domestic cat with natural textures", "a cat in a candid moment"
            ],
            "guinea_pig": [
                "a real pet guinea pig on the floor", "a small rodent in a garden", "a pet cavy with realistic fur"
            ],
            "unknown": ["a healthy domestic pet in a real home"]
        }

        # 3. Contexto de Categoria (Menos 'comercial', mais 'momento')
        category_map = {
            "Nutrição": "Interacting with a simple pet bowl, natural eating moment, real pet food texture.",
            "Saúde Preventiva": "A calm moment at a veterinary clinic, authentic pet healthcare interaction, soft natural lighting.",
            "Saúde": "A calm moment at a veterinary clinic, authentic pet healthcare interaction, soft natural lighting.",
            "Higiene": "A candid grooming moment at home, soft light on the fur, authentic home care.",
            "Comportamento": "Capture a spontaneous pet action, playing naturally in a living room, unposed moment.",
            "Small Pets": "Macro photography of a small pet, focus on whiskers and nose, natural bedding environment.",
            "Longevidade": "A peaceful senior pet resting in a sunlit corner, dignified aging, authentic calm atmosphere.",
            "Idosos": "A peaceful senior pet resting in a sunlit corner, dignified aging, authentic calm atmosphere."
        }
        
        ctx = category_map.get(category, "A candid lifestyle shot of a pet in an organic home environment.")
        
        # 4. Estética de Fotografia Real (Fujifilm / Canon Lifestyle)
        environments = [
            "cluttered cozy living room", "unmade bed with soft sheets", "sun-drenched wooden floor", 
            "backyard with natural grass", "modern minimalist apartment", "lush green garden with flowers",
            "cozy kitchen floor with ceramic tiles", "stylish balcony with city view", "soft rug in a bright bedroom"
        ]
        lights = [
            "natural morning sunlight", "diffused daylight from a nearby window", "warm afternoon glow", 
            "organic indoor ambient light", "soft dusk lighting", "dappled sunlight through tree leaves",
            "bright midday sun with sharp shadows", "moody evening indoor lighting"
        ]
        
        # O SEGREDO: Especificações de câmera real e imperfeições
        styles = [
            "Candid lifestyle photography, shot on 35mm lens, f/2.8.",
            "Authentic home moment, Fujifilm film simulation aesthetic, slight film grain.",
            "Unposed pet portrait, natural depth of field, realistic fur clumping.",
            "Documentary style pet photography, soft focus, organic colors.",
            "High-end pet photography, clean minimalist composition, sharp details on eyes.",
            "Warm cinematic pet portrait, soft bokeh background, rich color palette.",
            "Golden hour outdoor pet photography, backlight flare, soft natural contrasts.",
            "Minimalist studio-style pet portrait, solid neutral background, professional lighting."
        ]

        prompt = f"""{random.choice(styles)}
SUBJECT: {random.choice(subjects[pet_type])} {random.choice(environments)}.
CONTEXT: {ctx}
ATMOSPHERE: {random.choice(lights)}.
TECHNICAL: Atmospheric perspective, natural skin/fur texture, no artificial highlights, authentic shadows, 4k photographic quality.

NEGATIVE: airbrushed, plastic skin, CGI, 3d render, cartoon, digital art, high-pass filter, over-sharpened, over-saturated, perfectly symmetrical, fake reflections, studio strobe light, watermark, text, neon eyes, glowing eyes, radioactive colors, extra paws, deformed limbs, malformed anatomy, extra fingers."""

        return prompt.strip()

    def create_pin_image(self, title, subtitle, output_path, category="Geral", aspect_ratio="9:16"):
        """Versão 5.0 - Texto no Rodapé e Força IA"""
        original_title = title
        final_path = None
        
        if self.use_ai and self.model:
            try:
                # Tentar 3 vezes gerar um prompt que passe no validador
                max_tentativas = 3
                prompt = ""
                aprovado = False
                relatorio_final = None
                
                for tentativa in range(1, max_tentativas + 1):
                    prompt = self._create_optimized_prompt(title, subtitle, category)
                    aprovado, mensagem, relatorio = self.validador.validar_coerencia_completa(
                        titulo=title, categoria=category, descricao=subtitle, prompt_imagem=prompt
                    )
                    
                    if aprovado:
                        relatorio_final = relatorio
                        print(f"[OK] Prompt aprovado (Score: {relatorio['score_geral']:.2f})")
                        break
                    print(f"[RETRY] Prompt {tentativa} reprovado: {mensagem}")
                
                if not aprovado:
                    print(f"[ERRO] Falha ao gerar prompt coerente após {max_tentativas} tentativas.")
                    final_path = self._create_fallback_image(original_title, subtitle, output_path)
                else:
                    print(f"[IMG] Gerando imagem via Vertex AI (Score: {relatorio_final['score_geral']:.2f})...")
                    response = self.model.generate_images(
                        prompt=prompt, number_of_images=1, aspect_ratio=aspect_ratio,
                        person_generation="allow_adult", safety_filter_level="block_medium_and_above"
                    )
                    
                    if response and response.images:
                        response.images[0].save(location=output_path, include_generation_parameters=False)
                        print(f"[OK] Imagem Vertex AI salva em: {output_path}")
                        final_path = output_path
                    else:
                        print(f"[WARN] Vertex AI retornou vazio. Ativando fallback.")
                        final_path = self._create_fallback_image(original_title, subtitle, output_path)
            except Exception as e:
                import traceback
                print(f"[ERROR] Erro na geração IA: {e}")
                traceback.print_exc()
                final_path = self._create_fallback_image(original_title, subtitle, output_path)
        else:
            final_path = self._create_fallback_image(original_title, subtitle, output_path)

        # 🚀 APLICAR OVERLAY DE TEXTO
        if final_path and os.path.exists(final_path):
            try:
                self._apply_text_overlay(final_path, original_title, category)
                print(f"[OK] Overlay de texto aplicado com sucesso.")
            except Exception as e:
                print(f"[WARN] Erro ao aplicar overlay: {e}")
            
        return final_path

    def _apply_text_overlay(self, image_path, title, category):
        """Design V5: Texto no Rodapé (Pinterest Modern Style)"""
        from PIL import ImageDraw, ImageFont
        
        img = Image.open(image_path).convert("RGBA")
        width, height = img.size
        overlay = Image.new('RGBA', img.size, (0,0,0,0))
        draw = ImageDraw.Draw(overlay)

        # 1. Fontes
        try:
            font_main = ImageFont.truetype("arialbd.ttf", 65)
            font_tag = ImageFont.truetype("arial.ttf", 32)
        except:
            font_main = ImageFont.load_default()
            font_tag = ImageFont.load_default()

        # 2. Organizar Texto
        title_clean = title.split('(')[0].strip().upper()
        lines = textwrap.wrap(title_clean, width=22)
        
        # 3. Caixa de Texto (Posição Inferior)
        padding = 40
        line_height = 80
        box_h = (len(lines) * line_height) + 120
        box_y = height - box_h - 100 # 100px acima do fundo
        
        # Fundo Roxo Otimiza (Opacidade 90%)
        brand_color = self.colors.get('primary', (71, 12, 81))
        draw.rectangle(
            [(50, box_y), (width - 50, box_y + box_h)],
            fill=(brand_color[0], brand_color[1], brand_color[2], 230)
        )

        # 4. Escrever
        current_y = box_y + padding
        for line in lines:
            w = draw.textlength(line, font=font_main)
            draw.text(((width - w) / 2, current_y), line, font=font_main, fill=(255, 255, 255))
            current_y += line_height
            
        tag = f"OTIMIZA FARMAVET | {category.upper()}"
        tw = draw.textlength(tag, font=font_tag)
        draw.text(((width - tw) / 2, current_y + 10), tag, font=font_tag, fill=(255, 255, 255, 180))

        img = Image.alpha_composite(img, overlay).convert("RGB")
        img.save(image_path, "PNG")

    def _create_fallback_image(self, title, subtitle, output_path):
        """
        Método placeholder aprimorado
        """
        from PIL import ImageDraw, ImageFilter
        
        print(f"[FALLBACK] Gerando imagem base para: {title}")
        
        # Gradiente base
        img = Image.new('RGB', self.size, color=self.colors['primary'])
        draw = ImageDraw.Draw(img)
        
        # Simular iluminação
        for y in range(self.size[1]):
            ratio = y / self.size[1]
            r = int(self.colors['primary'][0] * (1 - ratio * 0.5))
            g = int(self.colors['primary'][1] * (1 - ratio * 0.5))
            b = int(self.colors['primary'][2] * (1 - ratio * 0.5))
            draw.line([(0, y), (self.size[0], y)], fill=(r, g, b))
        
        img.save(output_path)
        return output_path


if __name__ == "__main__":
    # Teste
    creator = ImageCreator()
    creator.create_pin_image(
        "Vacinação de Cães e Gatos", 
        "Proteja seu melhor amigo",
        "test_pin_ai.png",
        "Saúde Preventiva"
    )
