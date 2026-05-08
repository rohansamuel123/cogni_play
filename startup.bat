@echo off
setlocal
:: IntelliSight One-Click Startup (CMD/Windows)
echo ------------------------------------------------
echo IntelliSight - Starting Project (Windows)
echo ------------------------------------------------

:: 1. Backend Migration & Startup
echo Entering Backend...
cd backend || (
    echo ERROR: Could not enter backend directory.
    exit /b 1
)

echo Stopping any existing Backend on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /T /PID %%a >nul 2>&1
    echo Terminated existing Backend PID %%a
)
timeout /t 2 /nobreak >nul

echo Running Database Migrations...
call venv\Scripts\python db_migrate.py
if errorlevel 1 (
    echo ERROR: Database migrations failed.
    exit /b 1
)

echo Starting FastAPI Server in background...
:: Run backend in background and redirect logs
echo --- Startup at %DATE% %TIME% --- >> backend.log
start /B "" venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >> backend.log 2>&1
echo Backend started in background (Logs: backend\backend.log)

:: 2. Frontend Startup (Foreground for QR Code)
echo Entering Frontend...
cd ../frontend || (
    echo ERROR: Could not enter frontend directory.
    exit /b 1
)

echo ------------------------------------------------
echo Starting Expo Dev Server...
echo Scan the QR code below with your phone:
echo ------------------------------------------------

:: Run expo in the foreground so the QR code is visible in CMD.
call npx expo start --clear

cd ..
