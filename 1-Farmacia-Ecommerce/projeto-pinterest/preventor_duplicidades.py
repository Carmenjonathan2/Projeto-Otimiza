#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de Prevenção de Duplicidades
Integração com sistema de automação Pinterest/Blog
"""

import json
import hashlib
import unicodedata
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os


class PreventorDuplicidades:
    """
    Classe para prevenir criação de posts duplicados
    Uso: Integrar antes de publicar novos posts
    """
    
    def __init__(self, arquivo_registro='registro_publicacoes.json', intervalo_dias=90):
        """
        Inicializa o preventor
        
        Args:
            arquivo_registro: Arquivo JSON para registrar publicações
            intervalo_dias: Intervalo de dias para verificar duplicatas (padrão 90)
        """
        self.arquivo_registro = arquivo_registro
        self.intervalo_dias = intervalo_dias
        self.registro = self._carregar_registro()
    
    def _carregar_registro(self) -> Dict:
        """Carrega registro de publicações existentes"""
        if os.path.exists(self.arquivo_registro):
            try:
                with open(self.arquivo_registro, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Erro ao carregar registro: {e}")
                return {'publicacoes': []}
        
        return {'publicacoes': []}
    
    def _salvar_registro(self):
        """Salva registro de publicações"""
        try:
            with open(self.arquivo_registro, 'w', encoding='utf-8') as f:
                json.dump(self.registro, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"❌ Erro ao salvar registro: {e}")
            return False
    
    @staticmethod
    def normalizar_texto(texto: str) -> str:
        """
        Normaliza texto para comparação
        
        Args:
            texto: String para normalizar
            
        Returns:
            String normalizada (sem acentos, minúsculas, sem espaços extras)
        """
        if not texto:
            return ""
        
        # Remove acentos
        texto = unicodedata.normalize('NFKD', texto)
        texto = texto.encode('ASCII', 'ignore').decode('ASCII')
        
        # Normaliza espaços e converte para minúsculas
        texto = texto.lower().strip()
        texto = ' '.join(texto.split())
        
        return texto
    
    @staticmethod
    def gerar_hash_conteudo(titulo: str, conteudo: str = "") -> str:
        """
        Gera hash único do conteúdo
        
        Args:
            titulo: Título do post
            conteudo: Conteúdo do post
            
        Returns:
            Hash SHA256
        """
        texto_completo = f"{titulo}{conteudo}".encode('utf-8')
        return hashlib.sha256(texto_completo).hexdigest()
    
    def verificar_titulo_duplicado(
        self, 
        titulo: str, 
        intervalo_dias: Optional[int] = None
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Verifica se título já foi publicado recentemente
        """
        if intervalo_dias is None:
            intervalo_dias = self.intervalo_dias

        titulo_normalizado = self.normalizar_texto(titulo)
        data_limite = datetime.now() - timedelta(days=intervalo_dias)
        
        for pub in self.registro.get('publicacoes', []):
            # Verificar se está dentro do intervalo
            try:
                data_pub = datetime.fromisoformat(pub.get('data_publicacao', ''))
                if data_pub < data_limite:
                    continue
            except:
                pass
            
            # Comparar títulos normalizados
            titulo_pub = self.normalizar_texto(pub.get('titulo', ''))
            
            if titulo_pub == titulo_normalizado:
                return True, pub
        
        return False, None
    
    def verificar_hash_duplicado(
        self, 
        hash_conteudo: str
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Verifica se hash de conteúdo já existe
        
        Args:
            hash_conteudo: Hash do conteúdo a verificar
            
        Returns:
            Tupla (é_duplicado, post_existente)
        """
        for pub in self.registro.get('publicacoes', []):
            if pub.get('hash_conteudo') == hash_conteudo:
                return True, pub
        
        return False, None
    
    def pode_publicar(
        self,
        titulo: str,
        conteudo: str = "",
        intervalo_dias: int = 30,
        verificar_hash: bool = True
    ) -> Tuple[bool, str]:
        """
        Verifica se post pode ser publicado (não é duplicado)
        
        Args:
            titulo: Título do post
            conteudo: Conteúdo do post
            intervalo_dias: Período para verificar duplicatas
            verificar_hash: Se deve verificar hash de conteúdo
            
        Returns:
            Tupla (pode_publicar, mensagem)
        """
        # Verificar título
        duplicado_titulo, post_titulo = self.verificar_titulo_duplicado(
            titulo, 
            intervalo_dias
        )
        
        if duplicado_titulo:
            data_pub = post_titulo.get('data_publicacao', 'N/A')
            return False, f"❌ Título duplicado! Publicado em: {data_pub}"
        
        # Verificar hash se solicitado
        if verificar_hash and conteudo:
            hash_conteudo = self.gerar_hash_conteudo(titulo, conteudo)
            duplicado_hash, post_hash = self.verificar_hash_duplicado(hash_conteudo)
            
            if duplicado_hash:
                data_pub = post_hash.get('data_publicacao', 'N/A')
                return False, f"❌ Conteúdo duplicado! Publicado em: {data_pub}"
        
        return True, "✅ Post pode ser publicado"
    
    def registrar_publicacao(
        self,
        titulo: str,
        conteudo: str = "",
        plataformas: List[str] = None,
        metadata: Dict = None
    ) -> bool:
        """
        Registra nova publicação
        
        Args:
            titulo: Título do post
            conteudo: Conteúdo do post
            plataformas: Lista de plataformas onde foi publicado
            metadata: Metadados adicionais
            
        Returns:
            True se registrado com sucesso
        """
        if plataformas is None:
            plataformas = []
        
        if metadata is None:
            metadata = {}
        
        # Gerar ID único
        timestamp = datetime.now().isoformat()
        post_id = hashlib.md5(f"{titulo}{timestamp}".encode()).hexdigest()[:12]
        
        # Criar registro
        publicacao = {
            'id': post_id,
            'titulo': titulo,
            'titulo_normalizado': self.normalizar_texto(titulo),
            'hash_conteudo': self.gerar_hash_conteudo(titulo, conteudo),
            'data_publicacao': timestamp,
            'plataformas': plataformas,
            'status': 'publicado',
            'metadata': metadata
        }
        
        # Adicionar ao registro
        if 'publicacoes' not in self.registro:
            self.registro['publicacoes'] = []
        
        self.registro['publicacoes'].append(publicacao)
        
        # Salvar
        return self._salvar_registro()
    
    def limpar_registros_antigos(self, dias: int = 90):
        """
        Remove registros mais antigos que X dias
        
        Args:
            dias: Número de dias para manter
        """
        data_limite = datetime.now() - timedelta(days=dias)
        
        registros_mantidos = []
        registros_removidos = 0
        
        for pub in self.registro.get('publicacoes', []):
            try:
                data_pub = datetime.fromisoformat(pub.get('data_publicacao', ''))
                if data_pub >= data_limite:
                    registros_mantidos.append(pub)
                else:
                    registros_removidos += 1
            except:
                # Manter se não conseguir parsear data
                registros_mantidos.append(pub)
        
        self.registro['publicacoes'] = registros_mantidos
        self._salvar_registro()
        
        print(f"🧹 Limpeza concluída: {registros_removidos} registros removidos")
        print(f"   Registros mantidos: {len(registros_mantidos)}")
    
    def gerar_relatorio(self) -> Dict:
        """
        Gera relatório de publicações
        
        Returns:
            Dict com estatísticas
        """
        total = len(self.registro.get('publicacoes', []))
        
        # Contar por plataforma
        por_plataforma = {}
        for pub in self.registro.get('publicacoes', []):
            for plat in pub.get('plataformas', []):
                por_plataforma[plat] = por_plataforma.get(plat, 0) + 1
        
        # Publicações recentes (últimos 7 dias)
        data_limite = datetime.now() - timedelta(days=7)
        recentes = 0
        
        for pub in self.registro.get('publicacoes', []):
            try:
                data_pub = datetime.fromisoformat(pub.get('data_publicacao', ''))
                if data_pub >= data_limite:
                    recentes += 1
            except:
                pass
        
        return {
            'total_publicacoes': total,
            'por_plataforma': por_plataforma,
            'ultimos_7_dias': recentes
        }


# Função auxiliar para integração fácil
def verificar_antes_de_publicar(
    titulo: str,
    conteudo: str = "",
    plataformas: List[str] = None,
    auto_registrar: bool = True
) -> bool:
    """
    Função helper para verificar e registrar publicação
    
    Args:
        titulo: Título do post
        conteudo: Conteúdo do post
        plataformas: Plataformas onde será publicado
        auto_registrar: Se deve registrar automaticamente após verificação
        
    Returns:
        True se pode publicar, False se é duplicado
        
    Exemplo de uso:
        if verificar_antes_de_publicar("Meu Título", "Meu conteúdo", ["blog", "pinterest"]):
            # Publicar post
            pass
        else:
            print("Post duplicado, não publicar")
    """
    preventor = PreventorDuplicidades()
    
    pode, mensagem = preventor.pode_publicar(titulo, conteudo)
    
    print(mensagem)
    
    if pode and auto_registrar:
        preventor.registrar_publicacao(titulo, conteudo, plataformas)
        print(f"📝 Publicação registrada: {titulo}")
    
    return pode


# Exemplo de uso
if __name__ == "__main__":
    print("🛡️  MÓDULO DE PREVENÇÃO DE DUPLICIDADES\n")
    
    # Criar preventor
    preventor = PreventorDuplicidades()
    
    # Exemplo 1: Verificar se pode publicar
    titulo_teste = "Banho em Cães: Frequência e Técnicas Corretas"
    conteudo_teste = "Conteúdo do artigo sobre banho em cães..."
    
    pode, msg = preventor.pode_publicar(titulo_teste, conteudo_teste)
    print(f"Teste 1: {msg}")
    
    # Exemplo 2: Registrar publicação
    if pode:
        preventor.registrar_publicacao(
            titulo_teste,
            conteudo_teste,
            plataformas=['blog', 'pinterest'],
            metadata={'autor': 'Otimiza Farmavet', 'categoria': 'Cuidados'}
        )
        print("✅ Publicação registrada com sucesso")
    
    # Exemplo 3: Verificar duplicata
    pode2, msg2 = preventor.pode_publicar(titulo_teste, conteudo_teste)
    print(f"\nTeste 2 (deve falhar): {msg2}")
    
    # Exemplo 4: Gerar relatório
    print("\n📊 RELATÓRIO:")
    relatorio = preventor.gerar_relatorio()
    for chave, valor in relatorio.items():
        print(f"   {chave}: {valor}")
