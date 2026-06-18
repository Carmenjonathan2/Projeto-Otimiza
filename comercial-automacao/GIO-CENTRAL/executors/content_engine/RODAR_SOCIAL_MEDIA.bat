@echo off
title Otimiza - Motor de Conteudo Social Media
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza\GIO-CENTRAL\executors\content_engine"

echo ===================================================
echo ✍️ [PASSO 1] GERANDO CONTEUDO (IG + LI + BLOG)
echo ===================================================
node index.js "Automacao Semanal: Tendencias e Insights FarmaVet"

echo.
echo ===================================================
echo 🚀 [PASSO 2] PUBLICANDO RASCUNHOS NO LINKEDIN
echo ===================================================
node publish_linkedin_drafts.js

echo.
echo ===================================================
echo ✅ CICLO DE CONTEUDO CONCLUIDO!
echo Verifique o Notion e o Shopify para rascunhos.
echo ===================================================
timeout /t 10
