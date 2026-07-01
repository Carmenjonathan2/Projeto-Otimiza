@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM Agendamento local da análise semanal (fallback enquanto GitHub Actions
REM não está configurado). Rode no Windows Task Scheduler toda segunda 06:00.
REM
REM Configurar tarefa agendada (rodar 1x como admin):
REM   schtasks /create /tn "OtimizaAnaliseSemanal" ^
REM     /tr "C:\Users\jonat\Desktop\Carmen\Otimiza-FarmaVet\projeto-otimiza-main\projeto-otimiza-main\0-Central-SNC\scripts\agendar_analise_semanal.bat" ^
REM     /sc weekly /d MON /st 06:00
REM ─────────────────────────────────────────────────────────────────────────
cd /d "%~dp0\..\.."
echo [INICIO] agendar_analise_semanal.bat %DATE% %TIME%
call npm run analise-semanal
echo [OK] agendar_analise_semanal.bat %DATE% %TIME%
