import os
import sys
import textwrap
from PIL import Image, ImageDraw, ImageFont, ImageChops

# Set working directory to the script's directory (vitrine-virtual)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Dimensions
width, height = 1080, 1920

# Colors
branco = (255, 255, 255)
roxo_intenso = (71, 12, 81)      # #470C51
lilas_medio = (196, 139, 206)    # #C48BCE
lilas_off_white = (248, 238, 250)# #F8EEFA
borda_cor = (234, 234, 234)
verde_wpp = (37, 211, 102)      # #25D366 (WhatsApp Green)
vermelho_promo = (255, 71, 71)   # #FF4747 (Promo red)
amarelo_dourado = (255, 184, 0)  # #FFB800 (Gold/Yellow)

# Load fonts
try:
    font_nome = ImageFont.truetype("Poppins-Bold.ttf", 65)
    font_preco_antigo = ImageFont.truetype("Poppins-Regular.ttf", 60)
    font_preco_novo = ImageFont.truetype("Poppins-Bold.ttf", 80)
    font_tag = ImageFont.truetype("Poppins-Bold.ttf", 45)
    font_botao = ImageFont.truetype("Poppins-Bold.ttf", 60)
    font_chamada = ImageFont.truetype("Poppins-SemiBold.ttf", 48)
except Exception as e:
    print(f"Poppins not loaded ({e}). Using Arial fallback.")
    font_nome = ImageFont.truetype("arial.ttf", 65)
    font_preco_antigo = ImageFont.truetype("arial.ttf", 60)
    font_preco_novo = ImageFont.truetype("arial.ttf", 80)
    font_tag = ImageFont.truetype("arial.ttf", 45)
    font_botao = ImageFont.truetype("arial.ttf", 60)
    font_chamada = ImageFont.truetype("arial.ttf", 48)

# Path to the generated vaccine vial icon
vial_icon_path = "vaccine_vial_icon.png"

def crop_margins(img, tolerance=25):
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        fundo = Image.new("RGBA", img.size, (255, 255, 255, 255))
        fundo.paste(img, (0, 0), img)
        img = fundo
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
    img_rgb = img.convert("RGB")
    patch = Image.new("RGB", img_rgb.size, bg_color)
    return ImageChops.multiply(patch, img_rgb)

def desenhar_texto_quebrado(draw, texto, font, max_width, x, y_start, fill):
    avg_char_width = font.getlength("a")
    chars_per_line = int(max_width / avg_char_width)
    linhas = textwrap.wrap(texto, width=chars_per_line)
    y = y_start
    bbox = font.getbbox("A")
    line_height = bbox[3] - bbox[1] + 15
    for linha in linhas:
        draw.text((x, y), linha, fill=fill, font=font, anchor="mm")
        y += line_height
    return y

vaccines = [
    {
        "filename": "post_vacina_nobivac.png",
        "nome": "Vacina Nobivac V8, V4 e V5"
    },
    {
        "filename": "post_vacina_antirrabica.png",
        "nome": "Antirrábicas Nobivac e Rabisin"
    },
    {
        "filename": "post_vacina_gripe.png",
        "nome": "Bordetela Oral (Gripe)"
    },
    {
        "filename": "post_vacina_recombitek.png",
        "nome": "Vacina Recombitek V10"
    }
]

# Load and crop vaccine vial icon
img_vial = None
if os.path.exists(vial_icon_path):
    try:
        img_vial_raw = Image.open(vial_icon_path).convert("RGBA")
        img_vial = crop_margins(img_vial_raw, tolerance=30)
        # Resize to fit the box
        max_w, max_h = 880, 860
        w, h = img_vial.size
        ratio = min(max_w / w, max_h / h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        img_vial = img_vial.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img_vial = blend_white_background(img_vial, lilas_off_white)
        print("Vaccine vial image processed successfully.")
    except Exception as e:
        print(f"Error processing vaccine vial image: {e}")
else:
    print("Warning: vaccine vial image not found at", vial_icon_path)

output_dir = "posts_prontos"
os.makedirs(output_dir, exist_ok=True)

for p in vaccines:
    print(f"Generating flyer for: {p['nome']}")
    img = Image.new('RGB', (width, height), color=branco)
    draw = ImageDraw.Draw(img)
    
    # Outer card border
    draw.rounded_rectangle([40, 40, width-40, height-40], radius=40, outline=borda_cor, width=4)
    
    # Image Box (Lilac Off-White)
    box_y_start = 80
    box_y_end = 980
    draw.rounded_rectangle([80, box_y_start, width-80, box_y_end], radius=30, fill=lilas_off_white)
    
    # Paste Vaccine Icon
    if img_vial:
        x_offset = (width - img_vial.width) // 2
        box_center_y = box_y_start + (box_y_end - box_y_start) // 2
        y_offset = box_center_y - (img_vial.height // 2)
        img.paste(img_vial, (x_offset, y_offset))
    else:
        draw.text((width//2, 540), "VACINA", fill=lilas_medio, font=font_nome, anchor="mm")
        
    # Promo Sticker
    sticker_w, sticker_h = 320, 100
    sticker_img = Image.new('RGBA', (sticker_w, sticker_h), (0,0,0,0))
    sticker_draw = ImageDraw.Draw(sticker_img)
    sticker_draw.rounded_rectangle([0, 0, sticker_w, sticker_h], radius=25, fill=vermelho_promo)
    sticker_draw.text((sticker_w//2, sticker_h//2 - 5), "PROMOÇÃO", fill=branco, font=font_tag, anchor="mm")
    sticker_rotated = sticker_img.rotate(15, expand=True, fillcolor=(0,0,0,0))
    selo_x = width - 380
    selo_y = 100
    img.paste(sticker_rotated, (selo_x, selo_y), sticker_rotated)

    # Vaccine Name in Bold
    y_nome_start = 1100
    y_apos_nome = desenhar_texto_quebrado(draw, p['nome'], font_nome, 900, width//2, y_nome_start, roxo_intenso)

    # Consultative Price Block - Call to Action text
    y_preco_antigo = max(y_apos_nome + 60, 1280)
    texto_chamada = "Chame no privado para receber o catálogo que todo medvet precisa ter no celular."
    y_apos_chamada = desenhar_texto_quebrado(draw, texto_chamada, font_chamada, 900, width//2, y_preco_antigo, roxo_intenso)

    # WhatsApp Button
    y_botao_start = height - 250
    y_botao_end = height - 120
    draw.rounded_rectangle([80, y_botao_start, width-80, y_botao_end], radius=35, fill=amarelo_dourado)
    
    botao_center_y = y_botao_start + (y_botao_end - y_botao_start) // 2
    draw.text((width//2, botao_center_y - 5), "Conversar no WhatsApp", fill=roxo_intenso, font=font_botao, anchor="mm")
    
    # Save the Post
    output_path = os.path.join(output_dir, p['filename'])
    img.save(output_path)
    print(f"Saved: {output_path}")

print("All individual vaccine flyers generated successfully.")
