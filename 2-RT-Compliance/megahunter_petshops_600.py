import googlemaps
import csv
import os
import time
from dotenv import load_dotenv

env_path = "cold-email-automation/.env"
load_dotenv(env_path)

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
OUTPUT_FILE = "petshops_mg_600_leads.csv"

def save_lead_incremental(lead):
    file_exists = os.path.isfile(OUTPUT_FILE)
    with open(OUTPUT_FILE, "a", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=lead.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(lead)

def get_petshops(city_query, current_count, limit=600):
    gmaps = googlemaps.Client(key=API_KEY)
    city_leads_count = 0
    
    print(f"\n🔎 Varrendo: {city_query}")
    
    places_result = gmaps.places(query=f"Pet Shop em {city_query}")
    
    while current_count + city_leads_count < limit:
        results = places_result.get('results', [])
        if not results:
            break

        for place in results:
            if current_count + city_leads_count >= limit:
                break
                
            place_id = place['place_id']
            # Para economizar tempo/quota, pegamos info básica primeiro
            lead = {
                "Nome": place.get('name'),
                "Telefone": place.get('formatted_phone_number', "N/A"), # Places basic pode não vir
                "Website": place.get('website', "N/A"),
                "Endereco": place.get('formatted_address'),
                "Cidade": city_query.split(",")[0],
                "Place_ID": place_id
            }
            
            save_lead_incremental(lead)
            city_leads_count += 1
            print(f"[{current_count + city_leads_count}] Capturado: {lead['Nome']}")

        next_page_token = places_result.get('next_page_token')
        if not next_page_token or current_count + city_leads_count >= limit:
            break
            
        time.sleep(2)
        places_result = gmaps.places(query=f"Pet Shop em {city_query}", page_token=next_page_token)

    return city_leads_count

def main():
    if not API_KEY:
        print("Erro: API KEY ausente")
        return

    if os.path.exists(OUTPUT_FILE):
        os.remove(OUTPUT_FILE)

    metro_cities = [
        "Belo Horizonte, MG", "Contagem, MG", "Betim, MG", 
        "Nova Lima, MG", "Santa Luzia, MG", "Sabará, MG", 
        "Ibirité, MG", "Vespasiano, MG", "Ribeirão das Neves, MG"
    ]
    
    total_captured = 0
    for city in metro_cities:
        if total_captured >= 600:
            break
        total_captured += get_petshops(city, total_captured, limit=600)

    print(f"\n✅ Operação Megahunter Concluída! {total_captured} leads em {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
