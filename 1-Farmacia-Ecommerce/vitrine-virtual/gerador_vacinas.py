import os
import sys
import textwrap
from PIL import Image, ImageDraw, ImageFont

# Set working directory to the script's directory (vitrine-virtual)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Dimensions (Instagram Stories/WhatsApp Status standard: 1080x1920)
width, height = 1080, 1920

# Colors (Standardized Aika Premium B2C/B2B Branding)
branco = (255, 255, 255)
borda_cor = (234, 234, 234)
lilas_off_white = (248, 238, 250)# #F8EEFA (Card backgrounds)
roxo_intenso = (71, 12, 81)      # #470C51 (Primary text and buttons)
lilas_medio = (120, 80, 130)     # Darker lilac for readability on light backgrounds
amarelo_dourado = (255, 184, 0)  # #FFB800 (Button background)
vermelho_promo = (255, 71, 71)   # #FF4747 (Promo tag red / Badge background)

# Create Canvas
img = Image.new('RGB', (width, height), color=branco)
draw = ImageDraw.Draw(img)

# Load fonts
try:
    font_titulo = ImageFont.truetype("Poppins-Bold.ttf", 55)
    font_subtitulo = ImageFont.truetype("Poppins-SemiBold.ttf", 32)
    font_tag = ImageFont.truetype("Poppins-Bold.ttf", 22)
    font_vacina = ImageFont.truetype("Poppins-Bold.ttf", 36)
    font_desc = ImageFont.truetype("Poppins-Regular.ttf", 24)
    font_botao = ImageFont.truetype("Poppins-Bold.ttf", 44)
    font_mini_tag = ImageFont.truetype("Poppins-Bold.ttf", 24)
except Exception as e:
    print(f"Poppins not loaded ({e}). Using Arial fallback.")
    font_titulo = ImageFont.truetype("arial.ttf", 55)
    font_subtitulo = ImageFont.truetype("arial.ttf", 32)
    font_tag = ImageFont.truetype("arial.ttf", 22)
    font_vacina = ImageFont.truetype("arial.ttf", 36)
    font_desc = ImageFont.truetype("arial.ttf", 24)
    font_botao = ImageFont.truetype("arial.ttf", 44)
    font_mini_tag = ImageFont.truetype("arial.ttf", 24)

# Outer card border
draw.rounded_rectangle([40, 40, width-40, height-40], radius=40, outline=borda_cor, width=4)

# 1. Header Area
# Red Promo Badge for "DESCONTO A PARTIR DE 6 AMPOLAS"
badge_w = 640
badge_h = 60
badge_rect = [540 - badge_w//2, 80, 540 + badge_w//2, 140]
draw.rounded_rectangle(badge_rect, radius=15, fill=vermelho_promo)
draw.text((540, 110), "DESCONTO A PARTIR DE 6 AMPOLAS", fill=branco, font=font_mini_tag, anchor="mm")

# Main Title & Subtitle (B2B Focused)
draw.text((540, 200), "CAMPANHA DE VACINAS B2B", fill=roxo_intenso, font=font_titulo, anchor="mm")
draw.text((540, 255), "Condições exclusivas para Médicos Veterinários", fill=lilas_medio, font=font_subtitulo, anchor="mm")

# 2. Vaccine Cards (Descriptions removed for B2B vets)
vaccines = [
    {"nome": "Vacina Nobivac V8, V4 & V5"},
    {"nome": "Antirrábicas Nobivac & Rabisin"},
    {"nome": "Bordetella Oral (Gripe Canina)"},
    {"nome": "Vacina Recombitek V10"}
]

y_start = 340
card_h = 160  # More compact card height since we have no descriptions
gap = 45

for idx, vac in enumerate(vaccines):
    card_y = y_start + idx * (card_h + gap)
    card_rect = [80, card_y, width - 80, card_y + card_h]
    
    # Draw card background
    draw.rounded_rectangle(card_rect, radius=25, fill=lilas_off_white, outline=borda_cor, width=2)
    
    # Draw Custom Medical Icon (Gold Circle with Purple Cross)
    cx, cy = 150, card_y + card_h // 2
    r_circle = 45
    draw.ellipse([cx - r_circle, cy - r_circle, cx + r_circle, cy + r_circle], fill=amarelo_dourado)
    # Cross thickness and size
    cross_w = 12
    cross_l = 44
    draw.rectangle([cx - cross_w//2, cy - cross_l//2, cx + cross_w//2, cy + cross_l//2], fill=roxo_intenso)
    draw.rectangle([cx - cross_l//2, cy - cross_w//2, cx + cross_l//2, cy + cross_w//2], fill=roxo_intenso)
    
    # Draw Vaccine Title (Vertically Centered)
    draw.text((230, card_y + card_h // 2 - 2), vac["nome"], fill=roxo_intenso, font=font_vacina, anchor="lm")
        
    # Draw "PROMOÇÃO" badge on the top right (Vertically Centered)
    badge_w, badge_h = 160, 42
    badge_x = width - 80 - 30 - badge_w
    badge_y = card_y + (card_h - badge_h) // 2
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=10, fill=vermelho_promo)
    draw.text((badge_x + badge_w//2, badge_y + badge_h//2 - 2), "PROMOÇÃO", fill=branco, font=font_tag, anchor="mm")

# 3. Footer Area
# Small warning text (regulation compliance)
draw.text((540, height - 355), "* Campanha exclusiva para Médicos Veterinários. Venda sob regulação.", fill=lilas_medio, font=font_desc, anchor="mm")
draw.text((540, height - 315), "Abasteça seu estoque com condições especiais!", fill=roxo_intenso, font=font_subtitulo, anchor="mm")

# Button "Conversar no WhatsApp" (Standardized Yellow with Purple text)
btn_y1 = height - 240
btn_y2 = height - 110
draw.rounded_rectangle([120, btn_y1, width - 120, btn_y2], radius=40, fill=amarelo_dourado)

# Text inside the button
draw.text((540, btn_y1 + (btn_y2 - btn_y1)//2 - 4), "Conversar no WhatsApp", fill=roxo_intenso, font=font_botao, anchor="mm")

# Save file
output_path = os.path.join("posts_prontos", "post_vacinas.png")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path)
print(f"Flyer saved successfully to: {output_path}")
