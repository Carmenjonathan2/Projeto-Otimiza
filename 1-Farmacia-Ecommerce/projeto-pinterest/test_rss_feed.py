# -*- coding: utf-8 -*-
import requests
from config import SHOPIFY_SHOP_URL, SHOPIFY_ACCESS_TOKEN

def test_rss_feed():
    """Testa diferentes URLs possiveis para o feed RSS"""
    
    urls_to_test = [
        "https://otimizafarmavet.com.br/pages/blog-rss-feed",
        "https://otimizafarmavet.com.br/pages/blog-rss-feed.xml",
        "https://otimizafarmavet.com.br/blogs/blog-para-tutores.atom",
        "https://otimizafarmavet.com.br/blogs/blog-para-tutores/rss",
    ]
    
    print("Testando URLs do feed RSS...\n")
    
    for url in urls_to_test:
        print(f"Testando: {url}")
        try:
            response = requests.get(url, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('Content-Type', 'N/A')}")
            
            # Verificar se é XML
            content = response.text[:500]
            if '<?xml' in content:
                print("   OK - Parece ser XML!")
                if '<rss version="2.0"' in content:
                    print("   OK - E RSS 2.0!")
                elif '<feed xmlns' in content:
                    print("   AVISO - E Atom feed (nao RSS 2.0)")
            else:
                print("   ERRO - Nao e XML (e HTML)")
            
            print()
            
        except Exception as e:
            print(f"   ERRO: {str(e)}\n")
    
    # Testar via API do Shopify
    print("\nVerificando paginas via API do Shopify...\n")
    try:
        headers = {
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
            "Content-Type": "application/json"
        }
        
        api_url = f"https://{SHOPIFY_SHOP_URL}/admin/api/2024-01/pages.json"
        response = requests.get(api_url, headers=headers)
        
        if response.status_code == 200:
            pages = response.json().get('pages', [])
            print(f"OK - Encontradas {len(pages)} paginas:\n")
            for page in pages:
                print(f"   - {page['title']}")
                print(f"     Handle: {page['handle']}")
                print(f"     Template: {page.get('template_suffix', 'default')}")
                print(f"     URL: https://otimizafarmavet.com.br/pages/{page['handle']}")
                print()
        else:
            print(f"ERRO na API: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"ERRO ao acessar API: {str(e)}")

if __name__ == "__main__":
    test_rss_feed()
