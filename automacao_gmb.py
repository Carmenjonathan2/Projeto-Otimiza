
import os
import sys
import json
import time
import requests
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

# Adicionar pasta do projeto ao path para importar modulos
sys.path.append(os.path.join(os.getcwd(), 'projeto-pinterest'))

from gerador_posts_gmb import GeradorPostsGMB
from image_creator import ImageCreator
from shopify_manager import ShopifyManager

class AutomacaoGMB:
    def __init__(self):
        self.gerador = GeradorPostsGMB(whatsapp="3135649606")
        self.image_creator = ImageCreator()
        self.shopify = ShopifyManager()
        self.output_dir = "posts_prontos_gmb"
        os.makedirs(self.output_dir, exist_ok=True)

    def processar_calendario(self, arquivo_json="calendario_posts_gmb.json"):
        """Processa o calendário e gera as artes para cada post."""
        if not os.path.exists(arquivo_json):
            print(f"Erro: Arquivo {arquivo_json} não encontrado.")
            return

        with open(arquivo_json, 'r', encoding='utf-8') as f:
            posts = json.load(f)

        print(f"🚀 Iniciando geração de {len(posts)} posts para GMB...")

        for i, post in enumerate(posts, 1):
            data_str = post.get('data_publicacao', 'sem_data').replace(':', '-').replace(' ', '_')
            prefixo = f"{i:02d}_{data_str}"
            
            print(f"\n[{i}/{len(posts)}] Processando: {post['titulo']}")
            
            # 1. Definir caminho da imagem
            image_path = os.path.join(self.output_dir, f"{prefixo}_imagem.png")
            text_path = os.path.join(self.output_dir, f"{prefixo}_legenda.txt")

            # 2. Gerar Imagem
            sucesso_imagem = False
            
            # Se for produto, tentar buscar no Shopify
            if post.get('tipo') == 'produto_destaque' and 'produto' in post:
                nome_prod = post['produto']['nome']
                print(f"   🔍 Buscando '{nome_prod}' no Shopify...")
                prod_data = self.shopify.buscar_produto(nome_prod)
                
                if prod_data and 'images' in prod_data and prod_data['images']:
                    img_url = prod_data['images'][0]['src']
                    print(f"   📥 Puxando imagem do Shopify: {img_url}")
                    sucesso_imagem = self._gerar_arte_produto(img_url, post, image_path)
                else:
                    print(f"   ⚠️ Produto não encontrado no Shopify ou sem imagem. Usando IA...")
            
            # Se não for produto ou falhou o Shopify, usar o gerador de IA
            if not sucesso_imagem:
                self.image_creator.create_pin_image(
                    title=post['titulo'],
                    subtitle=post['corpo'][:100] + "...",
                    output_path=image_path,
                    category=post.get('tipo', 'Geral'),
                    aspect_ratio="1:1" # Quadrado para GMB
                )
            
            # 3. Salvar Legenda
            with open(text_path, 'w', encoding='utf-8') as f_txt:
                f_txt.write(f"TÍTULO DO POST: {post['titulo']}\n")
                f_txt.write("="*30 + "\n\n")
                f_txt.write(post['corpo'])
                f_txt.write("\n\n" + "="*30 + "\n")
                f_txt.write(f"Sugestão de CTA: {post['cta_button']['texto']}\n")
                f_txt.write(f"Link Sugerido: {post['cta_button']['link']}\n")

        print(f"\n✅ Concluído! Todos os posts estão em: {os.path.abspath(self.output_dir)}")

    def _gerar_arte_produto(self, url_imagem, post_data, output_path):
        """Monta uma arte com a imagem do Shopify dentro da moldura da Otimiza."""
        try:
            # Download da imagem
            response = requests.get(url_imagem)
            product_img = Image.open(io.BytesIO(response.content)).convert("RGBA")
            
            # Criar fundo quadrado (1080x1080) com a cor da marca
            size = (1080, 1080)
            brand_color = self.image_creator.colors.get('primary', (71, 12, 81))
            canvas = Image.new('RGBA', size, brand_color)
            
            # Redimensionar imagem do produto para caber com margem
            product_img.thumbnail((800, 800))
            
            # Centralizar imagem do produto
            offset = ((size[0] - product_img.size[0]) // 2, (size[1] - product_img.size[1]) // 2 - 50)
            canvas.paste(product_img, offset, product_img)
            
            # Aplicar overlay de texto (reutilizando a lógica do ImageCreator se adaptada ou simplificada)
            # Para simplificar aqui, vamos apenas salvar e deixar o ImageCreator aplicar o texto se quisermos
            # Mas o ImageCreator._apply_text_overlay espera que a imagem já exista no disco
            canvas.convert("RGB").save(output_path)
            
            # Aplicar o overlay padrão
            self.image_creator._apply_text_overlay(output_path, post_data['titulo'], "OFERTA SHOPIFY")
            
            return True
        except Exception as e:
            print(f"   ❌ Erro ao processar imagem do Shopify: {e}")
            return False

if __name__ == "__main__":
    import io # Certificar que io está disponível para o _gerar_arte_produto
    app = AutomacaoGMB()
    app.processar_calendario()
