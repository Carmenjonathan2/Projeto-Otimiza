import time
import schedule
import os
import argparse
import shutil
from datetime import datetime
import config
from content_generator import ContentGenerator
from image_creator import ImageCreator
# from pinterest_client import PinterestClient 
from rss_manager import RSSManager
from shopify_manager import ShopifyManager

class PinterestAutomationApp:
    def __init__(self):
        self.content_generator = ContentGenerator()
        self.image_creator = ImageCreator()
        self.rss_manager = RSSManager()
        self.shopify_manager = ShopifyManager()
        
        # Check Mode
        self.use_shopify = bool(config.SHOPIFY_ACCESS_TOKEN and config.SHOPIFY_SHOP_URL)

    def setup(self):
        """Initial setup."""
        if self.use_shopify:
            print("initializing system in SHOPIFY BLOG Mode...")
            print(f"Target Shop: {config.SHOPIFY_SHOP_URL}")
        else:
            print("initializing system in RSS FEED Mode (Local)...")
            if not os.path.exists(config.WEBSITE_ROOT_PATH):
                print(f"Error: Website path not found at {config.WEBSITE_ROOT_PATH}")
                return False
            print(f"Targeting Website: {config.WEBSITE_ROOT_PATH}")
        return True

    def create_and_publish_pin(self):
        """Orchestrates the creation and publication."""
        print(f"\n[{datetime.now()}] Starting content creation process...")
        
        # 1. Generate Content
        try:
            content = self.content_generator.generate_pin_content()
            print(f"Generated content: {content['title']}")
        except Exception as e:
            print(f"Error generating content: {e}")
            return

        # 2. Create Image (Always needed locally first)
        timestamp = int(time.time())
        image_filename = f"pin_{timestamp}.png"
        
        # We save to a temp folder if using Shopify, or the website folder if RSS
        if self.use_shopify:
            os.makedirs("generated_pins", exist_ok=True)
            image_path = os.path.join("generated_pins", image_filename)
        else:
            website_image_dir = os.path.join(config.WEBSITE_ROOT_PATH, config.IMAGES_DIR)
            os.makedirs(website_image_dir, exist_ok=True)
            image_path = os.path.join(website_image_dir, image_filename)
        
        try:
            self.image_creator.create_pin_image(
                content['title'], 
                content['subtitle'], 
                image_path,
                content.get('category', 'Geral')
            )
            print(f"Created image: {image_path}")
        except Exception as e:
            print(f"Error creating image: {e}")
            return

        # 3. Publish
        if self.use_shopify:
            print("Publishing to Shopify Blog...")
            try:
                # Use the pre-formatted HTML from generator
                body_html = f"""
                {content['description']}
                <hr>
                <p>Precisa de ajuda veterinária? <a href="https://otimizafarmavet.com.br/pages/agendamento">Agende uma consulta em casa</a>.</p>
                <p style="font-size: 0.8em; color: #666;">Tags: {' '.join(content['hashtags'])}</p>
                """
                
                url = self.shopify_manager.create_article(
                    title=content['title'],
                    body_html=body_html,
                    image_path=image_path,
                    tags=content['hashtags']
                )
                if url:
                    print(f"SUCCESS! Published to Shopify: {url}")
                    
                    # 📝 REGISTRAR PUBLICAÇÃO (Prevenção de duplicidades)
                    self.content_generator.preventor.registrar_publicacao(
                        titulo=content['title'],
                        conteudo=content.get('original_desc', content['description']),
                        plataformas=['shopify', 'pinterest'],
                        metadata={
                            'url': url,
                            'categoria': content.get('category'),
                            'hashtags': content['hashtags'],
                            'image_path': image_path
                        }
                    )
                    print(f"[OK] Publicação registrada no sistema de prevenção de duplicidades")
                else:
                    print("Failed to publish to Shopify.")
            except Exception as e:
                print(f"Error publishing to Shopify: {e}")
        
        else:
            # Fallback to RSS
            print("Updating RSS Feed (Local)...")
            try:
                full_description = f"{content['description']}\n\n{' '.join(content['hashtags'])}"
                page_url = self.rss_manager.add_item(
                    title=content['title'],
                    description=full_description,
                    image_filename=image_filename,
                    hashtags=content['hashtags']
                )
                print(f"SUCCESS! Added to feed. Page URL: {page_url}")
            except Exception as e:
                print(f"Error updating feed: {e}")

    def run_scheduler(self):
        """Runs the scheduler loop."""
        print(f"Starting scheduler. Posting {config.PINS_PER_DAY} times daily at: {config.SCHEDULE_TIMES}")
        
        for time_str in config.SCHEDULE_TIMES:
            schedule.every().day.at(time_str).do(self.create_and_publish_pin)
        
        while True:
            schedule.run_pending()
            time.sleep(60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Pinterest Automation for Veterinary Pharmacy')
    parser.add_argument('--single', action='store_true', help='Create and publish a single pin immediately')
    
    args = parser.parse_args()
    
    app = PinterestAutomationApp()
    if app.setup():
        if args.single:
            app.create_and_publish_pin()
        else:
            app.run_scheduler()

