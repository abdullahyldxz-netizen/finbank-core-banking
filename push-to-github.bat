@echo off
chcp 65001 >nul
title FinBank - GitHub Push
color 0B

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  📦 FinBank - GitHub'a Gönder                   ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ── Git Kontrol ──
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Git yuklu degil! Lutfen git'i yukleyin:
    echo https://git-scm.com/downloads
    pause
    exit /b 1
)

:: ── Git Repo Kontrol ──
if not exist ".git" (
    echo [!] Git repo bulunamadi. Yeni repo olusturuluyor...
    git init
    git branch -M main
    echo.
    echo Simdi GitHub'da yeni bir repo olusturun:
    echo   1. https://github.com/new adresine gidin
    echo   2. Repo adini girin (ornegin: finbank-core-banking)
    echo   3. Public veya Private secin
    echo   4. "Create repository" tiklayin
    echo.
    set /p REPO_URL="GitHub repo URL'sini yapistin (https://github.com/kullanici/repo.git): "
    git remote add origin %REPO_URL%
)

:: ── Commit ve Push ──
echo.
set /p COMMIT_MSG="Commit mesaji girin: "
echo.

echo Dosyalar ekleniyor...
git add -A

echo Commit olusturuluyor...
git commit -m "%COMMIT_MSG%"

echo GitHub'a gonderiliyor...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════╗
    echo ║  ✅ Basariyla GitHub'a gonderildi!              ║
    echo ║                                                 ║
    echo ║  GitHub Pages icin:                             ║
    echo ║  1. Repo Settings → Pages → Source              ║
    echo ║  2. "GitHub Actions" secin                      ║
    echo ║  3. Save'e tiklayin                             ║
    echo ║  4. Site otomatik yayinlanacak!                 ║
    echo ╚══════════════════════════════════════════════════╝
) else (
    echo.
    echo [HATA] Push basarisiz! Hata mesajını kontrol edin.
)

echo.
pause >nul
