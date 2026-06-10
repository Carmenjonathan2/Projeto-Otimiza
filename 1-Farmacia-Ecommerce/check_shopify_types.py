import os
import requests
from dotenv import load_dotenv

load_dotenv()

SHOPIFY_URL = os.getenv('SHOPIFY_SHOP_URL')
ACCESS_TOKEN = os.getenv('SHOPIFY_ACCESS_TOKEN')

headers = {"X-Shopify-Access-Token": ACCESS_TOKEN}
url = f"https://{SHOPIFY_URL}/admin/api/2024-01/products.json?limit=50"

response = requests.get(url, headers=headers)
if response.status_code == 200:
    products = response.json().get('products', [])
    types = set()
    tags = set()
    print("Listing sample products with type and tags:")
    for p in products[:15]:
        p_type = p.get('product_type', '')
        p_tags = p.get('tags', '')
        types.add(p_type)
        for t in p_tags.split(','):
            tags.add(t.strip())
        print(f"Title: {p['title']}")
        print(f"  Type: {p_type}")
        print(f"  Tags: {p_tags}")
        print("-" * 40)
        
    print("\nAll Unique Types found in sample:")
    print(types)
    print("\nAll Unique Tags found in sample:")
    print(tags)
else:
    print(f"Error accessing Shopify: {response.status_code}")
