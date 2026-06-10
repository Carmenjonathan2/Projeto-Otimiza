@echo off
title Otimiza - Bot de Estoque Inteligente
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza\0-Central-SNC\GIO-CENTRAL\executors\inventory"

echo ===================================================
echo 🍎 INICIANDO MONITOR DE ESTOQUE (AIKA VISION)
echo ===================================================
echo Escaneando validades via Telegram...
echo.
node scanner_validade.js
pause
