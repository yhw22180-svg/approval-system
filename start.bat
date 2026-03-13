@echo off
set ROOT=%~dp0
cd /d "%ROOT%backend"
start "Backend-Server" cmd /k "venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
cd /d "%ROOT%frontend"
start "Frontend-Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:3000
pause