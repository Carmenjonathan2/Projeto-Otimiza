import googlemaps
import csv
import os
import time
from dotenv import load_dotenv

# Carregar variáveis do .env do cold-email-automation
env_path = "cold-email-automation/.env"
load_dotenv(env_path)

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
OUTPUT_FILE = "petshops_bh_100_leads.csv"

def get_petshops(city_query, limit=100):
    gmaps = googlemaps.Client(key=API_KEY)
    all_leads = []
    
    print(f"Buscando Pet Shops em: {city_query}...")
    
    # Busca inicial
    places_result = gmaps.places(query=f"Pet Shop em {city_query}")
    
    while len(all_leads) < limit:
        for place in places_result.get('results', []):
            if len(all_leads) >= limit:
                break
                
            # Pegar detalhes (telefone, site, etc)
            place_id = place['place_id']
            details = gmaps.place(place_id=place_id, fields=['name', 'formatted_phone_number', 'website', 'formatted_address'])
            d = details.get('result', {})
            
            lead = {
                "Nome": d.get('name'),
                "Telefone": d.get('formatted_phone_number'),
                "Website": d.get('website'),
                "Endereco": d.get('formatted_address'),
                "Place_ID": place_id
            }
            all_leads.append(lead)
            print(f"[{len(all_leads)}] Capturado: {lead['Nome']}")
            time.sleep(0.2) # Evitar OVER_QUERY_LIMIT

        # Verificar se tem próxima página
        next_page_token = places_result.get('next_page_token')
        if not next_page_token or len(all_leads) >= limit:
            break
            
        time.sleep(2) # Google exige delay antes de usar next_page_token
        places_result = gmaps.places(query=f"Pet Shop em {city_query}", page_token=next_page_token)

    return all_leads

def main():
    if not API_KEY:
        print("Erro: GOOGLE_MAPS_API_KEY não encontrada no .env")
        return

    # Podemos buscar em BH e cidades satélites para garantir os 100
    cities = ["Belo Horizonte, MG", "Contagem, MG", "Nova Lima, MG", "Betim, MG"]
    leads_totais = []
    
    for city in cities:
        if len(leads_totais) >= 100:
            break
        leads_da_cidade = get_petshops(city, limit=100 - len(leads_totais))
        leads_totais.extend(leads_da_cidade)

    if leads_totais:
        keys = leads_totais[0].keys()
        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(leads_totais)
        print(f"\n✅ Varredura Concluída! {len(leads_totais)} leads salvos em: {OUTPUT_FILE}")
    else:
        print("\n❌ Nenhum lead encontrado.")

if __name__ == "__main__":
    main()
