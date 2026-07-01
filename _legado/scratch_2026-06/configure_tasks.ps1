$action1 = New-ScheduledTaskAction -Execute 'cmd' -Argument '/c "c:\Users\jonat\OneDrive\Desktop\Otimiza\RODAR_STATUS_10H.bat"' -WorkingDirectory 'c:\Users\jonat\OneDrive\Desktop\Otimiza'
Set-ScheduledTask -TaskName "Otimiza - Vitrine Instagram 10h" -Action $action1

$action2 = New-ScheduledTaskAction -Execute 'cmd' -Argument '/c "c:\Users\jonat\OneDrive\Desktop\Otimiza\RODAR_STATUS_WHATSAPP_10H.bat"' -WorkingDirectory 'c:\Users\jonat\OneDrive\Desktop\Otimiza'
Set-ScheduledTask -TaskName "Otimiza_Status_10H" -Action $action2

$action3 = New-ScheduledTaskAction -Execute 'cmd' -Argument '/c "c:\Users\jonat\OneDrive\Desktop\Otimiza\rodar_central_otimiza.bat"' -WorkingDirectory 'c:\Users\jonat\OneDrive\Desktop\Otimiza'
Set-ScheduledTask -TaskName "Otimiza_Comando_Central" -Action $action3

Write-Host "Scheduled tasks updated successfully to Otimiza path and correct arguments!"
