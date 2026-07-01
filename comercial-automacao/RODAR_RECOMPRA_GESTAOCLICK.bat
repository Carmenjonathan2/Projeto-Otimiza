@echo off
title Otimiza - Motor de Recompra GestaoClick
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza"

echo ===================================================
2: echo 🧪 [LTV] INICIANDO MOTOR DE RECOMPRA GESTAOCLICK
3: echo Objetivo: Verificar e enviar lembretes ativos de LTV.
echo ===================================================

npm run recompra-gestaoclick

echo.
echo ===================================================
echo ✅ EXECUCAO CONCLUIDA!
echo Logs registrados em notificacoes_recompra.json
echo ===================================================
timeout /t 10
