@echo off
title Otimiza - Programa de Reativacao Mensal
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\Sistema de Fidelização Otimiza"

echo ===================================================
echo 🚀 [PASSO 1] EXTRAINDO VENDAS DO GESTAO CLICK
echo ===================================================
node robô_vendas.js

echo.
echo ===================================================
echo 🧠 [PASSO 2] PROCESSANDO INTELIGENCIA AIKA
echo ===================================================
node processador_aika.js

echo.
echo ===================================================
echo ✅ PROGRAMA DE REATIVACAO ATUALIZADO!
echo Painel gerado e pronto para disparos.
echo ===================================================
timeout /t 10
