@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM Agendamento local do backup diário do estado (fallback Windows).
REM
REM Configurar tarefa agendada (rodar 1x como admin):
REM   schtasks /create /tn "OtimizaBackupEstado" ^
REM     /tr "C:\Users\jonat\Desktop\Carmen\Otimiza-FarmaVet\projeto-otimiza-main\projeto-otimiza-main\0-Central-SNC\scripts\agendar_backup_estado.bat" ^
REM     /sc daily /st 02:00
REM ─────────────────────────────────────────────────────────────────────────
cd /d "%~dp0\..\.."
echo [INICIO] agendar_backup_estado.bat %DATE% %TIME%
call npm run backup-estado
echo [OK] agendar_backup_estado.bat %DATE% %TIME%
