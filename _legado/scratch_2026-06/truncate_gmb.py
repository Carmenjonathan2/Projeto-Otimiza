# -*- coding: utf-8 -*-
import os
import json
import csv

gmb_dir = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\5-Marketing-Local"
manual_dir = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Manual-Semanal"

# 1. Truncate JSON
json_filenames = ["calendario_posts_gmb.json"]
for filename in json_filenames:
    for folder in [gmb_dir, manual_dir]:
        path = os.path.join(folder, filename)
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Truncar para 7
                truncated_data = data[:7]
                
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(truncated_data, f, ensure_ascii=False, indent=2)
                print(f"[OK] Truncado JSON em: {path}")
            except Exception as e:
                print(f"[ERROR] Falha ao truncar JSON {path}: {e}")

# 2. Truncate CSV
csv_filenames = ["calendario_posts_gmb.csv"]
for filename in csv_filenames:
    for folder in [gmb_dir, manual_dir]:
        path = os.path.join(folder, filename)
        if os.path.exists(path):
            try:
                # Ler todas as linhas
                rows = []
                with open(path, 'r', encoding='utf-8-sig', newline='') as f:
                    reader = csv.reader(f)
                    header = next(reader)
                    for row in reader:
                        rows.append(row)
                
                # Truncar linhas para 7
                truncated_rows = rows[:7]
                
                # Escrever de volta
                with open(path, 'w', encoding='utf-8-sig', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow(header)
                    for row in truncated_rows:
                        writer.writerow(row)
                print(f"[OK] Truncado CSV em: {path}")
            except Exception as e:
                print(f"[ERROR] Falha ao truncar CSV {path}: {e}")
