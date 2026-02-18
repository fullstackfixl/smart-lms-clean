@echo off
echo ========================================
echo   DEPLOY TO VERCEL - SETUP SCRIPT
echo ========================================
echo.

echo Step 1: Check if ngrok is running...
echo.
echo IMPORTANT: You need ngrok running in another terminal!
echo Run: ngrok http 5000
echo.
set /p NGROK_URL="Enter your ngrok HTTPS URL (e.g., https://abc123.ngrok-free.app): "

if "%NGROK_URL%"=="" (
    echo ERROR: No URL provided!
    pause
    exit /b 1
)

echo.
echo Step 2: Updating .env.production with ngrok URL...
cd client
echo NEXT_PUBLIC_API_URL=%NGROK_URL%> .env.production
echo NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app>> .env.production
echo NODE_ENV=production>> .env.production
echo Done!

echo.
echo Step 3: Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying to Vercel...
call vercel --prod
if errorlevel 1 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo IMPORTANT: Add this URL to server/src/app.js CORS:
echo %NGROK_URL%
echo.
echo Then restart your backend server!
echo.
pause
