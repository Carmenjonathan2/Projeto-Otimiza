# -*- coding: utf-8 -*-
import requests
import time

def test_rss_after_fix():
    """Testa o feed RSS apos correcao no Shopify"""
    
    print("Aguardando 5 segundos para cache limpar...")
    time.sleep(5)
    
    url = "https://otimizafarmavet.com.br/pages/blog-rss-feed"
    
    print(f"\nTestando: {url}\n")
    print("=" * 80)
    
    try:
        # Adicionar headers para evitar cache
        headers = {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print()
        
        # Mostrar primeiras linhas
        lines = response.text.split('\n')[:20]
        print("Primeiras 20 linhas:")
        print("-" * 80)
        for i, line in enumerate(lines, 1):
            print(f"{i:3d}: {line[:100]}")
        print("-" * 80)
        print()
        
        # Verificar se e RSS 2.0
        content = response.text
        
        if '<?xml version' in content:
            print("OK - E XML!")
            
            if '<rss version="2.0"' in content:
                print("OK - E RSS 2.0!")
                print("OK - Feed esta correto!")
                print()
                print("URL PARA USAR NO PINTEREST:")
                print("=" * 80)
                print(url)
                print("=" * 80)
                return True
            elif '<page>' in content:
                print("ERRO - Ainda esta retornando metadados da pagina")
                print("O template nao foi aplicado corretamente")
                return False
            else:
                print("AVISO - E XML mas nao e RSS 2.0")
                return False
        else:
            print("ERRO - Nao e XML, e HTML")
            print("O template nao foi aplicado")
            return False
            
    except Exception as e:
        print(f"ERRO: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_rss_after_fix()
    
    if not success:
        print("\n" + "=" * 80)
        print("PROXIMOS PASSOS:")
        print("=" * 80)
        print("1. Verifique se salvou o template page.rss.liquid")
        print("2. Verifique se a pagina esta usando o template page.rss")
        print("3. Tente limpar o cache do navegador")
        print("4. Aguarde alguns minutos e teste novamente")
