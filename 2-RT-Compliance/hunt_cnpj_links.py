import pandas as pd
from googlesearch import search
import time
import os

INPUT_FILE = "top_50_petshops_bh.csv"
OUTPUT_FILE = "top_50_links_cnpj.csv"

def find_cnpj_link(name):
    query = f"site:cnpj.biz OR site:casadosdados.com.br {name} Belo Horizonte CNPJ"
    try:
        # Pega o primeiro resultado que parece ser de um portal de CNPJ
        for result in search(query, num=3, stop=3, pause=2):
            if "cnpj.biz" in result or "casadosdados.com.br" in result or "econodata" in result:
                return result
        return None
    except:
        return None

def main():
    if not os.path.exists(INPUT_FILE):
        print("Erro: Arquivo não encontrado.")
        return

    df = pd.read_csv(INPUT_FILE)
    print(f"Iniciando varredura de links de CNPJ para {len(df)} leads...")
    
    if 'CNPJ_Link' not in df.columns:
        df['CNPJ_Link'] = None

    for index, row in df.iterrows():
        if pd.isna(row['CNPJ_Link']) or row['CNPJ_Link'] == "":
            print(f"[{index+1}/{len(df)}] Buscando link para: {row['Nome']}...")
            link = find_cnpj_link(row['Nome'])
            df.at[index, 'CNPJ_Link'] = link
            time.sleep(1) # Delay para evitar bloqueio do Google Search

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
    print(f"✅ Varredura concluída! Links salvos em: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
