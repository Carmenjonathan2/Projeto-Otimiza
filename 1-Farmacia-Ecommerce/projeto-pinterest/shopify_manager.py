import requests
import json
import base64
import os
import config

class ShopifyManager:
    def __init__(self):
        self.shop_url = config.SHOPIFY_SHOP_URL
        self.access_token = config.SHOPIFY_ACCESS_TOKEN
        self.blog_id = config.SHOPIFY_BLOG_ID
        self.api_version = "2024-01" # Always allow updating this
        
        if not self.shop_url or not self.access_token:
            print("WARNING: Shopify credentials missing in config/env")

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": self.access_token
        }

    def _get_api_url(self, endpoint):
        # Handle cases where user might put 'https://' or not
        clean_url = self.shop_url.replace("https://", "").replace("/", "")
        return f"https://{clean_url}/admin/api/{self.api_version}/{endpoint}"

    def get_blogs(self):
        """Lists available blogs to find the ID."""
        url = self._get_api_url("blogs.json")
        response = requests.get(url, headers=self._get_headers())
        if response.status_code == 200:
            return response.json().get("blogs", [])
        else:
            print(f"Error fetching blogs: {response.text}")
            return []

    def upload_image(self, image_path, alt_text):
        """Uploads an image to Shopify Files (not directly attached to blog post API usually, 
           but often done via creating a generic File or base64 inside the post. 
           Standard Shopify Admin API for Articles accepts 'image' with 'attachment' (base64)."""
        
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        # When creating an article, we can pass the image directly in the payload
        return encoded_string

    def create_article(self, title, body_html, image_path=None, tags=None):
        """Creates a new blog post (Article). Default to DRAFT (unpublished) if no image."""
        if not self.blog_id:
            # Try to auto-discover 'News' or first blog
            blogs = self.get_blogs()
            if blogs:
                self.blog_id = blogs[0]['id']
                print(f"Auto-selected Blog ID: {self.blog_id} ({blogs[0]['title']})")
            else:
                print("No blogs found or no access.")
                return None

        url = self._get_api_url(f"blogs/{self.blog_id}/articles.json")
        
        payload = {
            "article": {
                "title": title,
                "author": config.SHOPIFY_AUTHOR,
                "tags": ", ".join(tags) if tags else "",
                "body_html": body_html,
                "published": False # Agora cria como RASCUNHO para você finalizar no tablet
            }
        }

        # Add image ONLY if provided
        if image_path and os.path.exists(image_path):
            try:
                image_base64 = self.upload_image(image_path, title)
                payload["article"]["image"] = {
                    "attachment": image_base64,
                    "alt": title
                }
            except Exception as e:
                print(f"Warning: Could not attach image: {e}")

        response = requests.post(url, headers=self._get_headers(), json=payload)
        
        if response.status_code == 201:
            data = response.json().get("article")
            print(f"Shopify Article Created (DRAFT): {data['title']} (ID: {data['id']})")
            return f"https://{self.shop_url}/admin/blogs/{self.blog_id}/articles/{data['id']}" # Link direto para edição no admin
        else:
            print(f"Error creating article: {response.text}")
            return None

    def buscar_produto(self, nome_produto):
        """Busca um produto pelo nome e retorna seus dados, incluindo imagens."""
        url = self._get_api_url("products.json")
        params = {"title": nome_produto}
        response = requests.get(url, headers=self._get_headers(), params=params)
        
        if response.status_code == 200:
            produtos = response.json().get("products", [])
            return produtos[0] if produtos else None
        return None

if __name__ == "__main__":
    # Test
    manager = ShopifyManager()
    # manager.create_article("Test Title", "<p>Test Body</p>", "test_image.png", ["test", "tag"])
