# Quick Start - Testing Checklist

## ⚡ IMMEDIATE NEXT STEPS (Do This First!)

### 1. Get Gemini API Key (5 minutes)
```
🌐 Go to: https://aistudio.google.com/app/apikey
👤 Sign in with Google
🔑 Click "Create API Key"
📋 Copy the key (starts with AIzaSy...)
```

### 2. Add Key to .env File
```powershell
# Navigate to backend
cd D:\Ravindu\Rebuild\rebuild_man\backend

# Open .env file and add:
GEMINI_API_KEY=AIzaSy_your_actual_key_here

# Save the file
```

### 3. Restart Django Server
```powershell
# If server is running, press Ctrl+C to stop
# Then restart:
python manage.py runserver
```

---

## 🚀 TESTING ORDER (Follow This Sequence)

### Phase 1: Basic Setup (10 minutes)
```
✅ 1.1 - Start database (docker-compose up -d)
✅ 1.2 - Activate venv (.\venv\Scripts\Activate)
✅ 1.3 - Run migrations (python manage.py migrate)
✅ 1.4 - Create superuser (python manage.py createsuperuser)
✅ 1.5 - Start server (python manage.py runserver)
```

### Phase 2: Admin Panel (5 minutes)
```
✅ 2.1 - Login to admin (http://localhost:8000/admin/)
✅ 2.2 - Set role to ADMIN
✅ 2.3 - Create organization
✅ 2.4 - Create section
✅ 2.5 - Create manual need item
```

### Phase 3: API Testing (5 minutes)
```
✅ 3.1 - Test: GET /api/organizations/
✅ 3.2 - Test: GET /api/organizations/1/hierarchy/
✅ 3.3 - Test: GET /api/needs/?priority=CRITICAL
```

### Phase 4: Document Upload (10 minutes)
```
✅ 4.1 - Upload PDF via admin panel
✅ 4.2 - Upload PDF via Postman/API
```

### Phase 5: AI Processing (15 minutes) ⭐ MAIN FEATURE
```
✅ 5.1 - Verify Gemini API key is set
✅ 5.2 - POST /api/documents/1/process_with_ai/
✅ 5.3 - Verify status changed to PROCESSED
✅ 5.4 - Check ai_extracted_json field
✅ 5.5 - POST /api/documents/1/approve_and_create_needs/
✅ 5.6 - Verify new needs created
```

---

## 📝 QUICK COMMANDS REFERENCE

### Start Everything
```powershell
# Terminal 1 - Database
cd D:\Ravindu\Rebuild\rebuild_man\backend
docker-compose up -d

# Terminal 2 - Django Server
cd D:\Ravindu\Rebuild\rebuild_man\backend
.\venv\Scripts\Activate
python manage.py runserver
```

### Stop Everything
```powershell
# Stop Django: Ctrl+C in terminal
# Stop Database:
docker-compose down
```

### Check Status
```powershell
# Check database
docker ps

# Check if port 8000 is free
netstat -ano | findstr :8000
```

---

## 🔗 IMPORTANT URLS

```
Admin Panel:      http://localhost:8000/admin/
API Root:         http://localhost:8000/api/
Organizations:    http://localhost:8000/api/organizations/
Needs:           http://localhost:8000/api/needs/
Documents:       http://localhost:8000/api/documents/

Gemini API Key:  https://aistudio.google.com/app/apikey
```

---

## 🧪 POSTMAN QUICK SETUP

### Collection: Rebuild API

#### 1. Upload Document
```
POST http://localhost:8000/api/documents/
Auth: Basic Auth (admin / your-password)
Body: form-data
  - organization: 1
  - file: [Select PDF file]
```

#### 2. Process with AI
```
POST http://localhost:8000/api/documents/{id}/process_with_ai/
Auth: Basic Auth (admin / your-password)
Body: None
```

#### 3. Approve & Create Needs
```
POST http://localhost:8000/api/documents/{id}/approve_and_create_needs/
Auth: Basic Auth (admin / your-password)
Body: None
```

---

## ❌ COMMON ISSUES & QUICK FIXES

### "Gemini API key not configured"
```powershell
# Check if key is in .env
cat .env | Select-String GEMINI

# If empty, add it:
# GEMINI_API_KEY=your-key-here

# Restart server
```

### "Port 8000 already in use"
```powershell
# Find process
netstat -ano | findstr :8000

# Kill it (replace PID with actual number)
taskkill /PID <number> /F
```

### "Database connection error"
```powershell
# Check if PostgreSQL is running
docker ps

# If not, start it
docker-compose up -d

# If issues persist, restart
docker-compose down
docker-compose up -d
```

### "Module not found"
```powershell
# Make sure venv is activated (should see (venv) in prompt)
.\venv\Scripts\Activate

# Reinstall packages
pip install -r requirements.txt
```

---

## 📊 TESTING PROGRESS TRACKER

Date: ___________

```
SETUP PHASE
[ ] Gemini API key obtained
[ ] API key added to .env
[ ] Database started
[ ] Virtual environment activated
[ ] Server running successfully

ADMIN PANEL
[ ] Can login
[ ] Organization created (ID: ___)
[ ] Section created (ID: ___)
[ ] Need item created (ID: ___)

API ENDPOINTS
[ ] Can list organizations
[ ] Can get hierarchy
[ ] Can filter needs

DOCUMENT UPLOAD
[ ] Upload via admin works
[ ] Upload via API works

AI PROCESSING ⭐
[ ] Process with AI successful
[ ] Status changed to PROCESSED
[ ] JSON extracted correctly
[ ] Approve & create needs works
[ ] New items in database

FULL WORKFLOW
[ ] End-to-end test passed
```

---

## 🎯 SUCCESS CRITERIA

Your system is working if you can:

1. ✅ Upload a PDF document
2. ✅ AI extracts items automatically
3. ✅ Items are categorized by priority
4. ✅ Can approve and create needs in database
5. ✅ Can view needs via API

---

## 📞 WHERE TO GET HELP

- Full Testing Guide: `COMPLETE_TESTING_GUIDE.md`
- Gemini Setup: `backend/GEMINI_MIGRATION_GUIDE.md`
- API Docs: `backend/API_DOCUMENTATION.md`
- Postman Guide: `backend/POSTMAN_OCR_TESTING_GUIDE.md`

---

**Ready to Start?**

1. Get your Gemini API key NOW: https://aistudio.google.com/app/apikey
2. Follow Phase 1 setup steps above
3. Test each feature one by one
4. Check off items as you complete them

Good luck! 🚀
