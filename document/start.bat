@echo off
echo 🌱 Starting Carbon Verification System...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Copy frontend files to frontend directory
echo 📋 Preparing frontend...
if not exist "frontend" mkdir "frontend"
if exist index.html copy index.html frontend\ >nul
if exist styles.css copy styles.css frontend\ >nul
if exist script.js copy script.js frontend\ >nul

REM Build and start all services
echo 🚀 Starting services...
docker-compose up -d --build

echo.
echo ✅ System started successfully!
echo 🌐 Frontend: http://localhost:8080
echo 📝 Stop: docker-compose down
echo.
pause