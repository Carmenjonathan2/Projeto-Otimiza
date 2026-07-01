@echo off
title Autenticar WhatsApp Aika
echo ===================================================
echo [AIKA] AUTENTICAÇÃO DO WHATSAPP
echo ===================================================
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza"
echo.
echo 1. Fechando processos antigos do Chrome...
taskkill /F /IM chrome.exe 2>nul
echo.
echo 2. Iniciando autenticação...
node auth_whatsapp.js
echo.
pause
