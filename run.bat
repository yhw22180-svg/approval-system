@echo off
set ROOT=%~dp0

echo Starting Backend...
cd /d "%ROOT%backend"
start "Backend-Server" cmd /k "venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting ngrok on port 8000...
start "ngrok" cmd /k "C:\Users\user\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe http 8000"

timeout /t 2 /nobreak >nul

start http://localhost:8000

pause