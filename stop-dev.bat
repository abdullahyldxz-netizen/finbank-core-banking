@echo off
chcp 65001 >nul
title FinBank - Durdur
color 0C

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  🛑 FinBank - Tum Servisleri Durdur             ║
echo ╚══════════════════════════════════════════════════╝
echo.

echo Container'lar durduruluyor...
docker compose down --remove-orphans
echo.
echo ✅ Tum servisler durduruldu!
echo.
pause >nul
