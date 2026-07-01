"""
Script de teste para validar a configuração do Google Vertex AI (Imagen)
"""
import os
from dotenv import load_dotenv

# Carregar .env
load_dotenv()

print("=" * 60)
print("TESTE DE CONFIGURAÇÃO - GOOGLE VERTEX AI (IMAGEN)")
print("=" * 60)

# 1. Verificar variáveis de ambiente
print("\n[1] Verificando variaveis de ambiente...")
project_id = os.getenv("GOOGLE_PROJECT_ID")
location = os.getenv("GOOGLE_LOCATION", "us-central1")

if project_id:
    print(f"   [+] GOOGLE_PROJECT_ID: {project_id}")
else:
    print("   [-] GOOGLE_PROJECT_ID nao configurado no .env")
    
print(f"   [+] GOOGLE_LOCATION: {location}")

# 2. Testar import do Vertex AI
print("\n[2] Testando imports do Vertex AI...")
try:
    import vertexai
    from vertexai.preview.vision_models import ImageGenerationModel
    print(f"   [+] vertexai importado com sucesso (versao {vertexai.__version__})")
except ImportError as e:
    print(f"   [-] Erro ao importar vertexai: {e}")
    exit(1)

# 3. Testar inicializacao do Vertex AI
print("\n[3] Testando inicializacao do Vertex AI...")
try:
    if project_id:
        vertexai.init(project=project_id, location=location)
        print(f"   [+] Vertex AI inicializado com projeto '{project_id}'")
    else:
        print("   [-] Nao e possivel inicializar sem GOOGLE_PROJECT_ID")
        exit(1)
except Exception as e:
    print(f"   [-] Erro ao inicializar Vertex AI: {e}")
    print("\n   SOLUCAO:")
    print("   Execute: gcloud auth application-default login")
    print("   E escolha o projeto: pinterest-otimiza-farmavet")
    exit(1)

# 4. Testar carregamento do modelo Imagen
print("\n[4] Testando carregamento do modelo Imagen...")
try:
    model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-002")
    print("   [+] Modelo Imagen carregado com sucesso (imagen-3.0-generate-002)")
except Exception as e:
    print(f"   [-] Erro ao carregar modelo: {e}")
    exit(1)

# 5. Testar geracao de imagem
print("\n[5] Testando geracao de imagem...")
print("   Gerando imagem de teste (pode levar 10-30 segundos)...")

test_prompt = """PROFESSIONAL EDITORIAL PET PHOTOGRAPHY - TEST IMAGE

SUBJECT: adorable golden retriever puppy with expressive brown eyes happily playing with a colorful toy in a bright, airy Brazilian home.

SCENE DETAILS: The puppy has perfectly groomed, soft and shiny golden fur catching natural light. Captured mid-play with an endearing, joyful expression showing genuine happiness.

LIGHTING: Golden hour sunlight streaming through large windows creates a warm, inviting glow with soft shadows.

BACKGROUND & ENVIRONMENT: Clean, modern Brazilian home interior with light wood floors, white walls, and green plants. Background softly blurred using shallow depth of field.

COMPOSITION & CAMERA: Shot at pet eye-level using 50mm prime lens. Rule of thirds applied. Shallow depth of field isolates subject beautifully.

MOOD & ATMOSPHERE: Warm, playful, and joyful - celebrating the fun side of pet ownership.

TECHNICAL SPECIFICATIONS: Shot with professional DSLR, 50mm f/1.8 lens, ISO 400, 1/250s shutter speed.

STYLE REQUIREMENTS:
- Photorealistic, magazine-quality editorial photography
- Pinterest-optimized vertical composition (2:3 ratio)
- Professional color grading with natural, vibrant tones
- Authentic Brazilian context
- Sharp focus on subject with beautiful bokeh background
- No text overlays, watermarks, or graphic elements
- Suitable for veterinary marketing and Pinterest

PHOTOGRAPHY STYLE: Editorial pet photography, lifestyle documentation."""

try:
    # Criar pasta de output se não existir
    output_dir = "test_images_vertex_ai"
    os.makedirs(output_dir, exist_ok=True)
    
    response = model.generate_images(
        prompt=test_prompt,
        number_of_images=1,
        aspect_ratio="9:16",
        person_generation="allow_adult",
        safety_filter_level="block_medium_and_above"
    )
    
    if response and response.images:
        # Salvar imagem de teste na pasta dedicada
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_output = os.path.join(output_dir, f"test_vertex_{timestamp}.png")
        response.images[0].save(location=test_output, include_generation_parameters=False)
        print(f"   [+] Imagem gerada com sucesso!")
        print(f"   [+] Salva em: {test_output}")
        print(f"\n   Abra a pasta '{output_dir}' para verificar a qualidade da imagem.")
    else:
        print("   [-] Nenhuma imagem foi retornada pelo modelo")
        
except Exception as e:
    print(f"   [-] Erro ao gerar imagem: {e}")
    exit(1)

print("\n" + "=" * 60)
print("[+] TODOS OS TESTES PASSARAM COM SUCESSO!")
print("=" * 60)
print("\nVoce esta pronto para usar o Vertex AI Imagen no seu projeto!")
print("Execute: python pinterest_automation.py --test")
print("")
