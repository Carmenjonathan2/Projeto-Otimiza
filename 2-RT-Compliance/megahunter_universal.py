import googlemaps
import csv
import os
import time
import sys
from dotenv import load_dotenv

# Carrega chaves do ambiente
env_path = "cold-email-automation/.env"
load_dotenv(env_path)

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def save_lead_incremental(lead, output_file):
    file_exists = os.path.isfile(output_file)
    with open(output_file, "a", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=lead.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(lead)

def get_leads(niche, city_query, current_count, limit, output_file):
    gmaps = googlemaps.Client(key=API_KEY)
    city_leads_count = 0
    
    print(f"\n🔍 Buscando {niche} em: {city_query}")
    
    query = f"{niche} em {city_query}"
    places_result = gmaps.places(query=query)
    
    while current_count + city_leads_count < limit:
        results = places_result.get('results', [])
        if not results:
            break

        for place in results:
            if current_count + city_leads_count >= limit:
                break
                
            lead = {
                "Nome": place.get('name'),
                "Telefone": place.get('formatted_phone_number', "N/A"),
                "Website": place.get('website', "N/A"),
                "Endereco": place.get('formatted_address'),
                "Rating": place.get('rating', 0),
                "Total_Avaliacoes": place.get('user_ratings_total', 0),
                "Cidade": city_query.split(",")[0],
                "Nicho": niche,
                "Place_ID": place['place_id']
            }
            
            save_lead_incremental(lead, output_file)
            city_leads_count += 1
            print(f"[{current_count + city_leads_count}] Capturado: {lead['Nome']} ({lead['Rating']} ⭐)")

        next_page_token = places_result.get('next_page_token')
        if not next_page_token or current_count + city_leads_count >= limit:
            break
            
        time.sleep(2)
        places_result = gmaps.places(query=query, page_token=next_page_token)

    return city_leads_count

def main():
    if not API_KEY:
        print("❌ Erro: API KEY ausente no arquivo .env")
        return

    # Parâmetros via linha de comando: python megahunter_universal.py "Nicho" "Cidades separadas por vírgula" "Limite"
    niche = sys.argv[1] if len(sys.argv) > 1 else "Pet Shop"
    cities_input = sys.argv[2] if len(sys.argv) > 2 else "Belo Horizonte, MG"
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    
    metro_cities = [c.strip() for c in cities_input.split(";")]
    
    output_file = f"leads_{niche.lower().replace(' ', '_')}.csv"
    
    if os.path.exists(output_file):
        print(f"⚠️  Arquivo {output_file} já existe. Novos dados serão anexados.")

    total_captured = 0
    for city in metro_cities:
        if total_captured >= limit:
            break
        total_captured += get_leads(niche, city, total_captured, limit, output_file)

    print(f"\n✅ Operação Concluída! {total_captured} leads salvos em {output_file}")

if __name__ == "__main__":
    main()
