# -*- coding: utf-8 -*-
import os
import json
import base64
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

sys.stdout.reconfigure(encoding='utf-8')

TOKEN_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\2-RT-Compliance\cold-email-automation\token.json"
ENV_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\2-RT-Compliance\cold-email-automation\.env"
ATTACHMENT_PATH = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Manual-Semanal\calendario_posts_pinterest.xlsx"
RECIPIENT_EMAIL = "carmenmsdcarvalho@gmail.com"

def main():
    if not os.path.exists(ATTACHMENT_PATH):
        print(f"[ERROR] Anexo não encontrado em: {ATTACHMENT_PATH}")
        return

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

    print("[OK] Autenticado na API do Gmail!")
    service = build('gmail', 'v1', credentials=creds)

    # 3. Construir a mensagem com o anexo Excel
    message = MIMEMultipart()
    message['to'] = RECIPIENT_EMAIL
    message['subject'] = 'Planilha de Postagens Pinterest - Otimiza FarmaVet'

    body_text = """Olá Carmen,

Segue em anexo a planilha Excel contendo o cronograma de agendamento do Pinterest e a aba com as estruturas JSON detalhadas dos infográficos.

O arquivo também foi salvo localmente no seu computador em:
1-Farmacia-Ecommerce/Manual-Semanal/calendario_posts_pinterest.xlsx

Atenciosamente,
Antigravity AI - Otimiza FarmaVet
"""
    message.attach(MIMEText(body_text, 'plain'))

    # Adicionar anexo
    filename = os.path.basename(ATTACHMENT_PATH)
    try:
        with open(ATTACHMENT_PATH, 'rb') as attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}",
            )
            message.attach(part)
    except Exception as e:
        print(f"[ERROR] Falha ao anexar arquivo: {e}")
        return

    # 4. Enviar e-mail
    try:
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        send_result = service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        print(f"[OK] Planilha enviada com sucesso para o e-mail: {RECIPIENT_EMAIL}")
        print(f"ID do E-mail enviado: {send_result.get('id')}")
    except Exception as e:
        print(f"[ERROR] Falha ao enviar o e-mail: {e}")

if __name__ == "__main__":
    main()
