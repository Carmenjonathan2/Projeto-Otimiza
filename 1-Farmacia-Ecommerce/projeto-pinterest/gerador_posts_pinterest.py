# -*- coding: utf-8 -*-
"""
🤖 GERADOR MANUAL DE PINS PINTEREST (WEEKDAY DISTRIBUTION)
==========================================================
Gera postagens visuais (Pins) e textos explicativos de saúde preventiva
e distribui diretamente nas subpastas da Otimiza (Segunda, Quarta, Sexta) 
para facilitar a publicação manual pelo usuário.

Autor: Antigravity AI
Data: 2026-06-08
"""

import os
import sys
import json
import re
import random
from datetime import datetime
import google.generativeai as genai
import urllib.parse
from dotenv import load_dotenv

# Configurar UTF-8 para evitar problemas de console no Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Definir caminhos relativos ao script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Adicionar pasta atual ao path para importações locais
sys.path.append(SCRIPT_DIR)
from image_creator import ImageCreator
import config
import infographic_content

# Carregar variáveis de ambiente do .env na raiz
load_dotenv(os.path.join(ROOT_DIR, ".env"))

class PinterestManualGenerator:
    def __init__(self):
        # 1. Caminhos do sistema
        self.manual_semanal_dir = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "Manual-Semanal"))
        self.db_path = os.path.join(SCRIPT_DIR, "content_database.json")
        self.diretrizes_path = os.path.join(SCRIPT_DIR, "diretrizes_pinterest.md")

        # 2. Configurar API Key do Gemini
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("[WARN] GOOGLE_API_KEY não encontrada no arquivo .env!")
            load_dotenv(os.path.join(SCRIPT_DIR, ".env"))
            api_key = os.getenv("GOOGLE_API_KEY")
            
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-flash-latest')
            self.use_ai = True
            print("[OK] Gemini AI configurado com sucesso!")
        else:
            self.use_ai = False
            print("[WARN] Operando em modo de FALLBACK sem IA (chave ausente).")

        # 3. Carregar Diretrizes Ancoradas
        self.diretrizes_content = self._load_file(self.diretrizes_path, "Diretrizes Pinterest")
        # 4. Carregar Banco de Temas
        self.topics_db = self._load_json(self.db_path, "Banco de Temas")

        # 5. Instanciar criador de imagens visual
        self.image_creator = ImageCreator()

    def _load_file(self, filepath: str, name: str) -> str:
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    print(f"[OK] {name} carregado com sucesso.")
                    return f.read()
            except Exception as e:
                print(f"[WARN] Erro ao ler {name}: {e}")
        else:
            print(f"[WARN] Arquivo {name} não encontrado em: {filepath}")
        return ""

    def _load_json(self, filepath: str, name: str) -> dict:
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    print(f"[OK] {name} JSON carregado com sucesso.")
                    return json.load(f)
            except Exception as e:
                print(f"[WARN] Erro ao ler {name}: {e}")
        else:
            print(f"[WARN] Arquivo {name} não encontrado em: {filepath}")
        return {"topics": []}

    def gerar_post_gemini(self, topic: dict) -> dict:
        """Gera a copy do pin usando o Gemini grounded nas diretrizes do Pinterest."""
        if not self.use_ai:
            return self._gerar_fallback(topic)

        prompt = f"""
        Você é o redator de marketing da Otimiza FarmaVet.
        
        DIRETRIZES DE MARCA, SEO E ESTILO VISUAL DO PINTEREST:
        \"\"\"
        {self.diretrizes_content}
        \"\"\"

        TEMA SELECIONADO:
        - Categoria: {topic.get('category')}
        - Título Base: {topic.get('title')}
        - Descrição Base: {topic.get('description')}

        TAREFA:
        Escreva um post otimizado para o Pinterest sobre este tema.

        REGRAS ADICIONAIS:
        1. Respeite as regras de tom de voz (sem diminutivos como 'cachorrinho/gatinho/bichinho', sem clichês como 'Você sabia?' ou 'No mundo de hoje').
        2. Crie um título curto de imagem em CAIXA ALTA (máximo de 22 caracteres por linha, ideal 1 a 2 linhas) para aparecer no banner do rodapé do Pin.
        3. Escreva uma descrição do Pin chamativa com cerca de 150 a 250 caracteres.
        4. Adicione hashtags relevantes ao final da descrição (ex: #saudepet #dicaspet).

        FORMATO DE RETORNO (Retorne APENAS um JSON no formato abaixo, sem markdown, sem blocos de código python, sem ```json):
        {{
            "titulo_imagem": "TEXTO DA IMAGEM AQUI (MAX 35 CHARS)",
            "titulo_pin": "Título Chamativo do Pin",
            "descricao_pin": "Descrição do Pin com as hashtags aqui..."
        }}
        """

        try:
            response = self.model.generate_content(prompt)
            raw_text = response.text.strip()
            raw_text = re.sub(r"^```json\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)
            
            data = json.loads(raw_text)
            return data
        except Exception as e:
            print(f"[ERROR] Falha na geração Gemini Pinterest: {e}. Executando fallback...")
            return self._gerar_fallback(topic)

    def _gerar_fallback(self, topic: dict) -> dict:
        """Fallback offline se a IA falhar."""
        hashtags_str = " ".join(topic.get("hashtags", ["#saudepet", "#otimizafarmavet"]))
        titulo = topic.get("title", "Dica de Saúde Pet")
        
        # Limitar título da imagem
        titulo_imagem = titulo.upper()
        if len(titulo_imagem) > 35:
            titulo_imagem = titulo_imagem[:32] + "..."
            
        desc = f"{topic.get('description', '')}\n\n{hashtags_str}"
        return {
            "titulo_imagem": titulo_imagem,
            "titulo_pin": titulo,
            "descricao_pin": desc
        }

    def calcular_proximas_datas_lote(self, total_posts: int = 10) -> list:
        """Calcula as próximas datas de publicação (Segunda, Quarta e Sexta às 09:00)."""
        from datetime import timedelta
        hoje = datetime.now()
        datas = []
        dias_validos = {0: "Segunda-feira", 2: "Quarta-feira", 4: "Sexta-feira"}
        
        # Começar a partir de amanhã para evitar agendar no passado
        dia_atual = hoje + timedelta(days=1)
        
        while len(datas) < total_posts:
            weekday = dia_atual.weekday()
            if weekday in dias_validos:
                data_post = dia_atual.replace(hour=9, minute=0, second=0, microsecond=0)
                datas.append(data_post.strftime("%Y-%m-%d %H:%M"))
            dia_atual += timedelta(days=1)
        return datas

    def gerar_e_distribuir_fila_semanal(self, total_posts: int = 10):
        """Gera 10 posts e distribui nas pastas por data e gera arquivo CSV para Buffer."""
        topics = self.topics_db.get("topics", [])
        if not topics:
            print("[ERROR] Nenhum tema disponível no content_database.json.")
            return

        print(f"\n[PINTEREST] Selecionando {total_posts} temas distintos no banco...")
        # Se houver menos temas do que o solicitado, repete ou limita
        if len(topics) < total_posts:
            temas_selecionados = random.choices(topics, k=total_posts)
        else:
            temas_selecionados = random.sample(topics, total_posts)

        datas_sugeridas = self.calcular_proximas_datas_lote(total_posts)
        
        # Para salvar a lista de posts e exportar para CSV e JSON
        posts_gerados = []
        posts_infograficos = []

        import csv
        
        # Definir caminhos de exportação
        csv_filename = "calendario_posts_pinterest.csv"
        csv_filepath = os.path.join(SCRIPT_DIR, csv_filename)

        for idx, tema in enumerate(temas_selecionados):
            data_sugerida = datas_sugeridas[idx]
            
            # Obter dia da semana amigável
            dt_obj = datetime.strptime(data_sugerida, "%Y-%m-%d %H:%M")
            dias_semana_nomes = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]
            dia_nome = dias_semana_nomes[dt_obj.weekday()]
            
            # Formatando nome da subpasta ex: Post-01_Segunda_2026-06-15
            data_limpa = data_sugerida.split(' ')[0]
            pasta_nome = f"Post-{idx+1:02d}_{dia_nome}_{data_limpa}"
            
            pasta_destino = os.path.join(self.manual_semanal_dir, "Fila-Pinterest", pasta_nome)
            os.makedirs(pasta_destino, exist_ok=True)
            
            print(f"\n[POST {idx+1:02d}] Gerando Pin para: '{tema['title']}'...")
            
            # 1. Gerar Cópia
            pin_data = self.gerar_post_gemini(tema)
            whatsapp_link = "https://wa.me/5531987936822?text=" + urllib.parse.quote("Olá! Vim pelo Pinterest e gostaria de tirar uma dúvida.")
            
            # 2. Desenhar e salvar a imagem do Pin (.png) no destino
            img_path = os.path.join(pasta_destino, "pinterest_pin.png")
            try:
                # Obter dados do infográfico estruturado
                infog_data = infographic_content.get_infographic_data(tema)
                
                self.image_creator.create_pin_image(
                    title=pin_data["titulo_imagem"],
                    subtitle=tema.get("subtitle", "Dicas Otimiza"),
                    output_path=img_path,
                    category=tema.get("category", "Geral"),
                    infographic_data=infog_data
                )
            except Exception as e:
                print(f"[ERROR] Falha ao desenhar imagem do Pin: {e}")
                
            # 3. Salvar o arquivo de cópia (.txt) no destino
            copy_path = os.path.join(pasta_destino, "pinterest_copy.txt")
            try:
                with open(copy_path, 'w', encoding='utf-8') as f:
                    f.write(f"📌 TÍTULO DO PIN:\n{pin_data['titulo_pin']}\n\n")
                    f.write(f"📝 DESCRIÇÃO DO PIN:\n{pin_data['descricao_pin']}\n\n")
                    f.write(f"🔗 LINK DO WHATSAPP DE CONVERSÃO:\n{whatsapp_link}\n")
                print(f"[OK] Cópia salva com sucesso em: {copy_path}")
            except Exception as e:
                print(f"[ERROR] Falha ao salvar cópia de texto: {e}")
                
            # 3.5 Salvar o arquivo JSON individual no destino com os metadados e estrutura do infográfico
            json_indiv_path = os.path.join(pasta_destino, "infographic_data.json")
            try:
                with open(json_indiv_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        "posting_time": data_sugerida,
                        "dia_nome": dia_nome,
                        "titulo_pin": pin_data["titulo_pin"],
                        "descricao_pin": pin_data["descricao_pin"],
                        "whatsapp_link": whatsapp_link,
                        "infographic_data": infog_data
                    }, f, ensure_ascii=False, indent=2)
                print(f"[OK] Dados do infográfico salvos individualmente em: {json_indiv_path}")
            except Exception as e:
                print(f"[ERROR] Falha ao salvar JSON individual: {e}")
                
            # Adicionar à lista para exportar CSV com as colunas corretas exigidas pelo Buffer para Pinterest
            posts_gerados.append({
                "text": pin_data["titulo_pin"],
                "image_url": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
                "board_name": getattr(config, "PINTEREST_BOARD_NAME", "Dicas tutores"),
                "tags": "",
                "posting_time": data_sugerida,
                "title": pin_data["titulo_pin"],
                "description": pin_data["descricao_pin"],
                "alt_text": pin_data["titulo_pin"],
                "link": whatsapp_link
            })
            
            # Adicionar à lista para exportar JSON
            posts_infograficos.append({
                "posting_time": data_sugerida,
                "dia_nome": dia_nome,
                "infographic_data": infog_data,
                "whatsapp_link": whatsapp_link
            })

        # 4. Exportar CSV para Buffer (Pinterest)
        try:
            with open(csv_filepath, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["text", "image_url", "board_name", "tags", "posting_time", "title", "description", "alt_text", "link"])
                for post in posts_gerados:
                    writer.writerow([
                        post["text"],
                        post["image_url"],
                        post["board_name"],
                        post["tags"],
                        post["posting_time"],
                        post["title"],
                        post["description"],
                        post["alt_text"],
                        post["link"]
                    ])
            print(f"\n[OK] Calendário Pinterest exportado em CSV para: {csv_filepath}")
            
            # Copiar para a pasta Manual-Semanal
            if os.path.exists(self.manual_semanal_dir):
                dest_path = os.path.join(self.manual_semanal_dir, csv_filename)
                import shutil
                shutil.copy2(csv_filepath, dest_path)
                print(f"[OK] Cópia do CSV exportada para a pasta central: {dest_path}")
                
            # Salvar em JSON para o usuário
            json_filename = "calendario_posts_pinterest.json"
            json_filepath = os.path.join(SCRIPT_DIR, json_filename)
            with open(json_filepath, 'w', encoding='utf-8') as f:
                json.dump(posts_infograficos, f, ensure_ascii=False, indent=2)
            print(f"[OK] Calendário Pinterest exportado em JSON para: {json_filepath}")
            
            # Copiar JSON para a pasta Manual-Semanal
            if os.path.exists(self.manual_semanal_dir):
                dest_json_path = os.path.join(self.manual_semanal_dir, json_filename)
                import shutil
                shutil.copy2(json_filepath, dest_json_path)
                print(f"[OK] Cópia do JSON exportada para a pasta central: {dest_json_path}")
                
        except Exception as e:
            print(f"[ERROR] Falha ao exportar CSV/JSON Pinterest: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("📌 INICIANDO GERADOR MANUAL E DISTRIBUIDOR DO PINTEREST")
    print("=" * 60)
    
    generator = PinterestManualGenerator()
    generator.gerar_e_distribuir_fila_semanal()
    print("\n✅ Geração de fila manual do Pinterest concluída!")
