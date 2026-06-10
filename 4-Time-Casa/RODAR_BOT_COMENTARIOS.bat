@echo off
title [AIKA] Bot de Comentarios Instagram
echo ===================================================
echo [AIKA] INICIANDO BOT DE COMENTARIOS INSTAGRAM
echo ===================================================
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza"

echo Servidor escutando... Mantenha esta janela aberta.
echo Para parar: feche esta janela.
echo.

node src\personas\aika\webhook_comentarios\server.js
