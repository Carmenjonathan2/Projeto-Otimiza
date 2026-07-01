@echo off
title Aika - Fluxo Diario Otimiza
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza"

echo 0. Garantindo que nao ha processos do Chrome travando o perfil...
powershell -Command "Get-CimInstance Win32_Process -Filter \"Name = 'chrome.exe'\" | Where-Object { $_.CommandLine -like '*perfil_aika*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" 2>nul

echo ===================================================
echo 🎂 [PASSO 1] INICIANDO PARABENS DO DIA (MODO TURBO)
echo ===================================================
node "4-Time-Casa\aniversarios_aika.js"

echo.
echo ===================================================
echo 📧 [PASSO 2] NOTIFICACAO DE PROSPECCAO MANUAL
echo ===================================================
node "comercial-automacao\GIO-CENTRAL\executors\direct_sales\manual_notificador.js"
node "comercial-automacao\GIO-CENTRAL\executors\direct_sales\manual_notificador_rt.js"

echo.
echo ===================================================
echo ⏳ [PAUSA ESTRATEGICA] DESCANSO DE 2 HORAS (7200s)
echo ===================================================
echo O WhatsApp precisa desse tempo para manter a seguranca.
timeout /t 7200 /nobreak

echo.
echo ===================================================
echo 🏢 [PASSO 3] PROSPECCAO B2B (CONDOMINIOS)
echo ===================================================
node "comercial-automacao\GIO-CENTRAL\executors\direct_sales\b2b_whatsapp.js"

echo.
echo ===================================================
echo ⏳ [PASSO 4] ALERTA DE ESTOQUE INTELIGENTE
echo ===================================================
node "comercial-automacao\GIO-CENTRAL\executors\inventory\notificador_vencimento.js"

echo.
echo ===================================================
echo ✅ FLUXO DIARIO FINALIZADO COM SUCESSO!
echo ===================================================
timeout /t 10
