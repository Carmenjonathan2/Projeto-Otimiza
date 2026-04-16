
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# Configurações do Google Business Profile API
SCOPES = ['https://www.googleapis.com/auth/business.manage']

class GMBManager:
    def __init__(self, credentials_file='client_secret.json', token_file='gmb_token.pickle'):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.creds = self._get_credentials()
        self.service = build('mybusinessbusinessinformation', 'v1', credentials=self.creds)
        # Nota: As APIs do GMB são divididas. Para posts usamos 'mybusinessverifications' ou a específica de localização.
        # Em 2026, a estrutura consolidada costuma ser via 'mybusinessbusinessinformation' e 'mybusinessplaceactions'.
        
    def _get_credentials(self):
        creds = None
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Erro: Arquivo {self.credentials_file} não encontrado.")
                    print("Por favor, baixe o JSON de credenciais OAuth do Google Cloud Console.")
                    return None
                    
                flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
                
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
        return creds

    def list_accounts(self):
        """Lista as contas do GMB."""
        service = build('mybusinessaccountmanagement', 'v1', credentials=self.creds)
        accounts = service.accounts().list().execute()
        return accounts.get('accounts', [])

    def list_locations(self, account_name):
        """Lista as localizações para uma conta específica."""
        service = build('mybusinessbusinessinformation', 'v1', credentials=self.creds)
        locations = service.accounts().locations().list(parent=account_name, readMask="name,title").execute()
        return locations.get('locations', [])

    def create_post(self, location_name, post_data):
        """
        Cria um post no GMB.
        post_data: {
            'text': 'Corpo do post',
            'cta_type': 'WHATSAPP',
            'cta_url': 'https://wa.me/...',
            'media_url': 'https://...' # O GMB requer URL pública para imagens via API
        }
        """
        # Para posts, usamos a API de Business Profile Performance ou a My Business Local Post
        # A URL base costuma ser: https://mybusiness.googleapis.com/v4/{parent}/localPosts
        
        # Como a API do Google é complexa, aqui usaremos o discovery service simplificado
        # Em implementações reais, usamos o service específico.
        print(f"📡 Enviando post para {location_name}...")
        
        post_body = {
            "languageCode": "pt-BR",
            "summary": post_data['text'],
            "callToAction": {
                "actionType": post_data['cta_type'],
                "url": post_data['cta_url']
            }
        }
        
        if 'media_url' in post_data:
            post_body["media"] = [{
                "mediaFormat": "PHOTO",
                "sourceUrl": post_data['media_url']
            }]

        try:
            # Nota: O nome do endpoint de posts muda conforme a versão. 
            # Abaixo é a estrutura conceitual v4 que é a mais estável para Posts.
            service_v4 = build('mybusiness', 'v4', credentials=self.creds, static_discovery=False)
            result = service_v4.accounts().locations().localPosts().create(
                parent=location_name,
                body=post_body
            ).execute()
            print("✅ Post criado com sucesso no GMB!")
            return result
        except Exception as e:
            print(f"❌ Erro ao criar post no GMB: {e}")
            return None

if __name__ == "__main__":
    # Teste de autenticação
    manager = GMBManager()
    if manager.creds:
        print("🔓 Autenticação concluída!")
        accounts = manager.list_accounts()
        print(f"Contas encontradas: {len(accounts)}")
        for acc in accounts:
            print(f"- {acc['accountName']} ({acc['type']})")
