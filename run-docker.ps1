#!/usr/bin/env pwsh

# ==========================================
# Docker Startup Script for Rebuild System
# =========================================

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 REBUILD SYSTEM - DOCKER STARTUP  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker detected: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps > $null 2>&1
} catch {
    Write-Host "❌ Error: Docker daemon is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📦 Building and starting all services..." -ForegroundColor Yellow
Write-Host "   This may take 2-3 minutes on first run" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   Admin:    http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Login: admin / Admin@1234" -ForegroundColor Magenta
Write-Host ""

# Build and run
& docker-compose up --build

# Check exit code
if ($LASTEXITCODE -eq 130) {
    Write-Host ""
    Write-Host "⏸ Stopping services..." -ForegroundColor Yellow
    & docker-compose stop
    Write-Host "✅ Services stopped" -ForegroundColor Green
    exit 0
}

Write-Host ""
Read-Host "Press Enter to exit"
