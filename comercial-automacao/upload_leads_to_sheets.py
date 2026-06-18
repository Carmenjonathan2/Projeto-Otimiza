import pandas as pd
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os
import json

# Configurações
SPREADSHEET_ID = '1xkGOfzFfRhjp8U77St7-NugvVNLnwdSafQGwN7fMe2g'
RANGE_NAME = 'Página1!A2' # Começamos na A2 para não sobrescrever cabeçalho
INPUT_FILE = 'petshops_bh_enriquecidos.csv'
TOKEN_PATH = 'cold-email-automation/token.json'

def main():
    if not os.path.exists(INPUT_FILE):
        print("Erro: Arquivo de leads não encontrado.")
        return

    # Carregar Leads
    df = pd.read_csv(INPUT_FILE)
    # Limpeza manual de cada célula para garantir compatibilidade JSON 100%
    values = []
    for row in df.values.tolist():
        clean_row = [("" if pd.isna(cell) else cell) for cell in row]
        values.append(clean_row)

    # Autenticação
    creds = None
    if os.path.exists(TOKEN_PATH):
        from dotenv import load_dotenv
        load_dotenv("cold-email-automation/.env")
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

    # Limpar a planilha antes (opcional, ou apenas anexar)
    # Aqui vamos anexar para não perder leads antigos, ou sobrescrever a partir da A2.
    # Vamos usar 'update' para garantir que os 600 ocupem as linhas iniciais.
    
    body = {
        'values': values
    }
    
    result = service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME,
        valueInputOption='RAW', body=body).execute()
        
    print(f"{result.get('updatedCells')} células atualizadas na planilha.")

if __name__ == "__main__":
    main()
