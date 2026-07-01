"""
Publicador direto via Meta Graph API
Suporta: Reels normais, Reels de Teste (trial), Carrosséis, Imagens

Uso:
  python3 meta_publicar.py --perfil kyenner --video URL --caption "texto" --trial
  python3 meta_publicar.py --perfil otimiza --video URL --caption "texto"
"""

import requests
import time
import argparse
import os
from dotenv import load_dotenv

load_dotenv("automacao/config.env")

API_VERSION = "v21.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"

PERFIS = {
    "kyenner": os.getenv("INSTAGRAM_USER_ID_KYENNER"),
    "otimiza": os.getenv("INSTAGRAM_USER_ID_OTIMIZA"),
}

ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")


def criar_container_reel(ig_user_id, video_url, caption, trial=False):
    params = {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": caption,
        "share_to_feed": "true",
        "access_token": ACCESS_TOKEN,
    }

    if trial:
        # Reel de Teste — só aparece para não-seguidores como amostra
        # MANUAL = você decide na mão se libera pro feed após ver as métricas
        # SS_PERFORMANCE = Instagram libera automaticamente se performar bem
        params["trial_params"] = '{"graduation_strategy": "MANUAL"}'

    r = requests.post(f"{BASE_URL}/{ig_user_id}/media", data=params)
    return r.json()


def criar_container_imagem(ig_user_id, image_url, caption):
    params = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN,
    }
    r = requests.post(f"{BASE_URL}/{ig_user_id}/media", data=params)
    return r.json()


def verificar_status(container_id, tentativas=12, intervalo=10):
    for i in range(tentativas):
        r = requests.get(
            f"{BASE_URL}/{container_id}",
            params={"fields": "status_code", "access_token": ACCESS_TOKEN},
        )
        status = r.json().get("status_code")
        print(f"  [{i+1}/{tentativas}] Status do container: {status}")

        if status == "FINISHED":
            return True
        elif status in ("ERROR", "EXPIRED"):
            print(f"  Erro no processamento: {status}")
            return False

        time.sleep(intervalo)

    print("  Timeout: vídeo ainda processando após espera máxima.")
    return False


def publicar_container(ig_user_id, container_id):
    r = requests.post(
        f"{BASE_URL}/{ig_user_id}/media_publish",
        data={"creation_id": container_id, "access_token": ACCESS_TOKEN},
    )
    return r.json()


def publicar_reel(perfil, video_url, caption, trial=False):
    ig_user_id = PERFIS.get(perfil)
    if not ig_user_id:
        print(f"Perfil '{perfil}' não encontrado. Use: kyenner ou otimiza")
        return

    modo = "REEL DE TESTE" if trial else "REEL"
    print(f"\n{'='*50}")
    print(f"Publicando {modo} no @{perfil}")
    print(f"{'='*50}")

    print("1. Criando container...")
    container = criar_container_reel(ig_user_id, video_url, caption, trial)

    if "error" in container:
        print(f"Erro ao criar container: {container['error']['message']}")
        return

    container_id = container["id"]
    print(f"   Container criado: {container_id}")

    print("2. Aguardando processamento do vídeo...")
    sucesso = verificar_status(container_id)

    if not sucesso:
        print("Publicação cancelada por erro no processamento.")
        return

    print("3. Publicando...")
    resultado = publicar_container(ig_user_id, container_id)

    if "error" in resultado:
        print(f"Erro ao publicar: {resultado['error']['message']}")
        return

    media_id = resultado.get("id")
    print(f"\n✓ Publicado com sucesso!")
    print(f"  Media ID: {media_id}")

    if trial:
        print(f"\n  Este é um REEL DE TESTE.")
        print(f"  Acesse o Instagram para ver as métricas e decidir se libera para todos.")

    return media_id


def publicar_imagem(perfil, image_url, caption):
    ig_user_id = PERFIS.get(perfil)
    if not ig_user_id:
        print(f"Perfil '{perfil}' não encontrado.")
        return

    print(f"\nPublicando IMAGEM no @{perfil}")
    container = criar_container_imagem(ig_user_id, image_url, caption)

    if "error" in container:
        print(f"Erro: {container['error']['message']}")
        return

    resultado = publicar_container(ig_user_id, container["id"])
    print(f"✓ Imagem publicada! ID: {resultado.get('id')}")
    return resultado.get("id")


def testar_conexao():
    print("Testando conexão com a Meta API...\n")
    for nome, ig_id in PERFIS.items():
        if not ig_id:
            print(f"  @{nome}: ID não configurado no config.env")
            continue
        r = requests.get(
            f"{BASE_URL}/{ig_id}",
            params={"fields": "username,followers_count,media_count", "access_token": ACCESS_TOKEN},
        )
        dados = r.json()
        if "error" in dados:
            print(f"  @{nome}: Erro — {dados['error']['message']}")
        else:
            print(f"  @{nome} ({dados.get('username')}): {dados.get('followers_count')} seguidores, {dados.get('media_count')} posts ✓")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publicador Instagram via Meta API")
    parser.add_argument("--perfil", choices=["kyenner", "otimiza"], help="Perfil de destino")
    parser.add_argument("--video", help="URL pública do vídeo (.mp4)")
    parser.add_argument("--imagem", help="URL pública da imagem (.jpg)")
    parser.add_argument("--caption", default="", help="Legenda do post")
    parser.add_argument("--trial", action="store_true", help="Publicar como Reel de Teste")
    parser.add_argument("--testar", action="store_true", help="Testar conexão com a API")
    args = parser.parse_args()

    if args.testar:
        testar_conexao()
    elif args.video:
        publicar_reel(args.perfil, args.video, args.caption, args.trial)
    elif args.imagem:
        publicar_imagem(args.perfil, args.imagem, args.caption)
    else:
        print("Use --video URL ou --imagem URL para publicar, ou --testar para verificar conexão.")
        print("Exemplo: python3 automacao/meta_publicar.py --perfil kyenner --video https://... --caption 'texto' --trial")
