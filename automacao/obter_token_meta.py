"""
Utilitário para obter e renovar tokens de acesso da Meta API

Passo 1: Gere um token de curta duração no Graph API Explorer
          https://developers.facebook.com/tools/explorer/
          Selecione: seu App > permissões instagram_business_basic, instagram_business_content_publish

Passo 2: Rode este script para trocar pelo token de longa duração (60 dias)
          python3 automacao/obter_token_meta.py --trocar TOKEN_CURTO_AQUI

Passo 3: Cole o token gerado em config.env como META_ACCESS_TOKEN

Passo 4: Para descobrir seu Instagram User ID:
          python3 automacao/obter_token_meta.py --descobrir-ids
"""

import requests
import argparse
import os
from dotenv import load_dotenv

load_dotenv("automacao/config.env")

APP_ID = os.getenv("META_APP_ID")
APP_SECRET = os.getenv("META_APP_SECRET")
ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")


def trocar_por_token_longo(token_curto):
    r = requests.get(
        "https://graph.facebook.com/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": APP_ID,
            "client_secret": APP_SECRET,
            "fb_exchange_token": token_curto,
        },
    )
    dados = r.json()
    if "access_token" in dados:
        print("\n✓ Token de longa duração gerado:")
        print(f"\n  {dados['access_token']}\n")
        print(f"  Expira em: {dados.get('expires_in', '?')} segundos (~60 dias)")
        print("\n  Cole este token em config.env como META_ACCESS_TOKEN")
    else:
        print(f"Erro: {dados}")
    return dados.get("access_token")


def descobrir_ids():
    """Descobre os IDs do Instagram Business Account vinculados ao token."""
    print("\nBuscando Pages e Instagram Accounts vinculados...\n")

    # Busca Pages do Facebook
    r = requests.get(
        "https://graph.facebook.com/me/accounts",
        params={"access_token": ACCESS_TOKEN, "fields": "id,name,instagram_business_account"},
    )
    pages = r.json().get("data", [])

    if not pages:
        print("Nenhuma Page encontrada. Verifique se o token tem permissão pages_show_list.")
        return

    for page in pages:
        print(f"Page: {page['name']} (ID: {page['id']})")
        ig = page.get("instagram_business_account")
        if ig:
            # Busca dados do Instagram
            r2 = requests.get(
                f"https://graph.facebook.com/{ig['id']}",
                params={
                    "fields": "username,followers_count,media_count",
                    "access_token": ACCESS_TOKEN,
                },
            )
            ig_dados = r2.json()
            print(f"  → Instagram: @{ig_dados.get('username')} (ID: {ig['id']})")
            print(f"    Seguidores: {ig_dados.get('followers_count')}, Posts: {ig_dados.get('media_count')}")
            print(f"\n  Cole no config.env:")
            print(f"  INSTAGRAM_USER_ID_[KYENNER ou OTIMIZA]={ig['id']}")
        else:
            print("  → Nenhuma conta Instagram Business vinculada a esta Page.")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Utilitário de tokens Meta API")
    parser.add_argument("--trocar", metavar="TOKEN_CURTO", help="Trocar token curto por token longo (60 dias)")
    parser.add_argument("--descobrir-ids", action="store_true", help="Descobrir Instagram User IDs vinculados")
    args = parser.parse_args()

    if args.trocar:
        trocar_por_token_longo(args.trocar)
    elif args.descobrir_ids:
        descobrir_ids()
    else:
        print(__doc__)
