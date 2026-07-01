
import os
from image_creator import ImageCreator

def generate_test_only():
    creator = ImageCreator()
    
    # Tópico de teste: Sinais de Estresse (Comportamento)
    title = "Sinais de Estresse em Pets: O que observar"
    subtitle = "Entenda a linguagem corporal do seu melhor amigo"
    category = "Comportamento"
    output_path = "teste_final_otimiza.png"
    
    print(f"--- INICIANDO GERAÇÃO DE TESTE (SEM PUBLICAÇÃO) ---")
    print(f"Tópico: {title}")
    
    path = creator.create_pin_image(title, subtitle, output_path, category)
    
    if path and os.path.exists(path):
        print(f"\n✅ SUCESSO! Imagem gerada em: {os.path.abspath(path)}")
        print(f"Tamanho do arquivo: {os.path.getsize(path)} bytes")
    else:
        print("\n❌ FALHA na geração da imagem.")

if __name__ == "__main__":
    generate_test_only()
