import requests
from bs4 import BeautifulSoup
import csv
import time
import re
import os

# Configurações
URL = "https://sicrmv.crmvmg.gov.br/Buscar/lisPessoaJuridica.aspx"
INPUT_FILE = "cnpjs_para_verificar.txt"
OUTPUT_FILE = "resultados_consulta_crmv.csv"

# Cabeçalhos para simular um navegador real
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://sicrmv.crmvmg.gov.br",
    "Referer": URL
}

def clean_cnpj(cnpj):
    """Remove caracteres não numéricos do CNPJ."""
    return re.sub(r'\D', '', str(cnpj))

def get_asp_net_hidden_fields(soup):
    """Extrai os campos ocultos necessários para o postback do ASP.NET."""
    fields = {
        "__VIEWSTATE": soup.find("input", {"id": "__VIEWSTATE"})["value"] if soup.find("input", {"id": "__VIEWSTATE"}) else "",
        "__VIEWSTATEGENERATOR": soup.find("input", {"id": "__VIEWSTATEGENERATOR"})["value"] if soup.find("input", {"id": "__VIEWSTATEGENERATOR"}) else "",
        "__EVENTVALIDATION": soup.find("input", {"id": "__EVENTVALIDATION"})["value"] if soup.find("input", {"id": "__EVENTVALIDATION"}) else "",
    }
    return fields

def verify_cnpj(session, cnpj):
    """Realiza a busca de um CNPJ no site do CRMV-MG."""
    try:
        # 1. Carregar a página inicial para pegar os tokens (apenas se for a primeira vez ou se expirar)
        # Para simplificar e garantir, pegamos antes de cada busca ou usamos a da busca anterior
        response = session.get(URL, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        data = get_asp_net_hidden_fields(soup)
        
        # Adicionar os filtros de busca
        data["ctl00$ContentPlaceHolder1$txtCNPJCPF"] = clean_cnpj(cnpj)
        data["ctl00$ContentPlaceHolder1$txtNomeFiltro"] = ""
        # Simular clique no botão de imagem
        data["ctl00$ContentPlaceHolder1$btnPesquisar.x"] = "10"
        data["ctl00$ContentPlaceHolder1$btnPesquisar.y"] = "10"
        
        # 2. Realizar o POST da busca
        response = session.post(URL, data=data, headers=HEADERS, timeout=20)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 3. Extrair resultados
        results = []
        
        grid_div = soup.find("div", {"class": "divGrid"})
        if grid_div:
            table = grid_div.find("table")
            if table:
                rows = table.find_all("tr")
                # Tentar identificar o cabeçalho se existir
                headers = []
                if rows:
                    header_cols = rows[0].find_all(["th", "td"])
                    headers = [h.text.strip() for h in header_cols]
                
                # A partir da segunda linha são os dados
                for row in rows[1:]:
                    cols = row.find_all("td")
                    if len(cols) > 0:
                        row_data = [col.text.strip() for col in cols]
                        # Evitar linhas que parecem ser de paginação ou vazias
                        if len(row_data) > 2 and row_data[0]:
                            results.append(row_data)
        
        if not results:
            return [{"Status": "Não encontrado", "Original_CNPJ": cnpj}]
            
        formatted_results = []
        for res in results:
            item = {"Original_CNPJ": cnpj}
            # Mapear dinamicamente se tivermos headers, senão usar índice
            if headers and len(headers) == len(res):
                for i, h in enumerate(headers):
                    if h:
                        item[h] = res[i]
                    else:
                        item[f"Coluna_{i}"] = res[i]
            else:
                # Fallback caso os headers não combinem
                for i, val in enumerate(res):
                    item[f"Info_{i}"] = val
            
            formatted_results.append(item)
            
        return formatted_results

    except Exception as e:
        return [{"Status": "Erro", "Erro": str(e), "Original_CNPJ": cnpj}]

def main():
    print("="*60)
    print("       VERIFICADOR DE CNPJs - CRMV-MG (Otimiza FarmaVet)")
    print("="*60)
    
    if not os.path.exists(INPUT_FILE):
        print(f"Erro: Arquivo '{INPUT_FILE}' não encontrado.")
        print(f"Crie um arquivo chamado '{INPUT_FILE}' e coloque um CNPJ por linha.")
        with open(INPUT_FILE, "w") as f:
            f.write("# Coloque os CNPJs aqui (um por linha)\n")
        return

    with open(INPUT_FILE, "r") as f:
        cnpjs = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    if not cnpjs:
        print("Nenhum CNPJ encontrado para verificar.")
        return

    print(f"Total de CNPJs para verificar: {len(cnpjs)}")
    
    session = requests.Session()
    todos_resultados = []

    for i, cnpj in enumerate(cnpjs, 1):
        print(f"[{i}/{len(cnpjs)}] Verificando: {cnpj}...", end="\r")
        res = verify_cnpj(session, cnpj)
        todos_resultados.extend(res)
        # Pequeno delay para evitar bloqueios
        time.sleep(1)

    print("\n\nBusca concluída!")
    
    # Salvar em CSV
    if todos_resultados:
        # Coletar todas as chaves únicas de todos os dicionários para garantir que nada falte
        fieldnames = []
        for res in todos_resultados:
            for key in res.keys():
                if key not in fieldnames:
                    fieldnames.append(key)
        
        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8-sig") as f:
            # extrasaction='ignore' por segurança, embora tenhamos pego todas as keys
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(todos_resultados)
        print(f"Resultados salvos em: {OUTPUT_FILE}")
        print("="*60)
    else:
        print("Nenhum resultado para salvar.")

if __name__ == "__main__":
    main()
