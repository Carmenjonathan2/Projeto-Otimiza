import os
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv

# Configurações
SPREADSHEET_ID = '1j-4ufcfxZqYFH4-blR3dFWWw1nsc4iPadkHC9jW_B0Q'
RANGE_NAME = 'Página1!A1'
INPUT_FILE = 'scratch_mapa_utf8.txt'
TOKEN_PATH = 'cold-email-automation/token.json'
ENV_PATH = 'cold-email-automation/.env'

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Erro: Arquivo {INPUT_FILE} não encontrado.")
        return

    # Ler o conteúdo do arquivo TXT
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Preparar dados para o Google Sheets (lista de listas)
    values = [[line.strip()] for line in lines]

    # Carregar variáveis de ambiente
    load_dotenv(ENV_PATH)

    # Autenticação (Reutilizando a lógica do projeto)
    creds = None
    if os.path.exists(TOKEN_PATH):
        with open(TOKEN_PATH, 'r') as token_file:
            token_data = json.load(token_file)
            creds = Credentials(
                token=token_data.get('access_token'),
                refresh_token=token_data.get('refresh_token'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
                scopes=token_data.get('scope').split()
            )
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("Erro: Token inválido ou ausente. Rode a autenticação manual primeiro.")
            return

    service = build('sheets', 'v4', credentials=creds)

    body = {
        'values': values
    }
    
    print(f"Enviando {len(values)} linhas para a planilha...")
    result = service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME,
        valueInputOption='RAW', body=body).execute()
        
    print(f"Sucesso! {result.get('updatedCells')} células atualizadas.")

if __name__ == "__main__":
    main()
