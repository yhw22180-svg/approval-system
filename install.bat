@echo off
echo.
echo ============================================
echo   Approval System - Auto Install
echo ============================================
echo.

echo [1/4] Checking Python 3.11...
py -3.11 --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3.11 not found!
    echo.
    echo Please download Python 3.11 from this address:
    echo https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe
    echo.
    echo IMPORTANT: Check "Add Python to PATH" during install!
    pause
    exit /b 1
)
py -3.11 --version
echo OK - Python 3.11 found

echo.
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
node --version
echo OK - Node.js found

echo.
echo [3/4] Installing backend packages...
cd backend

if exist "venv" (
    echo Removing old venv...
    rmdir /s /q venv
)

echo Creating virtual environment with Python 3.11...
py -3.11 -m venv venv

call venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Package install failed!
    pause
    exit /b 1
)

if not exist ".env" (
    copy .env.example .env >nul
)
cd ..
echo OK - Backend ready

echo.
echo [4/4] Installing frontend packages...
cd frontend
call npm install
cd ..
echo OK - Frontend ready

echo.
echo ============================================
echo   Install Complete!
echo   Now run start.bat to launch the server.
echo ============================================
echo.
pause
