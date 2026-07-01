# -*- coding: utf-8 -*-
"""
🤖 GERADOR E PUBLICADOR DE POSTS GMB COM GEMINI
==============================================
Gera e publica postagens de produtos e medicamentos para o Google Meu Negócio da Otimiza FarmaVet,
utilizando inteligência artificial ou fallback, com suporte a publicação direta via API e exportação para agendadores.

Autor: Antigravity AI
Data: 2026-06-08
"""

import os
import sys
import json
import re
import random
import csv
import argparse
import pickle
import urllib.parse
from datetime import datetime, timedelta
import google.generativeai as genai
from google_auth_oauthlib.flow import InstalledAppFlow
import google.auth.transport.requests
import requests
from dotenv import load_dotenv

# Configurar UTF-8 para evitar problemas de console no Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Definir caminhos relativos ao script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Carregar variáveis de ambiente do .env na raiz
load_dotenv(os.path.join(ROOT_DIR, ".env"))

class GMBGeminiGenerator:
    def __init__(self):
        # 1. Caminho do token pickle
        self.pickle_path = os.path.join(SCRIPT_DIR, "gmb_token.pickle")
        self.config_path = os.path.join(SCRIPT_DIR, "config_gmb.json")
        self.ready_posts_dir = os.path.join(SCRIPT_DIR, "posts_prontos_gmb")

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

        # 3. Carregar Diretrizes Ancoradas (NotebookLM Style)
        self.diretrizes_path = os.path.join(SCRIPT_DIR, "diretrizes_gmb.md")
        self.diretrizes_content = self._load_diretrizes()

        # 4. Portfólio de Produtos da Farmácia
        self.produtos = [
            {"nome": "Simparic (Antipulgas e Carrapatos)", "categoria": "Antipulgas"},
            {"nome": "Bravecto (Proteção de 12 semanas)", "categoria": "Antipulgas"},
            {"nome": "Nexgard Spectra (Mastigável contra pulgas, carrapatos e vermes)", "categoria": "Antipulgas/Vermífugo"},
            {"nome": "Cytopoint (Tratamento para dermatite e coceira canina)", "categoria": "Uso Contínuo / Dermatológico"},
            {"nome": "Librela (Tratamento para dor da osteoartrite em cães)", "categoria": "Uso Contínuo / Dor Articular"},
            {"nome": "Vermífugos (Drontal, Milbemax, Endogard)", "categoria": "Vermífugos"},
            {"nome": "Medicamentos Controlados (Antibióticos, Anticonvulsivantes, Psicotrópicos)", "categoria": "Controlados"}
        ]

    def _load_diretrizes(self) -> str:
        """Lê o arquivo de diretrizes do GMB local."""
        if os.path.exists(self.diretrizes_path):
            try:
                with open(self.diretrizes_path, 'r', encoding='utf-8') as f:
                    print("[OK] Diretrizes do GMB carregadas com sucesso.")
                    return f.read()
            except Exception as e:
                print(f"[WARN] Erro ao ler diretrizes: {e}")
        else:
            print(f"[WARN] Arquivo de diretrizes não encontrado em: {self.diretrizes_path}")
        return ""

    def gerar_post_gemini(self, tipo_post: str, produto: dict = None) -> dict:
        """Gera a copy do post GMB usando o Gemini grounded nas diretrizes da marca."""
        if not self.use_ai:
            return self._gerar_fallback(tipo_post, produto)

        # Determinar foco do post
        if tipo_post == "DICA_MEDICAMENTO":
            foco = f"Escreva um post educativo sobre a importância do produto '{produto['nome']}' ({produto['categoria']}) na saúde do pet."
            sugestao_imagem = f"Foto lifestyle de um pet saudável e feliz em ambiente doméstico (ex: deitado no sofá ou brincando no tapete)."
        elif tipo_post == "OFERTA_ENTREGA":
            foco = f"Escreva um post focado na facilidade e agilidade de entrega de medicamentos veterinários em Belo Horizonte, Contagem, Betim, Nova Lima e Santa Luzia."
            sugestao_imagem = f"Foto realista de uma caixinha de medicamentos da Otimiza sendo entregue ou uma foto limpa de medicamentos de marca sobre uma mesa de madeira."
        else: # CONTROLADOS
            foco = f"Escreva um post explicativo de utilidade pública ensinando como comprar Medicamentos Controlados Veterinários na Otimiza enviando a receita via WhatsApp."
            sugestao_imagem = f"Foto focada de uma receita veterinária ao lado de embalagens de medicamentos ou de um tutor com celular na mão acariciando o pet."

        prompt = f"""
        Você é o redator de marketing da Otimiza FarmaVet.
        
        DIRETRIZES DE MARCA, SEO LOCAL E TOM DE VOZ:
        \"\"\"
        {self.diretrizes_content}
        \"\"\"
        
        TAREFA:
        {foco}
        
        REGRAS ADICIONAIS:
        1. Respeite estritamente as regras de tom de voz (sem diminutivos como 'cachorrinho/gatinho/bichinho', sem clichês como 'Você sabia?' ou 'No mundo de hoje').
        2. Seja direto, acolhedor e focado na Grande BH (Belo Horizonte, Betim, Contagem, Nova Lima, Santa Luzia).
        3. Escreva um título curto em caixa alta (máximo 60 caracteres).
        4. O corpo do texto deve ter entre 100 e 200 palavras.
        5. Termine com a CTA correta apontando para o WhatsApp e assine como 'Equipe Otimiza FarmaVet 🟣' ou 'Farmácia Otimiza FarmaVet 🩺'.

        FORMATO DE RETORNO (Retorne APENAS um JSON no formato abaixo, sem markdown, sem blocos de código python, sem ```json):
        {{
            "titulo": "TÍTULO DO POST AQUI",
            "corpo": "Texto do corpo do post aqui...",
            "cta_texto": "Texto sugerido para o botão (ex: Saiba Mais ou Ligar)"
        }}
        """

        try:
            response = self.model.generate_content(prompt)
            raw_text = response.text.strip()
            raw_text = re.sub(r"^```json\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)
            
            data = json.loads(raw_text)
            data["tipo"] = tipo_post
            data["sugestao_imagem"] = sugestao_imagem
            data["whatsapp_link"] = "https://wa.me/5531987936822?text=" + urllib.parse.quote("Olá! Vim pelo Google e gostaria de cotar um medicamento.")
            return data
            
        except Exception as e:
            print(f"[ERROR] Falha na geração Gemini: {e}. Executando fallback...")
            return self._gerar_fallback(tipo_post, produto)

    def _gerar_fallback(self, tipo_post: str, produto: dict) -> dict:
        """Gera um post template caso o Gemini falhe ou a API Key esteja ausente."""
        whatsapp = "31987936822"
        whatsapp_link = f"https://wa.me/55{whatsapp}?text=" + urllib.parse.quote("Olá! Vim pelo Google e gostaria de cotar um medicamento.")
        
        if tipo_post == "DICA_MEDICAMENTO":
            prod_name = produto['nome'] if produto else "Simparic"
            return {
                "tipo": "DICA_MEDICAMENTO",
                "titulo": f"PROTEÇÃO CONTRA PARASITAS: {prod_name.upper()}",
                "corpo": f"Manter a saúde do seu pet in dia exige proteção constante. O {prod_name} é essencial para manter pulgas e carrapatos longe do seu pet, evitando anemia e doenças graves de pele.\n\nTemos estoque completo com entrega expressa para toda a Grande BH.\n\nFale conosco no WhatsApp!",
                "cta_texto": "Saiba Mais",
                "sugestao_imagem": "Foto lifestyle de um cão feliz no sofá.",
                "whatsapp_link": whatsapp_link
            }
        elif tipo_post == "OFERTA_ENTREGA":
            return {
                "tipo": "OFERTA_ENTREGA",
                "titulo": "MEDICAMENTOS PET COM ENTREGA EXPRESSA EM BH E REGIÃO",
                "corpo": "Precisa de medicamentos veterinários com urgência? A Otimiza FarmaVet entrega no mesmo dia em Belo Horizonte, Contagem, Betim, Nova Lima e Santa Luzia.\n\nFaça sua cotação rápida sem sair de casa e receba direto na sua porta.\n\nChame no WhatsApp!",
                "cta_texto": "Ligar",
                "sugestao_imagem": "Foto de caixinha de entregas Otimiza.",
                "whatsapp_link": whatsapp_link
            }
        else: # CONTROLADOS
            return {
                "tipo": "CONTROLADOS",
                "titulo": "COMO COMPRAR MEDICAMENTOS CONTROLADOS VETERINÁRIOS",
                "corpo": "Na Otimiza FarmaVet, a compra de medicamentos controlados para cães e gatos é simples e segura. Envie uma foto legível da receita veterinária pelo WhatsApp, nossa equipe valida os dados e enviamos o pedido direto para o seu endereço na Grande BH.\n\nSua receita em mãos e o remédio na sua porta de forma rápida.",
                "cta_texto": "Saiba Mais",
                "sugestao_imagem": "Foto de receita médica ao lado de embalagem de remédio.",
                "whatsapp_link": whatsapp_link
            }

    def calcular_proximas_datas_lote(self, total_posts: int = 10) -> list:
        """Calcula as próximas datas de publicação (Segunda, Quarta e Sexta às 09:00)."""
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

    def gerar_calendario_semanal(self, total_posts: int = 10) -> list:
        """Gera a grade semanal de postagens: Segunda, Quarta e Sexta (10 posts no total)."""
        print(f"[CALENDÁRIO] Gerando grade de {total_posts} posts...")
        calendario = []
        
        # Calcular datas correspondentes
        datas_sugeridas = self.calcular_proximas_datas_lote(total_posts)
        
        # Tipos de posts para alternar
        tipos_posts = ["DICA_MEDICAMENTO", "OFERTA_ENTREGA", "CONTROLADOS"]
        
        # Embaralhar produtos para diversificar
        produtos_pool = list(self.produtos)
        random.shuffle(produtos_pool)
        
        for i in range(total_posts):
            data_sugerida = datas_sugeridas[i]
            # Determinar o dia da semana para exibição amigável
            dt_obj = datetime.strptime(data_sugerida, "%Y-%m-%d %H:%M")
            dias_semana_nomes = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]
            dia_nome = dias_semana_nomes[dt_obj.weekday()]
            
            tipo = tipos_posts[i % len(tipos_posts)]
            produto = produtos_pool[i % len(produtos_pool)]
            
            print(f" -> Criando Post {i+1}/{total_posts} ({tipo} para {dia_nome} - {data_sugerida})...")
            post = self.gerar_post_gemini(tipo, produto)
            post["dia_sugerido"] = dia_nome
            post["data_sugerida"] = data_sugerida
            calendario.append(post)
            
        return calendario

    def exportar_calendario_json(self, calendario: list, filename: str = "calendario_posts_gmb.json") -> str:
        """Salva a grade de posts em JSON na pasta do GMB."""
        filepath = os.path.join(SCRIPT_DIR, filename)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(calendario, f, ensure_ascii=False, indent=2)
            print(f"[OK] Calendário de postagens exportado em JSON para: {filepath}")
            
            # Também copiar para a pasta Manual-Semanal
            manual_semanal_dir = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "Manual-Semanal"))
            if os.path.exists(manual_semanal_dir):
                dest_path = os.path.join(manual_semanal_dir, filename)
                import shutil
                shutil.copy2(filepath, dest_path)
                print(f"[OK] Cópia do JSON exportada para a pasta central: {dest_path}")
                
            return filepath
        except Exception as e:
            print(f"[ERROR] Falha ao exportar JSON: {e}")
            return ""

    def exportar_calendario_csv(self, calendario: list, filename: str = "calendario_posts_gmb.csv") -> str:
        """Salva a grade de posts em CSV formatado para Buffer Bulk Upload (Text, Image URL, Tags, Posting Time)."""
        filepath = os.path.join(SCRIPT_DIR, filename)
        # Usamos utf-8-sig para escrever o BOM (Byte Order Mark), garantindo compatibilidade com Excel e Buffer no Windows
        try:
            with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)
                # Cabeçalhos exatos exigidos pelo Buffer
                writer.writerow(["Text", "Image URL", "Tags", "Posting Time"])
                for post in calendario:
                    # Combinar título, corpo e link de conversão no texto
                    texto_completo = f"{post['titulo']}\n\n{post['corpo']}\n\nFale conosco no WhatsApp: {post['whatsapp_link']}"
                    # Usamos uma foto neutra de pet como placeholder pública para satisfazer as regras do validador do Buffer
                    placeholder_img = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800"
                    writer.writerow([
                        texto_completo,
                        placeholder_img,  # Image URL placeholder (você edita no painel depois)
                        "",               # Tags (em branco)
                        post["data_sugerida"]
                    ])
            print(f"[OK] Calendário de postagens exportado em CSV (Buffer) para: {filepath}")
            
            # Também copiar para a pasta Manual-Semanal
            manual_semanal_dir = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "Manual-Semanal"))
            if os.path.exists(manual_semanal_dir):
                dest_path = os.path.join(manual_semanal_dir, filename)
                import shutil
                shutil.copy2(filepath, dest_path)
                print(f"[OK] Cópia do CSV exportada para a pasta central: {dest_path}")
                
            return filepath
        except Exception as e:
            print(f"[ERROR] Falha ao exportar CSV: {e}")
            return ""

    # ==========================================
    # FLUXOS DE AUTENTICAÇÃO E PUBLICAÇÃO API GMB
    # ==========================================

    def autenticar_oauth_gmb(self) -> bool:
        """Inicia fluxo de consentimento local para gerar gmb_token.pickle."""
        client_secret_file = os.path.join(SCRIPT_DIR, "client_secret.json")
        if not os.path.exists(client_secret_file):
            print(f"[ERROR] Arquivo de credenciais '{client_secret_file}' não encontrado.")
            print("Por favor, crie um OAuth Client ID no Google Cloud Console e salve como 'client_secret.json' na pasta do GMB.")
            return False

        print("[OAuth] Iniciando fluxo de consentimento no navegador...")
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file,
                scopes=['https://www.googleapis.com/auth/business.manage']
            )
            credentials = flow.run_local_server(port=0)
            
            with open(self.pickle_path, 'wb') as token_file:
                pickle.dump(credentials, token_file)
            print(f"[OK] Token OAuth salvo com sucesso em: {self.pickle_path}")
            return True
        except Exception as e:
            print(f"[ERROR] Falha no fluxo OAuth: {e}")
            return False

    def obter_credenciais_ativas(self):
        """Carrega e atualiza (refresh) o token existente."""
        if not os.path.exists(self.pickle_path):
            print("[WARN] gmb_token.pickle não encontrado. Você precisa rodar o script com '--auth' primeiro.")
            return None
        
        try:
            with open(self.pickle_path, 'rb') as token_file:
                credentials = pickle.load(token_file)
            
            if credentials.expired:
                print("[OAuth] Token expirado. Solicitando renovação automática...")
                request = google.auth.transport.requests.Request()
                credentials.refresh(request)
                with open(self.pickle_path, 'wb') as token_file:
                    pickle.dump(credentials, token_file)
                print("[OK] Token renovado e atualizado no disco.")
            
            return credentials
        except Exception as e:
            print(f"[ERROR] Falha ao obter/renovar credenciais: {e}")
            print("Tente reautorizar rodando o script com '--auth'.")
            return None

    def buscar_location_name(self, credentials) -> str:
        """Busca automaticamente o nome completo da localização do GMB no formato 'accounts/*/locations/*'."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                    loc_name = cfg.get("location_name")
                    if loc_name:
                        return loc_name
            except:
                pass

        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        
        print("[API GMB] Consultando contas vinculadas...")
        try:
            r = requests.get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", headers=headers)
            if r.status_code != 200:
                print(f"[ERROR] Não foi possível buscar contas GMB: {r.status_code} - {r.text}")
                return ""
            
            accounts = r.json().get("accounts", [])
            if not accounts:
                print("[ERROR] Nenhuma conta GMB encontrada para este perfil.")
                return ""
            
            account_name = accounts[0]["name"]
            print(f"[API GMB] Usando conta: {accounts[0].get('accountName')} ({account_name})")
            
            print(f"[API GMB] Consultando localizações...")
            loc_url = f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_name}/locations"
            params = {"readMask": "name,title"}
            r_loc = requests.get(loc_url, headers=headers, params=params)
            
            if r_loc.status_code != 200:
                print(f"[ERROR] Não foi possível buscar localizações: {r_loc.status_code} - {r_loc.text}")
                return ""
                
            locations = r_loc.json().get("locations", [])
            if not locations:
                print("[ERROR] Nenhuma localização encontrada nesta conta.")
                return ""
            
            # Tentar encontrar a "Otimiza"
            location_name = None
            for loc in locations:
                if "otimiza" in loc.get("title", "").lower():
                    location_name = loc["name"]
                    print(f"[OK] Localização identificada: {loc['title']} ({location_name})")
                    break
            
            if not location_name:
                location_name = locations[0]["name"]
                print(f"[WARN] Localização 'Otimiza' não encontrada. Usando primeira disponível: {locations[0]['title']} ({location_name})")
                
            # Salvar no config
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump({"location_name": location_name}, f, ensure_ascii=False, indent=2)
                
            return location_name
            
        except Exception as e:
            print(f"[ERROR] Falha de comunicação com a API GMB: {e}")
            return ""

    def publicar_post_api(self, location_name: str, post: dict, credentials) -> bool:
        """Realiza a chamada POST para publicar o post na API do GMB."""
        headers = {
            "Authorization": f"Bearer {credentials.token}",
            "Content-Type": "application/json"
        }
        
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/localPosts"
        
        # Corpo do post
        payload = {
            "languageCode": "pt-BR",
            "summary": f"{post['titulo']}\n\n{post['corpo']}"
        }
        
        # Adicionar botão de CTA
        if post.get("cta_texto", "").lower() == "ligar":
            payload["callToAction"] = {
                "actionType": "CALL"
            }
        else:
            payload["callToAction"] = {
                "actionType": "LEARN_MORE",
                "url": post["whatsapp_link"]
            }
            
        try:
            r = requests.post(url, headers=headers, json=payload)
            if r.status_code in (200, 201):
                print(f"[OK] Post '{post['titulo'][:30]}...' publicado com sucesso!")
                return True
            else:
                print(f"[ERROR] Erro ao postar na API: {r.status_code} - {r.text}")
                return False
        except Exception as e:
            print(f"[ERROR] Exceção ao postar: {e}")
            return False

    def publicar_calendario_api(self, calendario: list) -> int:
        """Publica todas as postagens da grade diretamente no GMB."""
        credentials = self.obter_credenciais_ativas()
        if not credentials:
            print("[ERROR] Não foi possível autenticar. Certifique-se de ter rodado o script com '--auth'.")
            return 0
            
        location_name = self.buscar_location_name(credentials)
        if not location_name:
            print("[ERROR] Localização do GMB não encontrada.")
            return 0
            
        sucessos = 0
        print(f"\n[API GMB] Iniciando publicação direta de {len(calendario)} posts...")
        for post in calendario:
            if self.publicar_post_api(location_name, post, credentials):
                sucessos += 1
                
        return sucessos

    # ==========================================
    # FLUXO PARA PUBLICAR POSTS PRONTOS (ARQUIVOS)
    # ==========================================

    def parse_ready_post(self, filepath: str) -> dict:
        """Faz o parsing do arquivo txt de posts prontos no formato correto para a API."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Extrair Título
            title_match = re.search(r"TÍTULO DO POST:\s*(.*)", content)
            if not title_match:
                # Se não bater a expressão regular, tenta obter a primeira linha
                linhas = [l.strip() for l in content.split('\n') if l.strip()]
                titulo = linhas[0] if linhas else "Post Pronto Otimiza"
            else:
                titulo = title_match.group(1).strip()
            
            # Extrair Corpo (entre as duas linhas de separadores de igual ==============)
            body_parts = content.split("==============================")
            if len(body_parts) >= 3:
                corpo = body_parts[1].strip()
            else:
                # Fallback simples removendo as linhas marcadoras
                corpo = re.sub(r"TÍTULO DO POST:.*", "", content)
                corpo = re.sub(r"===+", "", corpo)
                corpo = re.sub(r"Sugestão de CTA:.*", "", corpo)
                corpo = re.sub(r"Link Sugerido:.*", "", corpo)
                corpo = corpo.strip()
                
            # Extrair Link
            link_match = re.search(r"Link Sugerido:\s*(.*)", content)
            link = link_match.group(1).strip() if link_match else "https://wa.me/5531987936822"
            
            # Extrair Texto do CTA
            cta_match = re.search(r"Sugestão de CTA:\s*(.*)", content)
            cta_texto = cta_match.group(1).strip() if cta_match else "Saiba Mais"
            
            return {
                "titulo": titulo,
                "corpo": corpo,
                "whatsapp_link": link,
                "cta_texto": cta_texto
            }
        except Exception as e:
            print(f"[ERROR] Erro no parsing do post pronto '{os.path.basename(filepath)}': {e}")
            return None

    def publicar_posts_prontos_pasta(self) -> int:
        """Lê todos os arquivos de legenda da pasta posts_prontos_gmb e publica na API."""
        if not os.path.exists(self.ready_posts_dir):
            print(f"[ERROR] Pasta de posts prontos não existe em: {self.ready_posts_dir}")
            return 0
            
        legendas = [os.path.join(self.ready_posts_dir, f) for f in os.listdir(self.ready_posts_dir) if f.endswith("_legenda.txt")]
        if not legendas:
            print(f"[WARN] Nenhum arquivo com final '_legenda.txt' encontrado em: {self.ready_posts_dir}")
            return 0
            
        print(f"\n[GMB] Encontrados {len(legendas)} posts prontos para processar.")
        
        credentials = self.obter_credenciais_ativas()
        if not credentials:
            print("[ERROR] Não foi possível autenticar. Rode com '--auth' primeiro.")
            return 0
            
        location_name = self.buscar_location_name(credentials)
        if not location_name:
            print("[ERROR] Localização do GMB não encontrada.")
            return 0
            
        posts_parsed = []
        for path in sorted(legendas):
            post = self.parse_ready_post(path)
            if post:
                post["arquivo_origem"] = os.path.basename(path)
                posts_parsed.append(post)
                
        if not posts_parsed:
            print("[WARN] Nenhum post pronto pôde ser interpretado corretamente.")
            return 0
            
        print(f"\n=== POSTS PRONTOS IDENTIFICADOS ({len(posts_parsed)}) ===")
        for idx, post in enumerate(posts_parsed, 1):
            print(f"\n[{idx}] Origem: {post['arquivo_origem']}")
            print(f"📌 TÍTULO: {post['titulo']}")
            print(f"📝 CORPO:\n{post['corpo'][:150]}...")
            print(f"🔗 LINK: {post['whatsapp_link']}")
            print("-" * 40)
            
        confirmacao = input(f"\n⚠️ Confirma a publicação direta destes {len(posts_parsed)} posts prontos no Google Meu Negócio? (s/n): ")
        if confirmacao.lower() != 's':
            print("\n[INFO] Operação de publicação cancelada pelo usuário.")
            return 0
            
        sucessos = 0
        for post in posts_parsed:
            print(f"\n🚀 Publicando post pronto: {post['arquivo_origem']}...")
            if self.publicar_post_api(location_name, post, credentials):
                sucessos += 1
                
        return sucessos

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automação e Geração de Conteúdo Google Meu Negócio - Otimiza FarmaVet")
    
    # Parâmetros de comando
    parser.add_argument("--generate", action="store_true", help="Gera o calendário de posts localmente")
    parser.add_argument("--auth", action="store_true", help="Inicia o fluxo de autorização OAuth do Google")
    parser.add_argument("--publish", action="store_true", help="Publica posts gerados diretamente no GMB via API")
    parser.add_argument("--export-csv", action="store_true", help="Gera o calendário de posts e exporta em CSV (Buffer)")
    parser.add_argument("--publish-ready", action="store_true", help="Publica os posts prontos da pasta 'posts_prontos_gmb' via API")
    
    args = parser.parse_args()
    
    # Se nenhum argumento for passado, o padrão é gerar
    if not any(vars(args).values()):
        args.generate = True

    print("=" * 60)
    print("🤖 SISTEMA DE AUTOMAÇÃO GOOGLE MEU NEGÓCIO - OTIMIZA FARMAVET")
    print("=" * 60)
    
    generator = GMBGeminiGenerator()
    
    # FLUXO 1: Autenticação OAuth
    if args.auth:
        print("\n🔑 INICIANDO FLUXO DE AUTORIZAÇÃO...")
        generator.autenticar_oauth_gmb()
        sys.exit(0)
        
    # FLUXO 2: Publicar posts prontos da pasta
    if getattr(args, 'publish_ready', False):
        print("\n📂 PUBLICANDO POSTS PRONTOS DA PASTA...")
        sucessos = generator.publicar_posts_prontos_pasta()
        print(f"\n[OK] Fim do processo. Sucessos: {sucessos}")
        sys.exit(0)
        
    # FLUXO 3: Geração de Posts (e/ou exportação)
    calendario = []
    if args.generate or args.export_csv or args.publish:
        calendario = generator.gerar_calendario_semanal()
        
        # Exibir no terminal para validação
        print("\n=== GRADE DE POSTS GERADA ===")
        for post in calendario:
            print(f"\n📅 SUGERIDO PARA: {post['dia_sugerido']} ({post['data_sugerida']})")
            print(f"📌 TÍTULO: {post['titulo']}")
            print(f"📝 CORPO:\n{post['corpo']}")
            print(f"🔘 BOTÃO CTA: {post['cta_texto']}")
            print(f"🖼️ SUGESTÃO VISUAL: {post['sugestao_imagem']}")
            print(f"🔗 LINK WHATSAPP: {post['whatsapp_link']}")
            print("-" * 50)
            
        generator.exportar_calendario_json(calendario)
        
    if args.export_csv:
        if calendario:
            generator.exportar_calendario_csv(calendario)
        else:
            print("[WARN] Nenhum calendário disponível para exportar CSV.")
            
    if args.publish:
        if calendario:
            confirmacao = input("\n⚠️ Confirma a publicação destes posts diretamente no Google Meu Negócio? (s/n): ")
            if confirmacao.lower() == 's':
                publicados = generator.publicar_calendario_api(calendario)
                print(f"\n[OK] Processo de publicação finalizado. Total de sucessos: {publicados}/{len(calendario)}")
            else:
                print("\n[INFO] Publicação cancelada pelo usuário.")
        else:
            print("[WARN] Nenhum calendário disponível para publicação.")
            
    print("\n✅ Processamento concluído com sucesso!")
