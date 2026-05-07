#!/bin/bash

# IntelliSight One-Click Stop Script
# Designed for Git Bash on Windows

echo "------------------------------------------------"
echo "IntelliSight - Stopping Project..."
echo "------------------------------------------------"

# 1. Kill via saved PIDs (if exists)
if [ -f .pids ]; then
    while IFS= read -r pid
    do
        echo "Terminating process from .pids: $pid"
        taskkill //F //T //PID $pid > /dev/null 2>&1 || kill -9 $pid > /dev/null 2>&1
    done < .pids
    rm .pids
fi

# 2. Safety Check: Kill anything still on port 8000 (Backend)
echo "Cleaning up any remaining processes on port 8000..."
taskkill //F //IM python.exe //T > /dev/null 2>&1 || pkill -f uvicorn > /dev/null 2>&1

echo "------------------------------------------------"
echo "SUCCESS! Project processes stopped."
echo "------------------------------------------------"
