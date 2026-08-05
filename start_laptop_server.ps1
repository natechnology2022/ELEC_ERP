# ElectrospinTEK ERP - Laptop Local Server Launcher (PowerShell)
Write-Host "=========================================================================" -ForegroundColor Yellow
Write-Host "⚡ ELECTROSPINTEK - MACHINE TRACKING ERP & DJANGO BACKEND LAUNCHER" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Yellow
Write-Host ""

$appDir = $PSScriptRoot

Write-Host "📌 [Step 1/3] Checking Python installation..." -ForegroundColor Cyan
try {
    $pyVer = & python --version 2>&1
    Write-Host "✓ Python detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Python not detected in PATH. Please install Python 3.11 from https://www.python.org/downloads/" -ForegroundColor Red
}

Write-Host ""
Write-Host "📌 [Step 2/3] Installing Dependencies & Seeding Database..." -ForegroundColor Cyan
Set-Location -Path "$appDir\backend"
python -m pip install -r requirements.txt
python manage.py makemigrations api
python manage.py migrate
python seed_db.py
Set-Location -Path $appDir

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "🚀 LAUNCHING ELECTROSPINTEK LOCAL LAPTOP SERVER" -ForegroundColor Green
Write-Host "  🐍 Django Backend & Admin Portal : http://localhost:8000/" -ForegroundColor Yellow
Write-Host "  🐍 Django Admin Credentials       : admin / admin123" -ForegroundColor Yellow
Write-Host "  💻 Frontend ERP Application       : http://localhost:8080/" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$appDir\backend'; python manage.py runserver 0.0.0.0:8000`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$appDir'; powershell -ExecutionPolicy Bypass -File server.ps1`""

Write-Host "✨ Both Backend and Frontend servers are running!" -ForegroundColor Green
Write-Host "💡 To connect from another phone or tablet on your Wi-Fi, use your laptop IP!" -ForegroundColor Cyan
