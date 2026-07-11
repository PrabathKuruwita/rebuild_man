@echo off
REM NeedTracker Development Server Setup - Batch Version
REM This script starts only the database in Docker and runs frontend & backend locally

setlocal enabledelayedexpansion

color 0A
cls
echo.
echo ========================================
echo   NeedTracker Development Environment
echo ========================================
echo.

REM Step 1: Start Database in Docker
echo [1/3] Starting PostgreSQL database in Docker...
docker-compose -f docker-compose.dev.yml up -d db

REM Wait for database to be ready
echo [*] Waiting for database to be ready...
timeout /t 5 /nobreak

REM Step 2: Start Backend
echo.
echo [2/3] Starting Django Backend...
start cmd /k "cd backend && .venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

REM Step 3: Start Frontend
echo.
echo [3/3] Starting Next.js Frontend...
timeout /t 2 /nobreak
start cmd /k "cd frontend && npm run dev"

cls
echo.
echo ========================================
echo   Development Environment Started!
echo ========================================
echo.
echo Services running:
echo   - Database:  PostgreSQL (Docker) on localhost:5433
echo   - Backend:   Django on http://localhost:8000
echo   - Frontend:  Next.js on http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser!
echo.
echo To stop: docker-compose -f docker-compose.dev.yml down
echo.
pause
