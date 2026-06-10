@echo off
title Otimiza - Qualificador IA de Leads (17h)
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza"

echo ===================================================
echo 🤖 [GIO-CENTRAL] INICIANDO QUALIFICACAO ESTRATEGICA
echo Objetivo: Categorizar leads para Aika vs Kyenner
echo ===================================================

node "GIO-CENTRAL/executors/direct_sales/qualificador_ia.js"

echo.
echo ===================================================
echo ✅ QUALIFICACAO CONCLUIDA!
echo Pipeline atualizado em pipeline_prospeccao.json
echo ===================================================
timeout /t 10
