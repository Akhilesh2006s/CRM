@echo off
echo Starting AI Service...
echo Make sure you have installed dependencies: pip install -r requirements.txt
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if dependencies are installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Warning: Flask not found. Installing dependencies...
    pip install -r requirements.txt
)

REM Start the service
python app.py
pause
