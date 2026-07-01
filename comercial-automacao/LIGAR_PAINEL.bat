@echo off
title Servidor do Painel de Autoridade - Otimiza FarmaVet
cd /d "C:\Users\jonat\OneDrive\Desktop\Otimiza\painel-autoridade"

echo ===================================================
echo ⚙️ LIGANDO O MOTOR DO PAINEL DE AUTORIDADE...
echo ===================================================
echo.
echo Mantenha esta janela aberta enquanto estiver usando o painel.
echo Se voce fechar esta janela preta, o painel sai do ar!
echo.

:: Abre o navegador automaticamente
start http://localhost:4000

:: Liga o servidor
node server.js
