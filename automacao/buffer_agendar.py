"""
Agendador via Buffer API
Agenda posts nos dois perfis do Instagram com um único comando

Uso:
  python3 automacao/buffer_agendar.py --perfil kyenner --caption "texto" --video URL --horario "2026-07-02T18:00:00"
  python3 automacao/buffer_agendar.py --listar-perfis
"""

import requests
import argparse
import os
from dotenv import load_dotenv

load_dotenv("automacao/config.env")

BUFFER_TOKEN = os.getenv("BUFFER_ACCESS_TOKEN")
BASE_URL = "https://api.bufferapp.com/1"

PERFIS = {
    "kyenner": os.getenv("BUFFER_PROFILE_ID_KYENNER"),
    "otimiza": os.getenv("BUFFER_PROFILE_ID_OTIMIZA"),
}


def listar_perfis():
    r = requests.get(f"{BASE_URL}/profiles.json", params={"access_token": BUFFER_TOKEN})
    perfis = r.json()
    print("\nPerfis conectados no Buffer:\n")
    for p in perfis:
        print(f"  ID: {p['id']}")
        print(f"  Rede: {p['service']} — @{p['service_username']}")
        print()
    return perfis


def agendar_post(perfil, caption, media_url=None, horario=None):
    profile_id = PERFIS.get(perfil)
    if not profile_id:
        print(f"Perfil '{perfil}' não configurado. Rode --listar-perfis para ver os IDs.")
        return

    params = {
        "access_token": BUFFER_TOKEN,
        "profile_ids[]": profile_id,
        "text": caption,
    }

    if horario:
        # Formato: "2026-07-02T18:00:00" (horário local de BH = UTC-3)
        from datetime import datetime
        import calendar
        dt = datetime.fromisoformat(horario)
        params["scheduled_at"] = str(calendar.timegm(dt.timetuple()))
        params["now"] = "false"
    else:
        params["now"] = "true"

    if media_url:
        # Para vídeo/reel
        if media_url.endswith(".mp4") or "video" in media_url:
            params["media[video]"] = media_url
        else:
            params["media[photo]"] = media_url

    r = requests.post(f"{BASE_URL}/updates/create.json", data=params)
    resultado = r.json()

    if resultado.get("success"):
        update = resultado.get("updates", [{}])[0]
        print(f"\n✓ Post agendado para @{perfil}")
        print(f"  ID: {update.get('id')}")
        if horario:
            print(f"  Horário: {horario}")
        else:
            print(f"  Publicando agora")
    else:
        print(f"\nErro ao agendar: {resultado}")

    return resultado


def agendar_ambos(caption_kyenner, caption_otimiza, media_url=None, horario=None):
    """Agenda o mesmo conteúdo nos dois perfis com captions diferentes."""
    print("Agendando nos dois perfis...\n")
    agendar_post("kyenner", caption_kyenner, media_url, horario)
    agendar_post("otimiza", caption_otimiza, media_url, horario)


def ver_fila(perfil):
    profile_id = PERFIS.get(perfil)
    if not profile_id:
        print(f"Perfil '{perfil}' não configurado.")
        return

    r = requests.get(
        f"{BASE_URL}/profiles/{profile_id}/updates/pending.json",
        params={"access_token": BUFFER_TOKEN},
    )
    dados = r.json()
    posts = dados.get("updates", [])

    print(f"\nFila @{perfil} ({len(posts)} posts agendados):\n")
    for p in posts:
        print(f"  [{p.get('scheduled_at', 'sem horário')}] {p.get('text', '')[:60]}...")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agendador Buffer para Instagram")
    parser.add_argument("--perfil", choices=["kyenner", "otimiza", "ambos"], help="Perfil de destino")
    parser.add_argument("--caption", help="Legenda do post")
    parser.add_argument("--caption-otimiza", help="Legenda específica para @otimizafarmavet (quando --perfil ambos)")
    parser.add_argument("--video", help="URL pública do vídeo")
    parser.add_argument("--imagem", help="URL pública da imagem")
    parser.add_argument("--horario", help="Horário de publicação (ex: 2026-07-02T18:00:00)")
    parser.add_argument("--listar-perfis", action="store_true", help="Listar perfis conectados e seus IDs")
    parser.add_argument("--ver-fila", action="store_true", help="Ver posts agendados na fila")
    args = parser.parse_args()

    media = args.video or args.imagem

    if args.listar_perfis:
        listar_perfis()
    elif args.ver_fila and args.perfil:
        ver_fila(args.perfil)
    elif args.perfil == "ambos":
        caption_otimiza = args.caption_otimiza or args.caption
        agendar_ambos(args.caption, caption_otimiza, media, args.horario)
    elif args.perfil and args.caption:
        agendar_post(args.perfil, args.caption, media, args.horario)
    else:
        print("Use --listar-perfis para ver IDs, ou --perfil e --caption para agendar.")
