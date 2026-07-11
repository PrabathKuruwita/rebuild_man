# NeedTracker Development Server Setup
# This script starts only the database in Docker and runs frontend & backend locally

Write-Host "🚀 Starting NeedTracker Development Environment" -ForegroundColor Green
Write-Host ""

# Step 1: Start Database in Docker
Write-Host "📦 Starting PostgreSQL database in Docker..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up -d db

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 2: Navigate to backend and start it
Write-Host ""
Write-Host "🔧 Starting Django Backend on http://localhost:8000" -ForegroundColor Cyan
Write-Host "   (Running in separate terminal...)" -ForegroundColor Gray
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd backend; .venv\Scripts\python.exe manage.py runserver`""

# Step 3: Navigate to frontend and start it
Write-Host ""
Write-Host "⚛️  Starting Next.js Frontend on http://localhost:3000" -ForegroundColor Cyan
Write-Host "   (Running in separate terminal...)" -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd frontend; npm run dev`""

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Services running:" -ForegroundColor Green
Write-Host "  • Database:  PostgreSQL (Docker) on localhost:5433" -ForegroundColor White
Write-Host "  • Backend:   Django on http://localhost:8000" -ForegroundColor White
Write-Host "  • Frontend:  Next.js on http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Green
Write-Host "  • Changes to code are reflected instantly" -ForegroundColor White
Write-Host "  • Database persists in Docker" -ForegroundColor White
Write-Host "  • Stop with: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host ""
