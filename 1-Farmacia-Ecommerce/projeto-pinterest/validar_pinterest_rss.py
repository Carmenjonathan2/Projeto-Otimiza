# -*- coding: utf-8 -*-
"""
Script para validar o RSS Feed e verificar se esta compativel com Pinterest
"""

import requests
import xml.etree.ElementTree as ET
import sys

# Configurar encoding para UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def validar_feed_rss(url_feed):
    """
    Valida o feed RSS e verifica compatibilidade com Pinterest
    """
    print(f"[*] Verificando feed RSS: {url_feed}\n")
    
    try:
        # Baixar o feed
        response = requests.get(url_feed, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Namespaces
        namespaces = {
            'media': 'http://search.yahoo.com/mrss/',
            'content': 'http://purl.org/rss/1.0/modules/content/',
            'dc': 'http://purl.org/dc/elements/1.1/'
        }
        
        # Verificar estrutura basica
        channel = root.find('channel')
        if channel is None:
            print("[ERRO] Estrutura RSS invalida - tag <channel> nao encontrada")
            return False
        
        print("[OK] Estrutura RSS 2.0 valida")
        
        # Informacoes do canal
        title = channel.find('title')
        link = channel.find('link')
        description = channel.find('description')
        
        print(f"\n[CANAL]")
        print(f"   Titulo: {title.text if title is not None else 'N/A'}")
        print(f"   Link: {link.text if link is not None else 'N/A'}")
        print(f"   Descricao: {description.text if description is not None else 'N/A'}")
        
        # Verificar itens
        items = channel.findall('item')
        print(f"\n[POSTS] Total encontrado: {len(items)}")
        
        if len(items) == 0:
            print("[AVISO] Nenhum post encontrado no feed!")
            return False
        
        # Analise detalhada dos posts
        problemas_encontrados = []
        posts_ok = 0
        
        for idx, item in enumerate(items[:5], 1):  # Verifica os 5 primeiros
            print(f"\n--- POST {idx} ---")
            
            # Titulo
            title = item.find('title')
            print(f"Titulo: {title.text if title is not None else 'SEM TITULO'}")
            
            # Link
            link = item.find('link')
            if link is not None:
                print(f"Link: {link.text}")
                if not link.text.startswith('https://'):
                    problemas_encontrados.append(f"Post {idx}: Link sem HTTPS")
            else:
                problemas_encontrados.append(f"Post {idx}: Sem link")
            
            # Imagens
            media_contents = item.findall('media:content', namespaces)
            enclosures = item.findall('enclosure')
            
            total_imagens = len(media_contents) + len(enclosures)
            print(f"Imagens: {total_imagens}")
            
            if total_imagens == 0:
                problemas_encontrados.append(f"Post {idx}: Sem imagens")
                print("   [AVISO] NENHUMA IMAGEM ENCONTRADA")
            else:
                # Verificar URLs das imagens
                imagens_ok = 0
                for media in media_contents:
                    url = media.get('url')
                    if url:
                        if url.startswith('https://'):
                            imagens_ok += 1
                            print(f"   [OK] Imagem: {url[:70]}...")
                        elif url.startswith('//'):
                            problemas_encontrados.append(f"Post {idx}: URL de imagem sem protocolo (//)")
                            print(f"   [ERRO] URL SEM PROTOCOLO: {url[:70]}...")
                        else:
                            print(f"   [AVISO] URL suspeita: {url[:70]}...")
                
                for enclosure in enclosures:
                    url = enclosure.get('url')
                    if url:
                        if url.startswith('https://'):
                            imagens_ok += 1
                        elif url.startswith('//'):
                            problemas_encontrados.append(f"Post {idx}: Enclosure sem protocolo")
                
                if imagens_ok == total_imagens:
                    posts_ok += 1
            
            # Tags
            categories = item.findall('category')
            if categories:
                tags = [cat.text for cat in categories if cat.text]
                print(f"Tags: {', '.join(tags[:3])}{'...' if len(tags) > 3 else ''}")
            
            # Data de publicacao
            pubdate = item.find('pubDate')
            if pubdate is not None:
                print(f"Publicado: {pubdate.text}")
        
        # Resumo
        print("\n" + "="*60)
        print("RESUMO DA VALIDACAO")
        print("="*60)
        
        print(f"\n[OK] Posts com imagens corretas: {posts_ok}/{min(5, len(items))}")
        print(f"[INFO] Total de posts no feed: {len(items)}")
        
        if problemas_encontrados:
            print(f"\n[ATENCAO] PROBLEMAS ENCONTRADOS ({len(problemas_encontrados)}):")
            for problema in problemas_encontrados:
                print(f"   - {problema}")
            print("\n[ERRO] FEED PRECISA DE CORRECAO!")
            print("\n[SOLUCAO]:")
            print("   1. Atualize o template no Shopify com 'shopify-rss-template-CORRIGIDO.liquid'")
            print("   2. Aguarde 5 minutos para o cache limpar")
            print("   3. Execute este script novamente para verificar")
            return False
        else:
            print("\n[SUCESSO] FEED ESTA CORRETO E COMPATIVEL COM PINTEREST!")
            print("\n[PROXIMOS PASSOS]:")
            print("   1. Configure o feed no Pinterest:")
            print(f"      URL: {url_feed}")
            print("   2. Aguarde 24-48h para os primeiros pins aparecerem")
            print("   3. Pinterest pode publicar ate 200 pins por dia")
            return True
            
    except requests.exceptions.RequestException as e:
        print(f"[ERRO] ao acessar o feed: {e}")
        return False
    except ET.ParseError as e:
        print(f"[ERRO] ao fazer parse do XML: {e}")
        print("   O conteudo nao e um XML valido")
        return False
    except Exception as e:
        print(f"[ERRO] inesperado: {e}")
        return False

if __name__ == "__main__":
    # URL do feed RSS
    FEED_URL = "https://otimizafarmavet.com.br/pages/blog-rss-feed"
    
    print("="*60)
    print("VALIDADOR DE RSS FEED PARA PINTEREST")
    print("="*60)
    print()
    
    resultado = validar_feed_rss(FEED_URL)
    
    print("\n" + "="*60)
    if resultado:
        print("[SUCESSO] VALIDACAO CONCLUIDA!")
    else:
        print("[ERRO] VALIDACAO FALHOU - CORRIJA OS PROBLEMAS LISTADOS")
    print("="*60)
