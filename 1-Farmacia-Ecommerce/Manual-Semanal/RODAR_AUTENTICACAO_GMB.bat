@echo off
title Otimiza - Autorizar Google Meu Negócio
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\5-Marketing-Local"
echo ===================================================
echo 🔑 AUTORIZANDO ACESSO AO GOOGLE PERFIL (GMB)
echo ===================================================
python gerador_posts_gmb.py --auth
pause
