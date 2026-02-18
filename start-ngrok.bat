@echo off
echo ========================================
echo   STARTING NGROK
echo ========================================
echo.

REM Check if ngrok exists
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok not found!
    echo.
    echo Please download ngrok from: https://ngrok.com/download
    echo Extract ngrok.exe and add to PATH or run from ngrok folder
    echo.
    pause
    exit /b 1
)

echo Starting ngrok on port 5000...
echo.
echo IMPORTANT: Keep this window open!
echo.
echo After ngrok starts:
echo 1. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
echo 2. Follow instructions in FIX-VERCEL-CONNECTION.md
echo.
echo ========================================
echo.

ngrok http 5000
