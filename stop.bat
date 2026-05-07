@echo off
setlocal
:: IntelliSight One-Click Stop (CMD/Windows)
echo ------------------------------------------------
echo IntelliSight - Stopping Project...
echo ------------------------------------------------

echo Finding and terminating Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /F /T /PID %%a >nul 2>&1
    echo Terminated Backend PID %%a
)

echo Finding and terminating Frontend (Expo/Node)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do (
    taskkill /F /T /PID %%a >nul 2>&1
    echo Terminated Frontend PID %%a
)

echo ------------------------------------------------
echo SUCCESS! All project processes stopped.
echo ------------------------------------------------
pause
