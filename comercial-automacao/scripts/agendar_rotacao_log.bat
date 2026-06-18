@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM Agendamento local da rotação mensal de logs (fallback Windows).
REM
REM Configurar tarefa agendada (rodar 1x como admin):
REM   schtasks /create /tn "OtimizaRotacaoLog" ^
REM     /tr "C:\Users\jonat\Desktop\Carmen\Otimiza-FarmaVet\projeto-otimiza-main\projeto-otimiza-main\0-Central-SNC\scripts\agendar_rotacao_log.bat" ^
REM     /sc monthly /d 1 /st 04:00
REM ─────────────────────────────────────────────────────────────────────────
cd /d "%~dp0\..\.."
echo [INICIO] agendar_rotacao_log.bat %DATE% %TIME%
call npm run rotacionar-log
echo [OK] agendar_rotacao_log.bat %DATE% %TIME%
