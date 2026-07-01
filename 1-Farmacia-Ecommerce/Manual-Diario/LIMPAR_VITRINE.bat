@echo off
echo ===================================================
echo [AIKA] LIXEIRA: LIMPANDO PASTAS DE POSTAGEM
echo ===================================================
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\vitrine-virtual"

echo Esvaziando posts_prontos (Limpeza de segurança)...
del /Q posts_prontos\*.*

echo Historico em posts_enviados mantido!

echo Pastas limpas com sucesso!
