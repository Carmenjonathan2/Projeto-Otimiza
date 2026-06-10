import os
import requests
from io import BytesIO
import re
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageChops
from dotenv import load_dotenv

# Carregar configurações do .env na raiz
load_dotenv(dotenv_path=os.path.join('..', '.env'))

SHOPIFY_URL = os.getenv('SHOPIFY_SHOP_URL')
ACCESS_TOKEN = os.getenv('SHOPIFY_ACCESS_TOKEN')

def ensure_fonts():
    fonts = {
        "Poppins-Bold.ttf": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf",
        "Poppins-SemiBold.ttf": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf",
        "Poppins-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf"
    }
    for font_name, url in fonts.items():
        if not os.path.exists(font_name):
            print(f"Baixando fonte {font_name}...")
            try:
                r = requests.get(url)
                with open(font_name, 'wb') as f:
                    f.write(r.content)
            except Exception as e:
                print(f"Erro ao baixar {font_name}: {e}")

def get_promotions():
    """Busca TODOS os produtos com preço de comparação (promoção) na Shopify — com paginação completa."""
    headers = {"X-Shopify-Access-Token": ACCESS_TOKEN}
    promos = []
    url = f"https://{SHOPIFY_URL}/admin/api/2024-01/products.json?limit=250"

    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Erro ao acessar Shopify: {response.status_code}")
            break

        products = response.json().get('products', [])
        for p in products:
            variant = p['variants'][0]
            price = float(variant['price'])
            compare_at = float(variant['compare_at_price']) if variant.get('compare_at_price') else 0

            if compare_at > price:
                promos.append({
                    'id': p['id'],
                    'nome': p['title'],
                    'preco': price,
                    'preco_antigo': compare_at,
                    'imagem': p['image']['src'] if p.get('image') else None,
                    'desconto': int((1 - (price/compare_at)) * 100),
                    'tipo': p.get('product_type', ''),
                    'tags': p.get('tags', '')
                })

        # Paginação via Link header (cursor-based)
        link_header = response.headers.get('Link', '')
        next_url = None
        if 'rel="next"' in link_header:
            for part in link_header.split(','):
                if 'rel="next"' in part:
                    next_url = part.strip().split(';')[0].strip('<> ')
                    break
        url = next_url

    print(f"Total de produtos em promoção encontrados: {len(promos)}")
    return promos

def clean_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def crop_margins(img, tolerance=25):
    # Remove fundo transparente primeiro, preenchendo com branco para o próximo passo
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        fundo = Image.new("RGBA", img.size, (255, 255, 255, 255))
        fundo.paste(img, (0, 0), img)
        img = fundo
        
    # Remove fundo quase-branco (com tolerância para ignorar sombras fracas)
    img_rgb = img.convert("RGB")
    bg = Image.new("RGB", img_rgb.size, (255,255,255))
    diff = ImageChops.difference(img_rgb, bg)
    diff_l = diff.convert("L")
    diff_l = diff_l.point(lambda p: 255 if p > tolerance else 0)
    bbox = diff_l.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img

def blend_white_background(img, bg_color):
    """Usa Multiply para fazer o fundo branco da foto sumir na cor do box."""
    img_rgb = img.convert("RGB")
    patch = Image.new("RGB", img_rgb.size, bg_color)
    return ImageChops.multiply(patch, img_rgb)

def desenhar_texto_quebrado(draw, texto, font, max_width, x, y_start, fill, align="center"):
    """Função auxiliar para quebrar textos longos em várias linhas centralizadas."""
    # Estimar quantos caracteres cabem por linha usando um caractere médio
    avg_char_width = font.getlength("a")
    chars_per_line = int(max_width / avg_char_width)
    
    linhas = textwrap.wrap(texto, width=chars_per_line)
    y = y_start
    # Calcular altura de uma linha
    bbox = font.getbbox("A")
    line_height = bbox[3] - bbox[1] + 15
    
    for linha in linhas:
        draw.text((x, y), linha, fill=fill, font=font, anchor="mm")
        y += line_height
    
    return y # retorna onde o texto terminou

def gerar_flyers_individuais(promos):
    """Gera uma imagem para CADA produto com o design B2C aprovado (Status)."""
    if not promos:
        print("Nenhuma promoção encontrada.")
        return
    
    ensure_fonts()
    output_dir = "posts_prontos"
    os.makedirs(output_dir, exist_ok=True)
    
    # Configurações do Canvas (Status WhatsApp/Instagram: 1080x1920)
    width, height = 1080, 1920
    branco = (255, 255, 255)
    roxo_intenso = (71, 12, 81)      # #470C51
    lilas_medio = (196, 139, 206)    # #C48BCE
    amarelo_dourado = (255, 184, 0)  # #FFB800
    lilas_off_white = (248, 238, 250)# #F8EEFA
    borda_cor = (234, 234, 234)
    
    try:
        font_nome = ImageFont.truetype("Poppins-Bold.ttf", 65)
        font_preco_antigo = ImageFont.truetype("Poppins-Regular.ttf", 60)
        font_preco_novo = ImageFont.truetype("Poppins-Bold.ttf", 100)
        font_desconto = ImageFont.truetype("Poppins-Bold.ttf", 55)
        font_botao = ImageFont.truetype("Poppins-Bold.ttf", 60)
    except Exception as e:
        print(f"Aviso: Fontes Poppins não carregadas ({e}). Usando fallback.")
        font_nome = ImageFont.truetype("arial.ttf", 65)
        font_preco_antigo = ImageFont.truetype("arial.ttf", 60)
        font_preco_novo = ImageFont.truetype("arial.ttf", 100)
        font_desconto = ImageFont.truetype("arial.ttf", 55)
        font_botao = ImageFont.truetype("arial.ttf", 60)

    for p in promos:
        print(f"Gerando flyer Status B2C para: {p['nome']}")
        img = Image.new('RGB', (width, height), color=branco)
        draw = ImageDraw.Draw(img)
        
        # Borda externa do card (para dar sensação de widget na tela)
        draw.rounded_rectangle([40, 40, width-40, height-40], radius=40, outline=borda_cor, width=4)
        
        # Box da Imagem (Lilás Off-White)
        box_y_start = 80
        box_y_end = 980
        draw.rounded_rectangle([80, box_y_start, width-80, box_y_end], radius=30, fill=lilas_off_white)
        
        # Baixar e colar a Imagem do Produto (Ocupando quase todo o box)
        if p['imagem']:
            try:
                response = requests.get(p['imagem'])
                img_produto = Image.open(BytesIO(response.content)).convert("RGBA")
                
                # Cortar as margens brancas/transparentes (ignorando sombras leves)
                img_produto = crop_margins(img_produto, tolerance=30)

                # Forçar o aumento da imagem para caber no box (thumbnail não aumenta imagens pequenas)
                max_w, max_h = 880, 860
                w, h = img_produto.size
                ratio = min(max_w / w, max_h / h)
                new_w, new_h = int(w * ratio), int(h * ratio)
                img_produto = img_produto.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                # Aplicar blend Multiply para o fundo branco sumir dentro do lilás off-white
                img_produto = blend_white_background(img_produto, lilas_off_white)
                
                # Calcular coordenadas para colar no centro do box
                x_offset = (width - img_produto.width) // 2
                box_center_y = box_y_start + (box_y_end - box_y_start) // 2
                y_offset = box_center_y - (img_produto.height // 2)
                
                # Colar usando a própria imagem como máscara (ou colando direto, já que o fundo casou)
                img.paste(img_produto, (x_offset, y_offset))
            except Exception as e:
                print(f"Erro ao baixar imagem: {e}")
                draw.text((width//2, 540), "FOTO", fill=lilas_medio, font=font_nome, anchor="mm")
        
        # Selo de Desconto flutuando em formato de Sticker Rotacionado
        sticker_w, sticker_h = 280, 100
        sticker_img = Image.new('RGBA', (sticker_w, sticker_h), (0,0,0,0))
        sticker_draw = ImageDraw.Draw(sticker_img)
        
        # Fundo do sticker arredondado vermelho
        sticker_draw.rounded_rectangle([0, 0, sticker_w, sticker_h], radius=25, fill=(255, 60, 60))
        
        # Ajuste de fonte do sticker para caber o "OFF"
        try:
            font_sticker = ImageFont.truetype("Poppins-Bold.ttf", 45)
        except:
            font_sticker = ImageFont.load_default()
            
        sticker_draw.text((sticker_w//2, sticker_h//2 - 5), f"-{p['desconto']}% OFF", fill=branco, font=font_sticker, anchor="mm")
        
        # Girar o sticker 15 graus para dar o efeito despojado
        sticker_rotated = sticker_img.rotate(15, expand=True, fillcolor=(0,0,0,0))
        
        # Colar o sticker na imagem principal (no canto superior direito do box)
        selo_x = width - 340
        selo_y = 100
        img.paste(sticker_rotated, (selo_x, selo_y), sticker_rotated)

        # Textos: Nome do Produto (Quebrado em linhas)
        y_nome_start = 1120
        # A função vai desenhar e quebrar linha se o nome for grande (limite de ~900px de largura)
        y_apos_nome = desenhar_texto_quebrado(draw, p['nome'], font_nome, 900, width//2, y_nome_start, roxo_intenso)

        # Textos: Bloco de Preços
        y_preco_antigo = max(y_apos_nome + 60, 1320)
        
        # DE (Preço Antigo)
        texto_de = f"De: R$ {p['preco_antigo']:.2f}"
        draw.text((width//2, y_preco_antigo), texto_de, fill=lilas_medio, font=font_preco_antigo, anchor="mm")
        # Risco no preço antigo
        w_de = font_preco_antigo.getlength(texto_de)
        draw.line([width//2 - w_de/2 - 10, y_preco_antigo, width//2 + w_de/2 + 10, y_preco_antigo], fill=lilas_medio, width=5)
        
        # POR (Preço Novo)
        y_preco_novo = y_preco_antigo + 120
        draw.text((width//2, y_preco_novo), f"Por: R$ {p['preco']:.2f}", fill=roxo_intenso, font=font_preco_novo, anchor="mm")

        # Botão "Adicionar à Cesta" (Call to Action principal)
        y_botao_start = height - 250
        y_botao_end = height - 120
        draw.rounded_rectangle([80, y_botao_start, width-80, y_botao_end], radius=35, fill=amarelo_dourado)
        
        botao_center_y = y_botao_start + (y_botao_end - y_botao_start) // 2
        draw.text((width//2, botao_center_y - 5), "Adicionar à Cesta", fill=roxo_intenso, font=font_botao, anchor="mm")
        
        # Salvar o Post
        safe_name = clean_filename(p['nome'])
        output_path = os.path.join(output_dir, f"post_{p['id']}.png")
        img.save(output_path)
        print(f"OK: Flyer gerado: {output_path}")

    # Salvar o arquivo JSON de metadados das promoções ativas
    import json
    metadata_path = "posts_metadata.json"
    try:
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(promos, f, ensure_ascii=False, indent=4)
        print(f"OK: Metadados salvos em {metadata_path}")
    except Exception as e:
        print(f"Erro ao salvar metadados: {e}")

if __name__ == "__main__":
    print("Iniciando: Buscando promocoes na Shopify...")
    promocoes = get_promotions()
    gerar_flyers_individuais(promocoes)
