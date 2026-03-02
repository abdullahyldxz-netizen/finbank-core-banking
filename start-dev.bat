@echo off
chcp 65001 >nul
title FinBank - Gelistirme Ortami
color 0A

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║        🏦 FinBank - Development Launcher        ║
echo ║        Mini Core Banking System                 ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ── Docker Kontrol ──
echo [1/4] Docker kontrol ediliyor...
docker info >nul 2>&1
if %errorlevel% equ 0 goto DOCKER_READY

echo [!] Docker calismıyor! Baslatiliyor...
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
) else (
    echo Docker Desktop bulunamadi. Lutfen manuel olarak baslatin.
    pause
    exit /b 1
)

echo Docker Engine bekleniyor...
:WAIT_DOCKER
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo     Hala bekleniyor...
    goto WAIT_DOCKER
)

:DOCKER_READY
echo     ✅ Docker calisiyor!

:: ── Eski Container Temizligi ──
echo.
echo [2/4] Eski container'lar temizleniyor...
docker compose down --remove-orphans >nul 2>&1
docker stop finbank-backend finbank-frontend finbank-mongo >nul 2>&1
docker rm finbank-backend finbank-frontend finbank-mongo >nul 2>&1
echo     ✅ Temizlik tamamlandi!

:: ── Docker Compose Build & Start ──
echo.
echo [3/4] Container'lar build ediliyor ve baslatiliyor...
echo     (Bu islem ilk seferinde 2-3 dakika surebilir)
echo.
docker compose up --build -d
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Docker Compose baslatma basarisiz!
    echo Logları kontrol edin: docker compose logs
    pause
    exit /b 1
)

:: ── Container Saglık Kontrolu ──
echo.
echo [4/4] Servisler kontrol ediliyor...
timeout /t 10 /nobreak >nul

:CHECK_HEALTH
docker ps --filter "name=finbank-backend" --filter "health=healthy" --format "{{.Names}}" | findstr "finbank-backend" >nul 2>&1
if %errorlevel% neq 0 (
    echo     Backend henuz hazir degil, bekleniyor...
    timeout /t 5 /nobreak >nul
    goto CHECK_HEALTH
)

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  ✅ Tüm Servisler Calisiyor!                   ║
echo ║                                                 ║
echo ║  🌐 Frontend:  http://localhost:3000            ║
echo ║  🔧 Backend:   http://localhost:8000            ║
echo ║  📚 API Docs:  http://localhost:8000/docs       ║
echo ║  🗄️  MongoDB:   localhost:27017                  ║
echo ║                                                 ║
echo ║  Durdurmak icin: docker compose down            ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ── Tarayıcıyı Aç ──
echo Tarayici aciliyor...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo Bu pencereyi kapatabilirsiniz. Container'lar arka planda calismaya devam eder.
echo Tum servisleri durdurmak icin: docker compose down
echo.
pause >nul
