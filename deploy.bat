@echo off
REM HashCrack One-Click Deployment Script for Windows
REM This script helps users deploy HashCrack to production quickly

echo 🚀 HashCrack Deployment Assistant
echo =================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

echo This script will help you deploy HashCrack to production.
echo.

REM Get user's GitHub username
set /p GITHUB_USERNAME=Enter your GitHub username: 
if "%GITHUB_USERNAME%"=="" (
    echo ❌ GitHub username is required
    pause
    exit /b 1
)

REM Get Render app name (optional)
set /p RENDER_APP=Enter your Render app name (or press Enter to use 'hashcrack-%GITHUB_USERNAME%'): 
if "%RENDER_APP%"=="" (
    set RENDER_APP=hashcrack-%GITHUB_USERNAME%
)

echo.
echo 📋 Deployment Plan:
echo   GitHub Repository: https://github.com/%GITHUB_USERNAME%/HashCrack
echo   Frontend URL: https://%GITHUB_USERNAME%.github.io/HashCrack/
echo   Backend URL: https://%RENDER_APP%.render.com
echo.

set /p CONFIRM=Continue with deployment? (y/N): 
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo 🔧 Configuring frontend...

REM Update config.js with the correct Render URL
set CONFIG_FILE=frontend\config.js
if exist "%CONFIG_FILE%" (
    powershell -Command "(Get-Content '%CONFIG_FILE%') -replace 'YOUR_RENDER_URL_HERE', 'https://%RENDER_APP%.render.com' | Set-Content '%CONFIG_FILE%'"
    echo ✅ Updated frontend configuration
) else (
    echo ❌ Config file not found: %CONFIG_FILE%
    pause
    exit /b 1
)

REM Update README with personalized URLs
set README_FILE=README.md
if exist "%README_FILE%" (
    powershell -Command "(Get-Content '%README_FILE%') -replace 'yourusername', '%GITHUB_USERNAME%' | Set-Content '%README_FILE%'"
    echo ✅ Updated README with your URLs
)

REM Commit changes
echo.
echo 📦 Committing configuration changes...
git add .
git commit -m "Configure HashCrack for deployment - Updated frontend API URL to: https://%RENDER_APP%.render.com - Configured for GitHub username: %GITHUB_USERNAME% - Ready for production deployment"

echo ✅ Changes committed

echo.
echo 🎯 Next Steps:
echo.
echo 1. Push to GitHub:
echo    git push origin main
echo.
echo 2. Deploy Backend to Render:
echo    - Go to https://render.com
echo    - Create new Web Service
echo    - Connect this repository
echo    - Use app name: %RENDER_APP%
echo    - Build command: pip install -r requirements.txt
echo    - Start command: python enhanced_web_interface.py
echo.
echo 3. Enable GitHub Pages:
echo    - Go to https://github.com/%GITHUB_USERNAME%/HashCrack/settings/pages
echo    - Source: Deploy from branch
echo    - Branch: main
echo    - Folder: /frontend
echo.
echo 4. Access your HashCrack instance:
echo    - Frontend: https://%GITHUB_USERNAME%.github.io/HashCrack/
echo    - Backend: https://%RENDER_APP%.render.com
echo.
echo 🎉 Deployment configuration complete!
echo    Follow the steps above to go live in under 10 minutes!
echo.
pause
