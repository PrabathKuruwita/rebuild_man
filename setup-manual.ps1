#!/usr/bin/env pwsh

# ======================================================
# Manual Startup Script for Rebuild System (No Docker)
# ======================================================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 REBUILD SYSTEM - MANUAL STARTUP (LOCAL)     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.12+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 22+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check PostgreSQL
try {
    $psqlVersion = psql --version 2>&1
    Write-Host "✅ PostgreSQL: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL not detected. You can run it via Docker:" -ForegroundColor Yellow
    Write-Host "     docker run -d --name rebuild_db_only -e POSTGRES_DB=rebuild_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin1234 -p 5433:5432 postgres:15" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📝 Setup Instructions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor White
Write-Host "  1. Setup backend (Python virtual environment, dependencies)" -ForegroundColor Gray
Write-Host "  2. Setup frontend (Node.js dependencies)" -ForegroundColor Gray
Write-Host "  3. Open instructions for running each part" -ForegroundColor Gray
Write-Host ""

$setupChoice = Read-Host "Continue with setup? (y/n)"
if ($setupChoice -ne "y" -and $setupChoice -ne "Y") {
    exit 0
}

# Navigate to project root
$projectRoot = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location $projectRoot

Write-Host ""
Write-Host "═════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 1: Backend Setup" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $projectRoot "backend"
Set-Location $backendDir

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "📥 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
pip install psycopg2-binary==2.9.10 --quiet
Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
python manage.py migrate --noinput
Write-Host "✅ Migrations complete" -ForegroundColor Green

Write-Host "👨‍💼 Creating default admin user..." -ForegroundColor Yellow
python manage.py create_default_admin > $null 2>&1
Write-Host "✅ Admin user ready (admin/Admin@1234)" -ForegroundColor Green

Write-Host ""
Write-Host "═════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Step 2: Frontend Setup" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$frontendDir = Join-Path $projectRoot "frontend"
Set-Location $frontendDir

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Node.js dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "═════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Open 3 separate PowerShell terminals and run:" -ForegroundColor White
Write-Host ""
Write-Host "📌 Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "   cd rebuild_man\backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "📌 Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "   cd rebuild_man\frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📌 Terminal 3 (Open in Browser):" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Gray
Write-Host "   Admin:    http://localhost:8000/admin" -ForegroundColor Gray
Write-Host ""
Write-Host "🔑 Login Credentials:" -ForegroundColor Magenta
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: Admin@1234" -ForegroundColor Gray
Write-Host ""

Write-Host "Press Enter to close this window"
Read-Host
