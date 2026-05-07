#!/bin/bash

# IntelliSight One-Click Startup Script
# Designed for Git Bash on Windows

echo "------------------------------------------------"
echo "IntelliSight - Starting Project..."
echo "------------------------------------------------"

# 1. Backend Migration & Startup
echo "Entering Backend Directory..."
cd backend

# Ensure log file exists
touch backend.log
echo "--- Startup at $(date) ---" >> backend.log

echo "Running Database Migrations..."
./venv/Scripts/python db_migrate.py >> backend.log 2>&1

echo "Starting FastAPI Server in background..."
nohup ./venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload >> backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > ../.pids
echo "Backend started in background (Logs: backend/backend.log)"

# 2. Frontend Startup (Foreground for QR Code)
echo "Entering Frontend Directory..."
cd ../frontend

echo "------------------------------------------------"
echo "Starting Expo Dev Server..."
echo "Scan the QR code below with your phone:"
echo "------------------------------------------------"

# Run expo in the foreground so the QR code and interactive keys work perfectly.
npx expo start --clear
