import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
PINTEREST_ACCESS_TOKEN = os.getenv("PINTEREST_ACCESS_TOKEN")
PINTEREST_API_URL = "https://api-sandbox.pinterest.com/v5"  # Sandbox URL

# Google Imagen Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Scheduling Configuration
PINS_PER_DAY = 3
SCHEDULE_TIMES = ["12:00", "12:30", "12:45"]

# Website/RSS Configuration (Backup)
WEBSITE_ROOT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vet_em_casa", "website"))
WEBSITE_URL = "https://otimizafarmavet.com.br"
RSS_FEED_FILE = "feed.xml"
DICAS_DIR = "dicas"
IMAGES_DIR = "assets/images/pins"

# Shopify Configuration
SHOPIFY_SHOP_URL = os.getenv("SHOPIFY_SHOP_URL", "49mbh1-kp.myshopify.com") 
SHOPIFY_ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN", "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")
SHOPIFY_BLOG_ID = os.getenv("SHOPIFY_BLOG_ID", "118332752160")
SHOPIFY_AUTHOR = os.getenv("SHOPIFY_AUTHOR", "Otimiza Farmavet")


# Brand Configuration
BRAND_COLORS = {
    "primary": "#470C51",      # Roxo intenso
    "analogous1": "#2E0C51",   # Azul-arroxeado
    "analogous2": "#6C0C51",   # Rosa-arroxeado
    "background": "#F5E6FA",   # Background claro
    "text": "#FFFFFF",         # Texto branco para contraste no roxo
    "text_dark": "#2E0C51"     # Texto escuro para background claro
}

# Image Configuration
IMAGE_SIZE = (1000, 1500)
FONT_PATH = "arial.ttf"  # Will use system font or fallback

# Content Configuration
LOCALE = "pt-BR"
