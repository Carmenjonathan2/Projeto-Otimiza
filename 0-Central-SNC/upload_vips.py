import pandas as pd
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os
import json
from dotenv import load_dotenv

load_dotenv("cold-email-automation/.env")

# Configurações
SPREADSHEET_ID = '1xkGOfzFfRhjp8U77St7-NugvVNLnwdSafQGwN7fMe2g'
RANGE_NAME = 'Página1!A2'
INPUT_FILE = 'vips_segundo_lote.csv'
TOKEN_PATH = 'cold-email-automation/token.json'

def main():
    if not os.path.exists(INPUT_FILE):
        print("Erro: Arquivo não encontrado.")
        return

    # Carregar Leads e filtrar apenas os que têm E-mail
    df = pd.read_csv(INPUT_FILE)
    df_vips = df[df['Email'].notna() & (df['Email'] != "")]
    
    if df_vips.empty:
        print("Nenhum lead VIP com e-mail encontrado para upload.")
        return

    print(f"Preparando upload de {len(df_vips)} leads VIPs...")

    # Formatar dados para o padrão da planilha: Nome (Sócio), Razão, Fantasia, Endereço, Email, Contexto, Status
    values = []
    for _, row in df_vips.iterrows():
        contexto = f"Bem avaliado no Google com {row['Rating']} estrelas e {row['Total_Avaliacoes']} feedbacks."
        values.append([
            row['Nome_Socio'], 
            row['Nome'], 
            row['Nome'], 
            row['Endereco'], 
            row['Email'], 
            contexto, 
            'Aguardando'
        ])

    # Autenticação
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
            print("Erro de autenticação.")
            return

    service = build('sheets', 'v4', credentials=creds)
    
    # Limpar a planilha antes para garantir que os novos fiquem no topo
    service.spreadsheets().values().clear(spreadsheetId=SPREADSHEET_ID, range='Página1!A2:Z100').execute()

    body = {'values': values}
    result = service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME,
        valueInputOption='RAW', body=body).execute()
        
    print(f"✅ {result.get('updatedCells')} células VIPs atualizadas na planilha.")

if __name__ == "__main__":
    main()
