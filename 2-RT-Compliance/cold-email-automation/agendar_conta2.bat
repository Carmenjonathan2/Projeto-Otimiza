@echo off
:: Arquivo: agendar_conta2.bat
:: Este arquivo inicia a prospecção usando a SEGUNDA CONTA de e-mail.
:: Na primeira execução, o sistema pedirá autorização. Logue no GMAIL da conta 2.

cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza\cold-email-automation"

:: Variáveis de Ambiente Criadas para Escalonamento
set ACCOUNT_ID=conta2

echo ----------------------------------------------------
echo 🚀 INICIANDO MÁQUINA DE PROSPECÇÃO - CONTA #2
echo ----------------------------------------------------

:: Executa a automação uma única vez e fecha
node index.js --once

echo ----------------------------------------------------
echo ✅ CICLO DE HOJE FINALIZADO (CONTA #2)
echo ----------------------------------------------------

pause
exit
