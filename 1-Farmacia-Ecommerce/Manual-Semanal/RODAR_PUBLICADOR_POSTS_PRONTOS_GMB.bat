@echo off
title Otimiza - Publicar Posts Prontos GMB via API
cd /d "c:\Users\jonat\OneDrive\Desktop\Otimiza\1-Farmacia-Ecommerce\5-Marketing-Local"
echo ===================================================
echo 🚀 PUBLICANDO POSTS PRONTOS NO GOOGLE MEU NEGÓCIO
echo ===================================================
python gerador_posts_gmb.py --publish-ready
pause
