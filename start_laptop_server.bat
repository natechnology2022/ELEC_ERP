@echo off
title ElectrospinTEK ERP - Laptop Local Server Launcher
color 0E

echo =========================================================================
echo ⚡ ELECTROSPINTEK - MACHINE TRACKING ERP & DJANGO BACKEND LAUNCHER
echo =========================================================================
echo.

echo 📌 [Step 1/3] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Python was not detected in PATH.
    echo Please install Python 3.11 from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b
)

echo ✓ Python detected!
echo.

echo 📌 [Step 2/3] Installing Backend Dependencies & Migrating Database...
cd backend
python -m pip install -r requirements.txt
python manage.py makemigrations api
python manage.py migrate
python seed_db.py
cd ..

echo.
echo =========================================================================
echo 🚀 LAUNCHING ELECTROSPINTEK LOCAL LAPTOP SERVER
echo =========================================================================
echo  🐍 Django Backend & Admin Portal : http://localhost:8000/
echo  🐍 Django Admin Credentials       : admin / admin123
echo  💻 Frontend ERP Application       : http://localhost:8080/
echo =========================================================================
echo.

start "ElectrospinTEK Django Backend (:8000)" cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"
start "ElectrospinTEK Frontend ERP (:8080)" cmd /k "powershell -ExecutionPolicy Bypass -File server.ps1"

echo.
echo ✨ Both Backend and Frontend servers are running!
echo 💡 To connect from another phone or tablet on your Wi-Fi, use your laptop IP!
echo.
pause
