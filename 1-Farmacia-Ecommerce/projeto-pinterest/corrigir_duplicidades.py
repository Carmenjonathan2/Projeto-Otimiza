#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para Diagnosticar e Corrigir Duplicidade de Posts
Projeto: Blog e Pinterest - Otimiza Farmavet
Data: 16/12/2025
"""

import json
import hashlib
import os
from datetime import datetime, timedelta
from collections import defaultdict
import unicodedata

class GerenciadorDuplicidades:
    """Gerencia detecção e remoção de posts duplicados"""
    
    def __init__(self, arquivo_database=None):
        """
        Inicializa o gerenciador
        
        Args:
            arquivo_database: Caminho para o arquivo JSON com os posts
        """
        self.arquivo_database = arquivo_database
        self.posts = []
        self.duplicatas = []
        
    def normalizar_texto(self, texto):
        """
        Normaliza texto removendo acentos e caracteres especiais
        
        Args:
            texto: String para normalizar
            
        Returns:
            String normalizada
        """
        if not texto:
            return ""
        
        # Remove acentos
        texto = unicodedata.normalize('NFKD', texto)
        texto = texto.encode('ASCII', 'ignore').decode('ASCII')
        
        # Converte para minúsculas e remove espaços extras
        texto = texto.lower().strip()
        texto = ' '.join(texto.split())
        
        return texto
    
    def gerar_hash(self, titulo, conteudo=""):
        """
        Gera hash único baseado no título e conteúdo
        
        Args:
            titulo: Título do post
            conteudo: Conteúdo do post (opcional)
            
        Returns:
            Hash SHA256
        """
        texto_completo = f"{titulo}{conteudo}".encode('utf-8')
        return hashlib.sha256(texto_completo).hexdigest()
    
    def carregar_posts_json(self):
        """Carrega posts de arquivo JSON"""
        if not self.arquivo_database or not os.path.exists(self.arquivo_database):
            print(f"❌ Arquivo não encontrado: {self.arquivo_database}")
            return False
        
        try:
            with open(self.arquivo_database, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Adaptar conforme estrutura do seu JSON
            if isinstance(data, list):
                self.posts = data
            elif isinstance(data, dict) and 'posts' in data:
                self.posts = data['posts']
            elif isinstance(data, dict) and 'articles' in data:
                self.posts = data['articles']
            else:
                self.posts = []
                
            print(f"✅ {len(self.posts)} posts carregados de {self.arquivo_database}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao carregar arquivo: {e}")
            return False
    
    def detectar_duplicatas_por_titulo(self):
        """
        Detecta posts duplicados baseado no título
        
        Returns:
            Dict com títulos duplicados e suas ocorrências
        """
        titulos = defaultdict(list)
        
        for idx, post in enumerate(self.posts):
            # Adaptar conforme estrutura do seu post
            titulo = post.get('title') or post.get('titulo') or post.get('name', '')
            titulo_normalizado = self.normalizar_texto(titulo)
            
            if titulo_normalizado:
                titulos[titulo_normalizado].append({
                    'index': idx,
                    'titulo_original': titulo,
                    'post': post
                })
        
        # Filtrar apenas duplicatas (mais de 1 ocorrência)
        duplicatas = {k: v for k, v in titulos.items() if len(v) > 1}
        
        return duplicatas
    
    def detectar_duplicatas_por_hash(self):
        """
        Detecta posts duplicados baseado em hash de conteúdo
        
        Returns:
            Dict com hashes duplicados e suas ocorrências
        """
        hashes = defaultdict(list)
        
        for idx, post in enumerate(self.posts):
            titulo = post.get('title') or post.get('titulo') or post.get('name', '')
            conteudo = post.get('content') or post.get('conteudo') or post.get('description', '')
            
            hash_post = self.gerar_hash(titulo, conteudo)
            
            hashes[hash_post].append({
                'index': idx,
                'titulo': titulo,
                'post': post
            })
        
        # Filtrar apenas duplicatas
        duplicatas = {k: v for k, v in hashes.items() if len(v) > 1}
        
        return duplicatas
    
    def gerar_relatorio(self):
        """Gera relatório completo de duplicidades"""
        print("\n" + "="*70)
        print("📊 RELATÓRIO DE DUPLICIDADES - BLOG E PINTEREST")
        print("="*70)
        
        # Detectar por título
        duplicatas_titulo = self.detectar_duplicatas_por_titulo()
        
        print(f"\n🔍 DUPLICATAS POR TÍTULO:")
        print(f"   Total de títulos únicos: {len(set(self.normalizar_texto(p.get('title', p.get('titulo', ''))) for p in self.posts))}")
        print(f"   Títulos duplicados: {len(duplicatas_titulo)}")
        
        if duplicatas_titulo:
            print("\n   📋 Detalhes das duplicatas:\n")
            
            for titulo_norm, ocorrencias in duplicatas_titulo.items():
                print(f"   ➤ \"{ocorrencias[0]['titulo_original']}\"")
                print(f"      Ocorrências: {len(ocorrencias)}")
                
                for i, ocorrencia in enumerate(ocorrencias, 1):
                    post = ocorrencia['post']
                    data = post.get('date') or post.get('data') or post.get('created_at', 'N/A')
                    status = post.get('status') or post.get('visibilidade', 'N/A')
                    
                    print(f"      [{i}] Index: {ocorrencia['index']} | Data: {data} | Status: {status}")
                
                print()
        
        # Detectar por hash
        duplicatas_hash = self.detectar_duplicatas_por_hash()
        
        print(f"\n🔍 DUPLICATAS POR CONTEÚDO (HASH):")
        print(f"   Conteúdos duplicados: {len(duplicatas_hash)}")
        
        if duplicatas_hash:
            print("\n   📋 Detalhes:\n")
            
            for hash_val, ocorrencias in duplicatas_hash.items():
                print(f"   ➤ \"{ocorrencias[0]['titulo']}\"")
                print(f"      Hash: {hash_val[:16]}...")
                print(f"      Ocorrências: {len(ocorrencias)}")
                print()
        
        print("="*70)
        
        return duplicatas_titulo, duplicatas_hash
    
    def remover_duplicatas(self, manter='primeiro', dry_run=True):
        """
        Remove posts duplicados
        
        Args:
            manter: 'primeiro', 'ultimo', ou 'mais_recente'
            dry_run: Se True, apenas simula a remoção
            
        Returns:
            Lista de posts sem duplicatas
        """
        duplicatas_titulo = self.detectar_duplicatas_por_titulo()
        
        indices_para_remover = set()
        
        for titulo_norm, ocorrencias in duplicatas_titulo.items():
            # Ordenar por data se disponível
            try:
                ocorrencias_ordenadas = sorted(
                    ocorrencias,
                    key=lambda x: x['post'].get('date') or x['post'].get('data') or '',
                    reverse=(manter == 'mais_recente' or manter == 'ultimo')
                )
            except:
                ocorrencias_ordenadas = ocorrencias
            
            # Manter apenas o primeiro/último
            if manter == 'primeiro':
                indices_manter = [ocorrencias_ordenadas[0]['index']]
            elif manter == 'ultimo' or manter == 'mais_recente':
                indices_manter = [ocorrencias_ordenadas[-1]['index']]
            else:
                indices_manter = [ocorrencias_ordenadas[0]['index']]
            
            # Marcar os outros para remoção
            for ocorrencia in ocorrencias_ordenadas:
                if ocorrencia['index'] not in indices_manter:
                    indices_para_remover.add(ocorrencia['index'])
        
        print(f"\n{'🔍 SIMULAÇÃO' if dry_run else '🗑️  REMOÇÃO'} DE DUPLICATAS:")
        print(f"   Posts a remover: {len(indices_para_remover)}")
        print(f"   Posts a manter: {len(self.posts) - len(indices_para_remover)}")
        
        if dry_run:
            print("\n   ⚠️  Modo DRY RUN - Nenhum arquivo será modificado")
            print("   Para executar a remoção, use: dry_run=False")
        else:
            # Criar backup
            if self.arquivo_database:
                backup_file = f"{self.arquivo_database}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                
                with open(self.arquivo_database, 'r', encoding='utf-8') as f:
                    backup_data = f.read()
                
                with open(backup_file, 'w', encoding='utf-8') as f:
                    f.write(backup_data)
                
                print(f"\n   💾 Backup criado: {backup_file}")
            
            # Remover duplicatas
            posts_limpos = [post for idx, post in enumerate(self.posts) if idx not in indices_para_remover]
            
            # Salvar arquivo limpo
            if self.arquivo_database:
                with open(self.arquivo_database, 'w', encoding='utf-8') as f:
                    json.dump(posts_limpos, f, ensure_ascii=False, indent=2)
                
                print(f"   ✅ Arquivo atualizado: {self.arquivo_database}")
            
            self.posts = posts_limpos
        
        return [post for idx, post in enumerate(self.posts) if idx not in indices_para_remover]


def main():
    """Função principal"""
    print("\n🔧 FERRAMENTA DE CORREÇÃO DE DUPLICIDADES")
    print("   Projeto: Blog e Pinterest - Otimiza Farmavet\n")
    
    # Procurar arquivos JSON no diretório atual
    arquivos_json = [f for f in os.listdir('.') if f.endswith('.json')]
    
    if not arquivos_json:
        print("❌ Nenhum arquivo JSON encontrado no diretório atual")
        print("\n💡 INSTRUÇÕES:")
        print("   1. Navegue até o diretório do projeto Pinterest/Blog")
        print("   2. Execute este script novamente")
        print("   3. Ou especifique o caminho do arquivo:")
        print("      python corrigir_duplicidades.py --arquivo caminho/para/posts.json")
        return
    
    print("📁 Arquivos JSON encontrados:")
    for i, arquivo in enumerate(arquivos_json, 1):
        print(f"   [{i}] {arquivo}")
    
    # Para automação, tentar content_database.json primeiro
    arquivo_padrao = 'content_database.json' if 'content_database.json' in arquivos_json else arquivos_json[0]
    
    print(f"\n📂 Usando arquivo: {arquivo_padrao}")
    
    # Criar gerenciador
    gerenciador = GerenciadorDuplicidades(arquivo_padrao)
    
    # Carregar posts
    if not gerenciador.carregar_posts_json():
        return
    
    # Gerar relatório
    duplicatas_titulo, duplicatas_hash = gerenciador.gerar_relatorio()
    
    # Se houver duplicatas, perguntar sobre remoção
    if duplicatas_titulo or duplicatas_hash:
        print("\n❓ AÇÕES DISPONÍVEIS:")
        print("   [1] Simular remoção de duplicatas (DRY RUN)")
        print("   [2] Remover duplicatas (manter primeiro)")
        print("   [3] Remover duplicatas (manter mais recente)")
        print("   [4] Sair sem modificar")
        
        # Para automação inicial, fazer apenas dry run
        print("\n🔍 Executando simulação (DRY RUN)...")
        gerenciador.remover_duplicatas(manter='primeiro', dry_run=True)
        
        print("\n✅ Diagnóstico concluído!")
        print("   Para remover duplicatas, edite o script e altere dry_run=False")
    else:
        print("\n✅ Nenhuma duplicata encontrada!")


if __name__ == "__main__":
    main()
