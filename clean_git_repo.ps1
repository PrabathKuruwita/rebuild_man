# Script to remove tracked files that should be in .gitignore
# Run this from the rebuild_man directory

Write-Host "Starting Git repository cleanup..." -ForegroundColor Yellow
Write-Host "This will remove tracked files that should be ignored." -ForegroundColor Yellow
Write-Host ""

# Confirm with user
$response = Read-Host "This will modify your git repository. Continue? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Step 1: Removing __pycache__ directories..." -ForegroundColor Cyan
git rm -r --cached backend/**/__pycache__/ 2>$null
git rm -r --cached backend/config/__pycache__/ 2>$null
git rm -r --cached backend/core/__pycache__/ 2>$null
git rm -r --cached backend/core/migrations/__pycache__/ 2>$null

Write-Host "Step 2: Removing venv directory (this may take a while)..." -ForegroundColor Cyan
git rm -r --cached backend/venv/ 2>$null

Write-Host "Step 3: Removing .pyc files..." -ForegroundColor Cyan
git rm --cached backend/**/*.pyc 2>$null

Write-Host "Step 4: Removing node_modules if tracked..." -ForegroundColor Cyan
git rm -r --cached frontend/node_modules/ 2>$null

Write-Host "Step 5: Removing .next directory if tracked..." -ForegroundColor Cyan
git rm -r --cached frontend/.next/ 2>$null

Write-Host "Step 6: Removing environment files if tracked..." -ForegroundColor Cyan
git rm --cached backend/.env 2>$null
git rm --cached frontend/.env 2>$null
git rm --cached .env 2>$null

Write-Host "Step 7: Removing database files if tracked..." -ForegroundColor Cyan
git rm --cached backend/db.sqlite3 2>$null

Write-Host "Step 8: Removing media files if tracked..." -ForegroundColor Cyan
git rm -r --cached backend/media/ 2>$null

Write-Host ""
Write-Host "✓ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes: git status"
Write-Host "2. Commit the changes: git commit -m 'Clean up: Remove ignored files from Git tracking'"
Write-Host "3. Push to remote: git push"
Write-Host ""
Write-Host "Note: Your local files are NOT deleted, only removed from Git tracking." -ForegroundColor Cyan
