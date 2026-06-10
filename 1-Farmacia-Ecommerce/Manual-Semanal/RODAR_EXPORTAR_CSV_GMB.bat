@echo off
title Otimiza - Exportar Posts GMB para CSV (Buffer)
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\5-Marketing-Local"
echo ===================================================
echo 📂 EXPORTANDO POSTS DO GMB PARA BUFFER (CSV)
echo ===================================================
python gerador_posts_gmb.py --export-csv
pause
