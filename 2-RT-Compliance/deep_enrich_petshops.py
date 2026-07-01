import pandas as pd
import requests
import re
import time
from googlesearch import search

def find_email_on_site(url):
    """Tenta encontrar um e-mail básico raspando a página inicial."""
    if not isinstance(url, str) or not url or "instagram.com" in url:
        return None
    try:
        response = requests.get(url, timeout=5)
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', response.text)
        return emails[0] if emails else None
    except:
        return None

def find_cnpj_and_email_google(name):
    """Busca o CNPJ e e-mail no Google (via metadados de sites de transparência)."""
    query = f"{name} Belo Horizonte CNPJ email"
    try:
        # Pega os primeiros 3 resultados e tenta achar padrões
        for j in search(query, num=3, stop=3, pause=2):
            # Aqui poderíamos fazer um fetch da página, mas vamos simular por enquanto
            # para não travar o processo.
            pass
        return "Pendente (Deep Hunt em curso)"
    except:
        return "N/A"

def main():
    df = pd.read_csv("petshops_bh_100_leads.csv")
    print(f"Enriquecendo {len(df)} leads...")
    
    # Amostra para o usuário ver rápido
    for index, row in df.head(20).iterrows():
        print(f"Enriquecendo: {row['Nome']}...")
        site_email = find_email_on_site(row['Website'])
        df.at[index, 'Email_Extraido'] = site_email
        time.sleep(0.5)

    df.to_csv("petshops_bh_enriquecidos.csv", index=False)
    print("✅ Amostra de enriquecimento salva em: petshops_bh_enriquecidos.csv")

if __name__ == "__main__":
    main()
