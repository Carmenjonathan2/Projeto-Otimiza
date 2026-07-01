@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM Agendamento local da limpeza mensal de estado inativo (fallback).
REM Rode no Windows Task Scheduler todo dia 1 às 03:00.
REM
REM Configurar tarefa agendada (rodar 1x como admin):
REM   schtasks /create /tn "OtimizaLimpezaEstado" ^
REM     /tr "C:\Users\jonat\Desktop\Carmen\Otimiza-FarmaVet\projeto-otimiza-main\projeto-otimiza-main\0-Central-SNC\scripts\agendar_limpeza_estado.bat" ^
REM     /sc monthly /d 1 /st 03:00
REM ─────────────────────────────────────────────────────────────────────────
cd /d "%~dp0\..\.."
echo [INICIO] agendar_limpeza_estado.bat %DATE% %TIME%
call npm run limpar-estado
echo [OK] agendar_limpeza_estado.bat %DATE% %TIME%
