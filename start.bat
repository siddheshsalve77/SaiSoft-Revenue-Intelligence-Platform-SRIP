@echo off
echo ================================================
echo   SRIP — SaiSoft Revenue Intelligence Platform
echo ================================================
echo.

echo [1/3] Starting FastAPI backend on port 8000...
cd /d "%~dp0backend"
start "SRIP Backend" cmd /k "pip install -r requirements.txt --quiet && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo [2/3] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install --silent

echo [3/3] Starting Vite frontend on port 3000...
start "SRIP Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API docs: http://localhost:8000/docs
echo ================================================
echo.
pause
