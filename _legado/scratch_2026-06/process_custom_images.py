# -*- coding: utf-8 -*-
import os
import json
import csv
import sys
import requests
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

sys.stdout.reconfigure(encoding='utf-8')

DESKTOP_PINTEREST_DIR = r"c:\Users\jonat\OneDrive\Desktop\Pinterest"
MANUAL_DIR = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Manual-Semanal"
DEV_DIR = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\projeto-pinterest"
TOKEN_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\2-RT-Compliance\cold-email-automation\token.json"
ENV_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\2-RT-Compliance\cold-email-automation\.env"
SPREADSHEET_ID = "1znGcWOsTYe1luNQ_ABcYS1l0vawctJsGFBuDqTKyJlQ"
RECIPIENT_EMAIL = "carmenmsdcarvalho@gmail.com"

# Mapeamento de termos no nome do arquivo para o índice do post (0-indexed)
MAPPING_TERMS = {
    "Rações": 0,       # Guia_de_Qualidade_de_Rações.png -> Post 1
    "Ração": 0,
    "Qualidade": 0,
    "Gatificação": 1,  # Gatificação_Apartamento... -> Post 2
    "Gatific": 1,
    "Apartamento": 1,
    "Dieta": 2,        # Dieta_Crua_para_Pets.png -> Post 3
    "Crua": 2,
    "Carcinoma": 3,    # Guia_sobre_Carcinoma_em_Gatos.png -> Post 4
    "Caixas": 4,       # Por_que_Gatos_Amam_Caixas_.png -> Post 5 (Gatos e Caixas de Papelão)
    "Papelão": 4,
    "Coprofagia": 5,   # Guia_sobre_Coprofagia_Canina.png -> Post 6 (Coprofagia em Cães)
    "Cognitiva": 6,    # Guia_de_Disfunção_Cognitiva_Animal.png -> Post 7 (Cognição Canina)
    "Demência": 6,
    "Plantas": 7,      # Guia_de_Plantas_para_Pets.png -> Post 8 (Plantas Tóxicas)
    "Tóxicas": 7,
    "Filhotes": 8,     # Doenças Comuns em Filhotes -> Post 9
    "Viroses": 8,
    "Sentidos": 9,     # Super-Sentidos_de_Cães_e_Gatos.png -> Post 10 (O Sexto Sentido)
    "Sensoriais": 9
}

import urllib.parse

def clean_and_encode_url(link):
    if not link:
        return ""
    if "?text=" in link:
        base_url, text_param = link.split("?text=", 1)
        # Unquote first to prevent double-encoding if it's already encoded
        unquoted_text = urllib.parse.unquote(text_param)
        encoded_text = urllib.parse.quote(unquoted_text)
        return f"{base_url}?text={encoded_text}"
    return link

def upload_to_catbox(file_path):
    print(f"Subindo imagem para o Catbox: {os.path.basename(file_path)}...")
    url = "https://catbox.moe/user/api.php"
    try:
        with open(file_path, 'rb') as f:
            files = {'fileToUpload': f}
            data = {'reqtype': 'fileupload'}
            response = requests.post(url, data=data, files=files)
        if response.status_code == 200:
            uploaded_url = response.text.strip()
            print(f"[OK] Link gerado: {uploaded_url}")
            return uploaded_url
        else:
            print(f"[ERROR] Código de resposta HTTP {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Falha ao subir imagem: {e}")
    return None

def main():
    if not os.path.exists(DESKTOP_PINTEREST_DIR):
        print(f"[ERROR] Pasta do desktop não encontrada em: {DESKTOP_PINTEREST_DIR}")
        return

    # 1. Carregar posts atuais do JSON central
    json_path = os.path.join(MANUAL_DIR, "calendario_posts_pinterest.json")
    if not os.path.exists(json_path):
        print(f"[ERROR] JSON do calendário não encontrado em: {json_path}")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    print(f"[OK] Carregados {len(posts)} posts do calendário.")

    # 2. Identificar e fazer upload das imagens do desktop
    uploaded_urls = {} # maps post_idx -> url
    
    for filename in os.listdir(DESKTOP_PINTEREST_DIR):
        file_path = os.path.join(DESKTOP_PINTEREST_DIR, filename)
        if not os.path.isfile(file_path):
            continue
        
        # Ignorar arquivos que não sejam imagem (como o CSV que está lá)
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.webp']:
            continue
            
        # Tentar mapear para o post correto
        post_idx = None
        for term, idx in MAPPING_TERMS.items():
            if term.lower() in filename.lower():
                post_idx = idx
                break
                
        if post_idx is not None and post_idx < len(posts):
            url = upload_to_catbox(file_path)
            if url:
                uploaded_urls[post_idx] = url
        else:
            print(f"[WARN] Não foi possível mapear o arquivo: {filename}")

    if not uploaded_urls:
        print("[WARN] Nenhuma imagem correspondente foi carregada.")
    else:
        print(f"[OK] Foram vinculadas {len(uploaded_urls)} imagens customizadas.")

    # 3. Atualizar o JSON em memória
    # O JSON central armazena cada post em formato de dicionário
    # Em gerador_posts_pinterest.py a imagem padrão é colocada no CSV, mas vamos atualizar a chave correspondente
    # para registrar a URL da imagem.
    
    updated_posts = []
    for idx, post in enumerate(posts):
        # Adicionar ou atualizar a URL da imagem no post
        image_url = uploaded_urls.get(idx, "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800")
        post["image_url"] = image_url
        
        # Garantir que o link do Whatsapp (source_url) esteja corretamente codificado para o Buffer
        raw_link = post.get("whatsapp_link", "")
        post["whatsapp_link"] = clean_and_encode_url(raw_link)
        
        # Caso a chave original já exista em alguma subestrutura, atualiza
        updated_posts.append(post)

    # Salvar JSON de volta
    for folder in [MANUAL_DIR, DEV_DIR]:
        p = os.path.join(folder, "calendario_posts_pinterest.json")
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(updated_posts, f, ensure_ascii=False, indent=2)
        print(f"[OK] JSON atualizado salvo em: {p}")

    # 4. Atualizar o arquivo CSV do Buffer (Pinterest)
    csv_headers = ["text", "image_url", "board_name", "tags", "posting_time", "title", "description", "alt_text", "link"]
    for folder in [MANUAL_DIR, DEV_DIR]:
        csv_p = os.path.join(folder, "calendario_posts_pinterest.csv")
        with open(csv_p, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(csv_headers)
            for idx, post in enumerate(updated_posts):
                image_url = post.get("image_url", "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800")
                writer.writerow([
                    post.get("titulo_pin"),
                    image_url,
                    "Dicas tutores",
                    "",
                    post.get("posting_time"),
                    post.get("titulo_pin"),
                    post.get("descricao_pin"),
                    post.get("titulo_pin"),
                    post.get("whatsapp_link")
                ])
        print(f"[OK] CSV atualizado salvo em: {csv_p}")

    # 5. Gerar novo arquivo do Excel (.xlsx) com a biblioteca Node
    # Vamos executar o script Node scratch/create_excel.js que reconstrói o Excel com base no novo JSON atualizado!
    print("🚀 Re-gerando arquivo Excel...")
    import subprocess
    node_res = subprocess.run(["node", "scratch/create_excel.js"], capture_output=True, text=True, cwd=r"c:\Users\jonat\OneDrive\Desktop\Otimiza")
    print(node_res.stdout)

    # 6. Atualizar a planilha do Google Sheets Online
    # Carregar variáveis do .env do RT Compliance
    client_id = None
    client_secret = None
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("GOOGLE_CLIENT_ID="):
                    client_id = line.split("=", 1)[1].strip()
                elif line.startswith("GOOGLE_CLIENT_SECRET="):
                    client_secret = line.split("=", 1)[1].strip()

    if client_id and client_secret:
        # Autenticar
        creds = None
        if os.path.exists(TOKEN_PATH):
            with open(TOKEN_PATH, 'r') as token_file:
                token_data = json.load(token_file)
                creds = Credentials(
                    token=token_data.get('access_token'),
                    refresh_token=token_data.get('refresh_token'),
                    token_uri='https://oauth2.googleapis.com/token',
                    client_id=client_id,
                    client_secret=client_secret,
                    scopes=token_data.get('scope').split()
                )
                
        if creds and creds.valid:
            try:
                service = build('sheets', 'v4', credentials=creds)
                
                # Formatar dados para a aba 'Agendamento Buffer'
                val_agendamento = [
                    ["text", "image_url", "board_name", "tags", "posting_time", "title", "description", "alt_text", "link"]
                ]
                for post in updated_posts:
                    val_agendamento.append([
                        post.get("titulo_pin"),
                        post.get("image_url"),
                        "Dicas tutores",
                        "",
                        post.get("posting_time"),
                        post.get("titulo_pin"),
                        post.get("descricao_pin"),
                        post.get("titulo_pin"),
                        post.get("whatsapp_link")
                    ])

                # Formatar dados para a aba 'JSON Infográficos'
                val_json = [
                    ["Tema / Título", "Categoria", "Horário", "Estrutura JSON do Infográfico"]
                ]
                for post in updated_posts:
                    info_data = post.get("infographic_data", {})
                    val_json.append([
                        info_data.get("header", {}).get("title", post.get("titulo_pin")),
                        info_data.get("header", {}).get("category", ""),
                        post.get("posting_time"),
                        json.dumps(info_data, ensure_ascii=False, indent=2)
                    ])

                data = [
                    {'range': 'Agendamento Buffer!A1', 'values': val_agendamento},
                    {'range': 'JSON Infográficos!A1', 'values': val_json}
                ]
                body = {'valueInputOption': 'RAW', 'data': data}
                service.spreadsheets().values().batchUpdate(spreadsheetId=SPREADSHEET_ID, body=body).execute()
                print("[OK] Planilha do Google Sheets atualizada online!")
            except Exception as e:
                print(f"[WARN] Erro ao atualizar Google Sheets online: {e}")

    # 7. Re-enviar e-mail com a nova planilha atualizada com os links das fotos
    if os.path.exists(TOKEN_PATH) and client_id and client_secret:
        try:
            creds = Credentials(
                token=token_data.get('access_token'),
                refresh_token=token_data.get('refresh_token'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=client_id,
                client_secret=client_secret,
                scopes=token_data.get('scope').split()
            )
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                
            service = build('gmail', 'v1', credentials=creds)
            
            message = MIMEMultipart()
            message['to'] = RECIPIENT_EMAIL
            message['subject'] = 'Planilha de Postagens Pinterest - ATUALIZADA COM AS IMAGENS'

            body_text = """Olá Carmen,

Atualizei a planilha com os links públicos das imagens personalizadas que você colocou na pasta Pinterest no seu Desktop!

Esses links foram adicionados na coluna "Image URL" para que o Buffer faça o upload em lote contendo as suas imagens reais.

O e-mail contém em anexo o arquivo Excel final (.xlsx) contendo as duas abas.

Atenciosamente,
Antigravity AI
"""
            message.attach(MIMEText(body_text, 'plain'))

            excel_file_p = os.path.join(MANUAL_DIR, "calendario_posts_pinterest.xlsx")
            with open(excel_file_p, 'rb') as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename= {os.path.basename(excel_file_p)}",
                )
                message.attach(part)

            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
            print(f"[OK] E-mail atualizado enviado com sucesso para: {RECIPIENT_EMAIL}")
        except Exception as e:
            print(f"[ERROR] Falha ao enviar e-mail atualizado: {e}")

if __name__ == "__main__":
    main()
