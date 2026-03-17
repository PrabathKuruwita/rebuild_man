# Quick Start Script for Rebuild Backend
# Run this script to set up the project quickly

Write-Host "🏗️  Rebuild Backend - Quick Start" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created`n" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists`n" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
Write-Host "✅ Virtual environment activated`n" -ForegroundColor Green

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
Write-Host "✅ Dependencies installed`n" -ForegroundColor Green

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY!`n" -ForegroundColor Red
} else {
    Write-Host "✅ .env file already exists`n" -ForegroundColor Green
}

# Start Docker Compose
Write-Host "🐳 Starting PostgreSQL with Docker..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 3
Write-Host "✅ PostgreSQL is running`n" -ForegroundColor Green

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
python manage.py migrate
Write-Host "✅ Migrations completed`n" -ForegroundColor Green

# Create media directory
if (-Not (Test-Path "media")) {
    Write-Host "📁 Creating media directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "media"
    Write-Host "✅ Media directory created`n" -ForegroundColor Green
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env and add your OPENAI_API_KEY" -ForegroundColor White
Write-Host "2. Create a superuser: python manage.py createsuperuser" -ForegroundColor White
Write-Host "3. Start the server: python manage.py runserver" -ForegroundColor White
Write-Host "4. Visit http://localhost:8000/admin/`n" -ForegroundColor White

Write-Host "To start the server now, run:" -ForegroundColor Yellow
Write-Host "python manage.py runserver`n" -ForegroundColor Cyan
