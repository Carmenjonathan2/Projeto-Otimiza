# Script para agendar a postagem automatica do LinkedIn
# Dias: Terca, Quarta e Quinta
# Horario: 12:00 (Meio-dia)

$nodePath = "C:\Program Files\nodejs\node.exe"
$scriptPath = "c:\Users\jonat\OneDrive\Desktop\Projeto Otimiza\otimiza-content-generator"
$taskName = "Otimiza_LinkedIn_Bot"

Write-Host "📅 Configurando agendamento para: Ter, Qua, Qui as 12:00..."

# Define a acao: rodar o node no diretorio correto
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "gerador-linkedin.js MIX" -WorkingDirectory $scriptPath

# Define o gatilho: Semanalmente, dias especificos, meio-dia
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Tuesday,Wednesday,Thursday -At 12:00PM

# Registra a tarefa no Windows
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName $taskName -Description "Bot Ghostwriter da Otimiza FarmaVet para LinkedIn B2B" -Force

Write-Host "✅ SUCESSO! A tarefa '$taskName' foi criada no seu Windows."
Write-Host "O robo agora trabalhara sozinho nos horarios combinados."
