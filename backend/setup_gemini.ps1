# Quick Setup Script - Migrate to Gemini API

Write-Host "🚀 Setting up Gemini API for your Django project..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-Not (Test-Path "manage.py")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    Write-Host "Run: cd backend" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "⚠️  Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Uninstall old OpenAI package
Write-Host ""
Write-Host "🗑️  Removing old OpenAI package..." -ForegroundColor Cyan
pip uninstall openai -y 2>$null

# Install Gemini package
Write-Host ""
Write-Host "📥 Installing Google Gemini AI package..." -ForegroundColor Cyan
pip install google-generativeai==0.8.3

# Install all requirements
Write-Host ""
Write-Host "📥 Installing/updating all dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "1. Get your FREE Gemini API key:" -ForegroundColor White
Write-Host "   👉 https://aistudio.google.com/app/apikey" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Add it to your .env file:" -ForegroundColor White
Write-Host "   GEMINI_API_KEY=your-api-key-here" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test your setup:" -ForegroundColor White
Write-Host "   python manage.py runserver" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📖 For detailed info, read: GEMINI_MIGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
