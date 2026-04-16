# -*- coding: utf-8 -*-
import requests
import xml.etree.ElementTree as ET

def validate_rss_feed():
    """Valida o feed RSS e verifica compatibilidade com Pinterest"""
    
    url = "https://otimizafarmavet.com.br/pages/blog-rss-feed.xml"
    
    print("Baixando feed RSS...\n")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}\n")
        
        # Salvar conteúdo para análise
        with open("feed_downloaded.xml", "w", encoding="utf-8") as f:
            f.write(response.text)
        
        print("Feed salvo em: feed_downloaded.xml\n")
        
        # Mostrar primeiras linhas
        lines = response.text.split('\n')[:30]
        print("Primeiras 30 linhas do feed:\n")
        print("=" * 80)
        for i, line in enumerate(lines, 1):
            print(f"{i:3d}: {line}")
        print("=" * 80)
        
        # Tentar parsear como XML
        print("\nValidando estrutura XML...")
        try:
            root = ET.fromstring(response.text)
            print("OK - XML valido!")
            print(f"Root tag: {root.tag}")
            
            # Verificar se é RSS 2.0
            if root.tag == 'rss':
                version = root.get('version')
                print(f"Versao RSS: {version}")
                
                # Verificar channel
                channel = root.find('channel')
                if channel is not None:
                    print("OK - Tag <channel> encontrada")
                    
                    # Contar items
                    items = channel.findall('item')
                    print(f"Numero de items: {len(items)}")
                    
                    if len(items) > 0:
                        print("\nPrimeiro item:")
                        first_item = items[0]
                        for child in first_item:
                            print(f"  - {child.tag}: {child.text[:100] if child.text else '(vazio)'}")
                else:
                    print("ERRO - Tag <channel> nao encontrada!")
            else:
                print(f"AVISO - Root tag nao e 'rss', e '{root.tag}'")
                
        except ET.ParseError as e:
            print(f"ERRO ao parsear XML: {str(e)}")
            
    except Exception as e:
        print(f"ERRO: {str(e)}")

if __name__ == "__main__":
    validate_rss_feed()
