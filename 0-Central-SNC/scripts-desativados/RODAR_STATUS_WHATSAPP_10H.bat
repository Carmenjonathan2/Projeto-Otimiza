@echo off
echo ===================================================
echo [AIKA] VITRINE DO DIA - WHATSAPP STATUS
echo ===================================================
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza"

echo 0. Garantindo que nao ha processos do Chrome travando o perfil...
powershell -Command "Get-CimInstance Win32_Process -Filter \"Name = 'chrome.exe'\" | Where-Object { $_.CommandLine -like '*perfil_aika*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" 2>nul

echo 1. Postando 4 Imagens no WhatsApp Status (limite diario)...
node 0-Central-SNC\src\personas\aika\aika_status.js

echo Tarefa Concluida!
