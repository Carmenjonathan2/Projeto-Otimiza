# -*- coding: utf-8 -*-
import os
import json
import sys
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

sys.stdout.reconfigure(encoding='utf-8')

TOKEN_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\2-RT-Compliance\cold-email-automation\token.json"
ENV_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\2-RT-Compliance\cold-email-automation\.env"
PINTEREST_JSON_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Manual-Semanal\calendario_posts_pinterest.json"

def main():
    if not os.path.exists(PINTEREST_JSON_PATH):
        print("[ERROR] Arquivo calendario_posts_pinterest.json não encontrado.")
        return

    # 1. Carregar posts
    with open(PINTEREST_JSON_PATH, 'r', encoding='utf-8') as f:
        posts = json.load(f)
    print(f"[OK] Carregados {len(posts)} posts do Pinterest.")

    # 2. Carregar variáveis do .env do RT Compliance
    client_id = None
    client_secret = None
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("GOOGLE_CLIENT_ID="):
                    client_id = line.split("=", 1)[1].strip()
                elif line.startswith("GOOGLE_CLIENT_SECRET="):
                    client_secret = line.split("=", 1)[1].strip()

    if not client_id or not client_secret:
        print("[ERROR] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausente no .env.")
        return

    # 3. Autenticar com o token.json
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
            
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("[ERROR] Token inválido ou expirado.")
            return

    print("[OK] Autenticado com sucesso na API do Google Sheets!")
    service = build('sheets', 'v4', credentials=creds)

    # 4. Definir a estrutura da nova planilha
    spreadsheet_body = {
        'properties': {
            'title': 'Calendário de Postagens Pinterest - Otimiza FarmaVet'
        },
        'sheets': [
            {'properties': {'title': 'Agendamento Buffer'}},
            {'properties': {'title': 'JSON Infográficos'}}
        ]
    }

    # Criar a planilha
    print("🚀 Criando nova planilha no Google Drive...")
    spreadsheet = service.spreadsheets().create(body=spreadsheet_body, fields='spreadsheetId').execute()
    spreadsheet_id = spreadsheet.get('spreadsheetId')
    spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
    print(f"[OK] Planilha criada! ID: {spreadsheet_id}")
    print(f"👉 Link da Planilha: {spreadsheet_url}")

    # 5. Formatar dados para a aba 'Agendamento Buffer'
    val_agendamento = [
        ["Text", "Image URL", "Board Name", "Tags", "Posting Time", "Title", "Description", "Alt Text", "Link"]
    ]
    for post in posts:
        val_agendamento.append([
            post.get("titulo_pin"),
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
            "Dicas tutores",
            "",
            post.get("posting_time"),
            post.get("titulo_pin"),
            post.get("descricao_pin"),
            post.get("titulo_pin"),
            post.get("whatsapp_link")
        ])

    # 6. Formatar dados para a aba 'JSON Infográficos'
    val_json = [
        ["Tema / Título", "Categoria", "Horário", "Estrutura JSON do Infográfico"]
    ]
    for post in posts:
        info_data = post.get("infographic_data", {})
        val_json.append([
            info_data.get("header", {}).get("title", post.get("titulo_pin")),
            info_data.get("header", {}).get("category", ""),
            post.get("posting_time"),
            json.dumps(info_data, ensure_ascii=False, indent=2)
        ])

    # 7. Gravar os dados em ambas as abas
    data = [
        {
            'range': 'Agendamento Buffer!A1',
            'values': val_agendamento
        },
        {
            'range': 'JSON Infográficos!A1',
            'values': val_json
        }
    ]
    
    body = {
        'valueInputOption': 'RAW',
        'data': data
    }
    
    print("📝 Gravando dados nas abas correspondentes...")
    result = service.spreadsheets().values().batchUpdate(
        spreadsheetId=spreadsheet_id, body=body).execute()
        
    print(f"✅ Concluído! Planilha de postagens salva e atualizada no Google Drive.")
    print(f"👉 Acesse a planilha clicando no link abaixo:\n{spreadsheet_url}")

if __name__ == "__main__":
    main()
