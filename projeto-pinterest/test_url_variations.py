# -*- coding: utf-8 -*-
import requests

def test_all_url_variations():
    """Testa todas as variacoes possiveis de URL"""
    
    urls = [
        "https://otimizafarmavet.com.br/pages/blog-rss-feed",
        "https://otimizafarmavet.com.br/pages/blog-rss-feed.xml",
        "https://otimizafarmavet.com.br/pages/blog-rss-feed.rss",
    ]
    
    print("Testando variacoes de URL...\n")
    
    for url in urls:
        print(f"URL: {url}")
        print("-" * 80)
        
        try:
            response = requests.get(url, timeout=10)
            content = response.text[:500]
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            
            # Verificar tipo de conteudo
            if '<?xml version' in content:
                if '<rss version="2.0"' in content:
                    print("RESULTADO: RSS 2.0 valido! <<<< USE ESTA URL")
                elif '<page>' in content:
                    print("RESULTADO: Metadados da pagina Shopify (ERRO)")
                elif '<feed xmlns' in content:
                    print("RESULTADO: Atom feed (nao compativel)")
                else:
                    print("RESULTADO: XML desconhecido")
            else:
                print("RESULTADO: HTML (nao e feed)")
            
            print()
            
        except Exception as e:
            print(f"ERRO: {str(e)}\n")

if __name__ == "__main__":
    test_all_url_variations()
