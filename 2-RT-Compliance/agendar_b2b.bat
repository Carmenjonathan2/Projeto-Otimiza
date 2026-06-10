@echo off
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza"
echo [MÁQUINA B2B] Iniciando disparos da campanha Vet em Casa...
node "GIO-CENTRAL/executors/direct_sales/b2b_whatsapp.js"
echo.
echo Processo finalizado.
timeout /t 10
