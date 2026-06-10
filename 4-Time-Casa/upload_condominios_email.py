import pandas as pd
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os
import json

# Configurações
SPREADSHEET_ID = '12RY8cn0yPq442v6pzJ1MPz_uyMdDd2-E6doLtSmNJ9E'
RANGE_NAME = 'Página1!A' # Vamos ANEXAR ao final
INPUT_FILE = 'condominios_enriquecidos.csv'
ACCOUNT_ID = os.getenv('ACCOUNT_ID')
TOKEN_PATH = f'cold-email-automation/token_{ACCOUNT_ID}.json' if ACCOUNT_ID else 'cold-email-automation/token.json'

def main():
    if not os.path.exists(INPUT_FILE):
        print("Erro: Arquivo de leads não encontrado.")
        return

    # Carregar Leads
    df = pd.read_csv(INPUT_FILE)
    
    # Filtrar apenas os que possuem e-mail e NÃO são placeholders
    placeholders = ['username@example.com', 'email@exemplo.com', 'contato@site.com.br']
    df = df[df['EMAIL'].notna() & (df['EMAIL'] != "")]
    df = df[~df['EMAIL'].isin(placeholders)]
    
    if df.empty:
        print("Nenhum lead com e-mail válido para subir.")
        return

    # Formatar para a Planilha de E-mail
    # Colunas: Nome, Razao_Social, Nome_Fantasia, Endereco, Email, Contexto, Status, Data, MsgID
    values = []
    for _, row in df.iterrows():
        values.append([
            "Responsável",           # Nome
            row['NOME'],             # Razao_Social
            row['NOME'],             # Nome_Fantasia
            row['ENDERECO'],         # Endereco
            row['EMAIL'],            # Email
            "Administradora de Condomínio em BH", # Contexto
            "Aguardando",            # Status
            "",                      # Data
            ""                       # MsgID
        ])

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
            print("Erro: Token inválido ou ausente.")
            return

    service = build('sheets', 'v4', credentials=creds)

    # 1. Buscar e-mails que já estão na planilha para evitar duplicados
    try:
        result_existente = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID, range='Página1!E:E').execute()
        emails_na_planilha = set([row[0] for row in result_existente.get('values', []) if row])
        print(f"Planilha carregada: {len(emails_na_planilha)} e-mails já cadastrados.")
    except Exception as e:
        print(f"Aviso: Não foi possível ler e-mails existentes ({e}). Continuando sem filtro.")
        emails_na_planilha = set()

    # 2. Filtrar apenas os NOVOS leads
    novos_values = [v for v in values if v[4] not in emails_na_planilha]
    
    if not novos_values:
        print("✅ Nenhum lead novo para subir. Todos já estão na planilha.")
        return

    body = {
        'values': novos_values
    }
    
    # Usamos APPEND para não apagar o que já existe
    result = service.spreadsheets().values().append(
        spreadsheetId=SPREADSHEET_ID, range='Página1!A2',
        valueInputOption='RAW', insertDataOption='INSERT_ROWS', body=body).execute()
        
    print(f"OK: {result.get('updates').get('updatedRows')} NOVOS leads de condominios adicionados à planilha!")

if __name__ == "__main__":
    main()
