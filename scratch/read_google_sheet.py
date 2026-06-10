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

    service = build('sheets', 'v4', credentials=creds)
    
    # Obter metadados da planilha
    spreadsheet = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    sheets = spreadsheet.get('sheets', [])
    print("Planilha Online - Abas Encontradas:")
    for sheet in sheets:
        print(f"- {sheet['properties']['title']} (ID: {sheet['properties']['sheetId']})")
        
        # Ler primeiras linhas desta aba
        title = sheet['properties']['title']
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{title}'!A1:D3"
        ).execute()
        rows = result.get('values', [])
        print(f"  Total de linhas lidas: {len(rows)}")
        if rows:
            print(f"  Cabeçalho: {rows[0]}")
            if len(rows) > 1:
                print(f"  Primeira linha de dados: {rows[1]}")

if __name__ == "__main__":
    main()
