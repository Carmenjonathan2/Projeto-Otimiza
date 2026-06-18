@echo off
title GIO CENTRAL - Otimiza FarmaVet
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza\GIO-CENTRAL\dashboard"
echo ===================================================
echo 🚀 INICIANDO GIO CENTRAL (DASHBOARD)
echo ===================================================
start http://localhost:3333
node server.js
pause
