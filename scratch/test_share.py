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
SPREADSHEET_ID = "1znGcWOsTYe1luNQ_ABcYS1l0vawctJsGFBuDqTKyJlQ"

def main():
    # 1. Carregar variáveis do .env do RT Compliance
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
        print("[ERROR] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausente.")
        return

    # 2. Autenticar
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

    try:
        print("尝试 (Trying) sharing sheet via Drive API...")
        drive_service = build('drive', 'v3', credentials=creds)
        permission = {
            'role': 'reader',
            'type': 'anyone'
        }
        drive_service.permissions().create(
            fileId=SPREADSHEET_ID,
            body=permission
        ).execute()
        print("[OK] Planilha compartilhada com sucesso! Qualquer pessoa com o link pode visualizar.")
    except Exception as e:
        print(f"[ERROR] Falha ao compartilhar planilha: {e}")

if __name__ == "__main__":
    main()
