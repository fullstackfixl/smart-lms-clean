# PowerShell Script to Setup and Deploy
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERCEL DEPLOYMENT SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is running
Write-Host "Checking for ngrok..." -ForegroundColor Yellow
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue

if (-not $ngrokProcess) {
    Write-Host "ERROR: ngrok is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start ngrok in another terminal:" -ForegroundColor Yellow
    Write-Host "  ngrok http 5000" -ForegroundColor White
    Write-Host ""
    Write-Host "If you don't have ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "  2. Extract ngrok.exe" -ForegroundColor White
    Write-Host "  3. Run: ngrok http 5000" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ ngrok is running" -ForegroundColor Green
Write-Host ""

# Get ngrok URL
Write-Host "Fetching ngrok URL..." -ForegroundColor Yellow
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $ngrokUrl = $ngrokApi.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1 -ExpandProperty public_url
    
    if ($ngrokUrl) {
        Write-Host "✓ Found ngrok URL: $ngrokUrl" -ForegroundColor Green
    } else {
        throw "No HTTPS tunnel found"
    }
} catch {
    Write-Host "✗ Could not auto-detect ngrok URL" -ForegroundColor Red
    Write-Host ""
    $ngrokUrl = Read-Host "Please enter your ngrok HTTPS URL (e.g., https://abc123.ngrok-free.app)"
}

Write-Host ""

# Update .env.production
Write-Host "Updating .env.production..." -ForegroundColor Yellow
$envContent = @"
NEXT_PUBLIC_API_URL=$ngrokUrl
NEXT_PUBLIC_APP_URL=https://smart-lms-clean.vercel.app
NODE_ENV=production
"@

Set-Content -Path "client\.env.production" -Value $envContent
Write-Host "✓ Updated .env.production" -ForegroundColor Green
Write-Host ""

# Update backend CORS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: UPDATE BACKEND CORS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add this URL to server/src/app.js (line 85):" -ForegroundColor Yellow
Write-Host "  '$ngrokUrl'," -ForegroundColor White
Write-Host ""
Write-Host "Then restart your backend server!" -ForegroundColor Yellow
Write-Host ""
$continue = Read-Host "Have you updated CORS and restarted backend? (y/n)"

if ($continue -ne "y") {
    Write-Host ""
    Write-Host "Please update CORS first, then run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location client
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host $buildResult
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

# Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""
$deployResult = vercel --prod 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host $deployResult
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Cyan
Write-Host "  https://smart-lms-clean.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "Backend proxied through:" -ForegroundColor Cyan
Write-Host "  $ngrokUrl" -ForegroundColor White
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor Cyan
Write-Host "  Instructor: instructor@test.com / password123" -ForegroundColor White
Write-Host "  Student: student1@test.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Keep ngrok running!" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
