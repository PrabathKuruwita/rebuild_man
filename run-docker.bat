@echo off
REM ==========================================
REM Docker Startup Script for Rebuild System
REM ==========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║   🚀 REBUILD SYSTEM - DOCKER STARTUP  ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker daemon is not running
    echo Please start Docker Desktop
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Navigate to rebuild_man directory
cd /d %~dp0

echo 📦 Building and starting all services...
echo This may take 2-3 minutes on first run
echo.

REM Build and run
docker-compose up --build

REM If user exits with Ctrl+C
if %errorlevel% equ 130 (
    echo.
    echo ⏸ Stopping services...
    docker-compose stop
    echo ✅ Services stopped
    exit /b 0
)

pause
