@echo off
setlocal
:: IntelliSight One-Click Startup (CMD/Windows)
echo ------------------------------------------------
echo IntelliSight - Starting Project (Windows)
echo ------------------------------------------------

:: 1. Backend Migration & Startup
echo Entering Backend...
cd backend

echo Running Database Migrations...
call venv\Scripts\python db_migrate.py

echo Starting FastAPI Server in background...
:: Run backend in background and redirect logs
start /B "" venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1
echo Backend started in background (Logs: backend\backend.log)

:: 2. Frontend Startup (Foreground for QR Code)
echo Entering Frontend...
cd ../frontend

echo ------------------------------------------------
echo Starting Expo Dev Server...
echo Scan the QR code below with your phone:
echo ------------------------------------------------

:: Run expo in the foreground so the QR code is visible in CMD.
call npx expo start --clear

cd ..
