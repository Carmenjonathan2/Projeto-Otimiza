@echo off
echo ===================================================
echo [AIKA] VITRINE DO DIA - INSTAGRAM STORIES
echo ===================================================
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza"

echo 1. Buscando Promocoes na Shopify e gerando flyers...
node 0-Central-SNC\src\personas\aika\aika_vitrine.js

echo 2. Postando 4 Stories no Instagram (limite diario)...
node 0-Central-SNC\src\personas\aika\aika_instagram.js

echo Tarefa Concluida! WPP fica com a Paula.
