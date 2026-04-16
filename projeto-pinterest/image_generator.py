import os
from PIL import Image, ImageDraw, ImageFont
import textwrap
import config

class ImageGenerator:
    def __init__(self):
        self.width, self.height = config.IMAGE_SIZE
        self.colors = config.BRAND_COLORS
        self.font_path = config.FONT_PATH
        
    def _load_font(self, size):
        try:
            return ImageFont.truetype(self.font_path, size)
        except IOError:
            # Fallback to default if font not found
            print(f"Warning: Font {self.font_path} not found. Using default.")
            return ImageFont.load_default()

    def create_background(self):
        """Creates the base image with background color."""
        return Image.new('RGB', (self.width, self.height), color=self.colors['background'])

    def draw_text(self, draw, text, position, font, color, max_width):
        """Draws wrapped text on the image."""
        lines = textwrap.wrap(text, width=max_width)
        x, y = position
        
        for line in lines:
            # Get bounding box of the line
            bbox = draw.textbbox((0, 0), line, font=font)
            line_width = bbox[2] - bbox[0]
            line_height = bbox[3] - bbox[1]
            
            # Center text horizontally
            draw.text(((self.width - line_width) / 2, y), line, font=font, fill=color)
            y += line_height + 10 # Add some spacing between lines
            
        return y

    def generate_pin(self, content):
        """Generates a pin image based on content."""
        img = self.create_background()
        draw = ImageDraw.Draw(img)
        
        # Fonts
        title_font = self._load_font(80)
        subtitle_font = self._load_font(50)
        desc_font = self._load_font(40)
        footer_font = self._load_font(30)
        
        # Layout calculations
        current_y = 200
        
        # 1. Category (Top)
        category_text = content.get('category', '').upper()
        current_y = self.draw_text(draw, category_text, (0, current_y), footer_font, self.colors['analogous2'], 40)
        current_y += 50
        
        # 2. Title
        title_text = content.get('title', '')
        current_y = self.draw_text(draw, title_text, (0, current_y), title_font, self.colors['primary'], 20)
        current_y += 30
        
        # 3. Subtitle
        subtitle_text = content.get('subtitle', '')
        current_y = self.draw_text(draw, subtitle_text, (0, current_y), subtitle_font, self.colors['analogous1'], 25)
        current_y += 80
        
        # 4. Description (Shortened if needed)
        # We might not want the full description on the image, maybe just a teaser or skip it.
        # Let's add a visual element or separator instead? 
        # For now, let's put the description but keep it short.
        desc_text = content.get('description', '')
        # Truncate for image if too long
        if len(desc_text) > 150:
             desc_text = desc_text[:147] + "..."
        
        current_y = self.draw_text(draw, desc_text, (0, current_y), desc_font, self.colors['text_dark'], 30)
        
        # 5. Footer / Branding
        footer_text = "Sua Farmácia Veterinária de Confiança"
        # Draw at the bottom
        bbox = draw.textbbox((0, 0), footer_text, font=footer_font)
        footer_width = bbox[2] - bbox[0]
        footer_height = bbox[3] - bbox[1]
        
        draw.text(((self.width - footer_width) / 2, self.height - 100), footer_text, font=footer_font, fill=self.colors['primary'])
        
        return img

if __name__ == "__main__":
    # Test generation
    generator = ImageGenerator()
    
    test_content = {
        "category": "Saúde Preventiva",
        "title": "A Importância da Vacinação",
        "subtitle": "Proteja seu melhor amigo",
        "description": "Manter as vacinas em dia é o maior ato de amor que você pode dar ao seu pet. Previne doenças graves e garante uma vida longa e saudável."
    }
    
    img = generator.generate_pin(test_content)
    img.save("test_pin.png")
    print("Test pin generated: test_pin.png")
