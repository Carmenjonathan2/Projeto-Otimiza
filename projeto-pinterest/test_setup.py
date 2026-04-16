"""
Script de teste para validar configuração completa do sistema
"""
import os
import sys
from dotenv import load_dotenv

print("=" * 60)
print("TESTE DE CONFIGURACAO - Pinterest Automation")
print("=" * 60)

# 1. Testar carregamento do .env
print("\n[1] Testando arquivo .env...")
load_dotenv()

google_key = os.getenv("GOOGLE_API_KEY")
pinterest_token = os.getenv("PINTEREST_ACCESS_TOKEN")

if google_key and google_key != "your_google_api_key_here":
    print("   [OK] Google API Key encontrada")
    print(f"   [INFO] Key: {google_key[:20]}...")
else:
    print("   [ERRO] Google API Key nao configurada")
    sys.exit(1)

if pinterest_token:
    print("   [OK] Pinterest Access Token encontrada")
else:
    print("   [AVISO] Pinterest Access Token nao encontrada")

# 2. Testar importação de módulos
print("\n[2] Testando importacao de modulos...")

try:
    from content_generator import ContentGenerator
    print("   [OK] ContentGenerator importado")
except Exception as e:
    print(f"   [ERRO] Erro ao importar ContentGenerator: {e}")
    sys.exit(1)

try:
    from image_creator import ImageCreator
    print("   [OK] ImageCreator importado")
except Exception as e:
    print(f"   [ERRO] Erro ao importar ImageCreator: {e}")
    sys.exit(1)

try:
    from shopify_manager import ShopifyManager
    print("   [OK] ShopifyManager importado")
except Exception as e:
    print(f"   [ERRO] Erro ao importar ShopifyManager: {e}")
    sys.exit(1)

# 3. Testar geração de conteúdo
print("\n[3] Testando geracao de conteudo...")
try:
    generator = ContentGenerator()
    content = generator.generate_pin_content()
    print(f"   [OK] Conteudo gerado: {content['title']}")
    print(f"   [INFO] Categoria: {content['category']}")
    print(f"   [INFO] Hashtags: {', '.join(content['hashtags'])}")
    print(f"   [INFO] Keywords: {len(content.get('keywords', []))} keywords")
except Exception as e:
    print(f"   [ERRO] Erro ao gerar conteudo: {e}")
    sys.exit(1)

# 4. Testar configuração do ImageCreator
print("\n[4] Testando configuracao do ImageCreator...")
try:
    image_creator = ImageCreator()
    if image_creator.use_ai:
        print("   [OK] Google Imagen configurado e pronto")
        print("   [INFO] Modo: Geracao com IA")
    else:
        print("   [AVISO] Google Imagen nao disponivel")
        print("   [INFO] Modo: Fallback (design basico)")
except Exception as e:
    print(f"   [ERRO] Erro ao configurar ImageCreator: {e}")
    sys.exit(1)

# 5. Testar banco de dados de conteúdo
print("\n[5] Testando banco de dados de conteudo...")
try:
    import json
    with open('content_database.json', 'r', encoding='utf-8') as f:
        db = json.load(f)
    
    num_topics = len(db.get('topics', []))
    print(f"   [OK] {num_topics} topicos disponiveis")
    
    # Verificar estrutura
    if num_topics > 0:
        sample = db['topics'][0]
        has_keywords = 'keywords' in sample
        has_category = 'category' in sample
        num_hashtags = len(sample.get('hashtags', []))
        
        print(f"   [INFO] Estrutura otimizada:")
        print(f"      - Keywords: {'OK' if has_keywords else 'FALTA'}")
        print(f"      - Categoria: {'OK' if has_category else 'FALTA'}")
        print(f"      - Hashtags: {num_hashtags} (ideal: 2-3)")
        
except Exception as e:
    print(f"   [ERRO] Erro ao ler banco de dados: {e}")
    sys.exit(1)

# 6. Resumo final
print("\n" + "=" * 60)
print("[OK] TODOS OS TESTES PASSARAM!")
print("=" * 60)
print("\n[INFO] Sistema pronto para uso!")
print("\nProximos passos:")
print("1. Testar geracao de imagem: python image_creator.py")
print("2. Gerar post completo: python main.py --single")
print("3. Iniciar automacao: python main.py")
print("\n" + "=" * 60)
