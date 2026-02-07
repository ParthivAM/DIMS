@echo off
echo ============================================================
echo  Starting Digital Identity Management System
echo ============================================================
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd src\backend && node server.js"

echo [1/2] Backend starting on http://localhost:5000
echo.
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend...
start "Frontend React App" cmd /k "npm start"

echo [2/2] Frontend starting on http://localhost:3000
echo.
echo ============================================================
echo  Both servers are starting!
echo ============================================================
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo.
echo  Press any key to close this window...
pause >nul
