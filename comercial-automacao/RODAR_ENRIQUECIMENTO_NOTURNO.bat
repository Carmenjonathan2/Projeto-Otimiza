@echo off
title Otimiza - Enriquecimento Noturno de Leads
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza"

echo ===================================================
echo 🧪 [GIO-CENTRAL] INICIANDO ENRIQUECIMENTO DIARIO
echo Objetivo: Processar 60 leads para o dia seguinte.
echo ===================================================

node "GIO-CENTRAL/executors/direct_sales/enriquecedor_diario.js"
python "upload_leads_to_sheets.py"

echo.
echo ===================================================
echo ✅ ENRIQUECIMENTO CONCLUIDO!
echo Base de dados atualizada para amanha.
echo ===================================================
timeout /t 10
