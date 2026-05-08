#!/bin/bash

# IntelliSight One-Click Startup Script
# Designed for Git Bash on Windows

echo "------------------------------------------------"
echo "IntelliSight - Starting Project..."
echo "------------------------------------------------"

# 1. Backend Migration & Startup
echo "Entering Backend Directory..."
cd backend || {
  echo "ERROR: Could not enter backend directory."
  exit 1
}

# Ensure log file exists
touch backend.log
echo "--- Startup at $(date) ---" >> backend.log

PYTHON="./venv/Scripts/python.exe"
if [ ! -x "$PYTHON" ]; then
  echo "ERROR: Backend Python not found at $PYTHON" | tee -a backend.log
  echo "Create it with: cd backend && python -m venv venv && ./venv/Scripts/python.exe -m pip install -r requirements.txt" | tee -a backend.log
  exit 1
fi

echo "Running Database Migrations..."
"$PYTHON" db_migrate.py >> backend.log 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Database migrations failed. See backend/backend.log" | tee -a backend.log
  exit 1
fi

echo "Starting FastAPI Server in background..."
nohup "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >> backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > ../.pids
echo "Backend started in background (Logs: backend/backend.log)"

# 2. Frontend Startup (Foreground for QR Code)
echo "Entering Frontend Directory..."
cd ../frontend || {
  echo "ERROR: Could not enter frontend directory."
  exit 1
}

echo "------------------------------------------------"
echo "Starting Expo Dev Server..."
echo "Scan the QR code below with your phone:"
echo "------------------------------------------------"

# Run expo in the foreground so the QR code and interactive keys work perfectly.
npx expo start --clear
