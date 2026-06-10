import requests
import csv
import time
import os

# Configurações
INPUT_FILE = "cnpjs_para_verificar.txt"
OUTPUT_FILE = "leads_enriquecidos_gio.csv"
API_URL = "https://brasilapi.com.br/api/cnpj/v1/"

def fetch_cnpj_data(cnpj):
    """Consulta os dados do CNPJ na Brasil API."""
    cnpj_clean = "".join(filter(str.isdigit, cnpj))
    try:
        response = requests.get(f"{API_URL}{cnpj_clean}", timeout=10)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return {"error": "CNPJ não encontrado"}
        else:
            return {"error": f"Erro API: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("="*60)
    print("       ENRIQUECEDOR DE LEADS GIO - CNPJ -> EMAIL/SÓCIOS")
    print("="*60)

    if not os.path.exists(INPUT_FILE):
        print(f"❌ Erro: Arquivo {INPUT_FILE} não encontrado.")
        return

    with open(INPUT_FILE, "r") as f:
        cnpjs = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    if not cnpjs:
        print("📭 Nenhum CNPJ para processar.")
        return

    print(f"Processando {len(cnpjs)} leads...")

    file_exists = os.path.exists(OUTPUT_FILE)
    
    for i, cnpj in enumerate(cnpjs, 1):
        print(f"[{i}/{len(cnpjs)}] Buscando: {cnpj}...", end="\r")
        data = fetch_cnpj_data(cnpj)
        
        if "error" not in data:
            socios = data.get("qsa", [])
            nome_socio = socios[0].get("nome_socio", "Responsável") if socios else "Responsável"
            
            lead = {
                "CNPJ": data.get("cnpj"),
                "Razao_Social": data.get("razao_social"),
                "Nome_Fantasia": data.get("nome_fantasia"),
                "Socio_Principal": nome_socio,
                "Email": data.get("email"),
                "Telefone": data.get("ddd_telefone_1"),
                "Cidade": data.get("municipio"),
                "Status": data.get("descricao_situacao_cadastral")
            }
            
            # Salvar imediatamente (Append)
            with open(OUTPUT_FILE, "a", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=lead.keys())
                if not file_exists or os.path.getsize(OUTPUT_FILE) == 0:
                    writer.writeheader()
                    file_exists = True
                writer.writerow(lead)
        else:
            print(f"\nErro no CNPJ {cnpj}: {data['error']}")
        
        time.sleep(0.5)

    print(f"\n\n🏁 Processamento finalizado.")

if __name__ == "__main__":
    main()
