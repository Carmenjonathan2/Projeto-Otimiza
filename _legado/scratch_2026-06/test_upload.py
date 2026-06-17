# -*- coding: utf-8 -*-
import requests
import os

url = "https://catbox.moe/user/api.php"
file_path = r"c:\Users\jonat\OneDrive\Desktop\Pinterest\Guia_sobre_Carcinoma_em_Gatos.png"

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    # Let's search the folder to match the exact filename
    folder = r"c:\Users\jonat\OneDrive\Desktop\Pinterest"
    for name in os.listdir(folder):
        if "Carcinoma" in name:
            file_path = os.path.join(folder, name)
            print(f"Found match: {file_path}")
            break

try:
    with open(file_path, 'rb') as f:
        files = {'fileToUpload': f}
        data = {'reqtype': 'fileupload'}
        response = requests.post(url, data=data, files=files)
        
    print("Response Status:", response.status_code)
    print("Response Text (URL):", response.text.strip())
except Exception as e:
    print("Error:", e)
