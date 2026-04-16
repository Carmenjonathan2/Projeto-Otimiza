@echo off
echo ============================================================
echo Agendando Execucao Semanal do Otimiza Content Suite
echo ============================================================
echo.

set TASK_NAME=OtimizaBotSocialMedia
set SCRIPT_PATH=c:\Users\jonat\OneDrive\Desktop\Projeto Otimiza\otimiza-content-generator\index.js
set NODE_PATH=node

REM Cria a tarefa agendada no Windows para rodar toda segunda-feira as 08:00 da manha
schtasks /create /tn %TASK_NAME% /tr "\"%NODE_PATH%\" \"%SCRIPT_PATH%\" \"Automacao Mensal: Tendencias em Alta (RT, B2B e B2C)\"" /sc weekly /d MON /st 08:00 /ru "%USERNAME%"

echo.
echo ============================================================
echo Tarefa agendada com sucesso!
echo Ela rodara automaticamente toda segunda-feira as 08:00.
echo Caso queira executar agora, basta rodar "node index.js"
echo ============================================================
pause
