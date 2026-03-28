# Complete Testing Guide - Rebuild Project
## Step-by-Step Functionality Testing

---

## 🎯 Project Overview

**What This Project Does:**
1. Hospitals/Organizations can upload PDF documents with their supply needs
2. AI (Gemini) extracts items automatically from the PDF
3. Items are categorized by priority (Critical/Essential/Nice)
4. Organized by sections (Emergency Ward, OPD, Kitchen, etc.)
5. Donors can view and fulfill needs

---

## 📋 PRE-REQUISITES CHECKLIST

### ✅ Step 0: Get Your FREE Gemini API Key

**This is REQUIRED for AI document processing!**

1. Go to: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (looks like: `AIzaSyA...`)
5. Open `backend/.env` file
6. Add your key:
   ```env
   GEMINI_API_KEY=AIzaSyA_your_actual_key_here
   ```
6. Save the file

**Free Tier Limits:**
- ✅ 15 requests per minute
- ✅ 1 million tokens per day
- ✅ NO credit card required

---

## 🚀 SETUP & INSTALLATION

### Step 1: Start PostgreSQL Database

```powershell
cd D:\Ravindu\Rebuild\rebuild_man\backend
docker-compose up -d
```

**Verify it's running:**
```powershell
docker ps
```
Should show: `postgres:15` container running on port 5433

---

### Step 2: Activate Virtual Environment

```powershell
cd D:\Ravindu\Rebuild\rebuild_man\backend
.\venv\Scripts\Activate
```

Your prompt should show `(venv)` prefix.

---

### Step 3: Install/Update Dependencies

```powershell
# Install Gemini package (if not done yet)
pip install google-generativeai==0.8.3

# Or install everything
pip install -r requirements.txt
```

---

### Step 4: Run Database Migrations

```powershell
python manage.py migrate
```

**Expected output:** Should see migrations being applied for `core` app.

---

### Step 5: Create Superuser (Admin)

```powershell
python manage.py createsuperuser
```

**Enter:**
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123` (or whatever you prefer)

---

### Step 6: Start Django Server

```powershell
python manage.py runserver
```

**Expected output:**
```
Starting development server at http://127.0.0.1:8000/
```

**Keep this terminal running!**

---

## 🧪 TESTING PHASE 1: Admin Panel & Basic Setup

### Test 1.1: Access Admin Panel

**URL:** http://localhost:8000/admin/

**Steps:**
1. Open browser
2. Go to admin URL
3. Login with superuser credentials (admin/admin123)

**✅ Success:** You see Django administration panel

**❌ Troubleshoot:**
- Server not running? Check terminal
- Wrong credentials? Run `python manage.py createsuperuser` again

---

### Test 1.2: Set Admin Role

**Why:** By default, new users have role='DONOR'. We need ADMIN role.

**Steps:**
1. In admin panel, click **"Users"**
2. Click on your admin user
3. Scroll to **"Role"** dropdown
4. Select **"ADMIN"** (was probably "DONOR")
5. Click **"Save"**

**✅ Success:** Role changed to ADMIN

---

### Test 1.3: Create Test Organization

**Steps:**
1. In admin panel, click **"Organizations"**
2. Click **"Add Organization"** (top right)
3. Fill in:
   - Name: `National Hospital Colombo`
   - Registration number: `NH001`
   - Address: `Regent Street, Colombo 7`
   - District: `Colombo`
   - Admin user: Select your admin user
4. Click **"Save"**

**✅ Success:** Organization created, ID = 1

**Note the Organization ID!** You'll need it for API calls.

---

### Test 1.4: Create Test Section

**Steps:**
1. Click **"Sections"**
2. Click **"Add Section"**
3. Fill in:
   - Organization: `National Hospital Colombo`
   - Name: `Emergency Ward`
   - Head of section: `Dr. Silva` (optional)
4. Click **"Save"**

**✅ Success:** Section created

---

### Test 1.5: Create Manual Need Item

**Steps:**
1. Click **"Need items"**
2. Click **"Add Need item"**
3. Fill in:
   - Section: `Emergency Ward`
   - Name: `Saline Bottles`
   - Priority: `CRITICAL`
   - Quantity required: `500`
   - Unit: `UNIT`
   - Description: `0.9% Sodium Chloride 500ml`
4. Click **"Save"**

**✅ Success:** Need item created

---

## 🧪 TESTING PHASE 2: REST API Endpoints

**Tool Needed:** Postman, curl, or browser

### Test 2.1: List Organizations (Public)

**Method:** GET  
**URL:** http://localhost:8000/api/organizations/

**Using Browser:**
- Just paste URL and hit enter

**Using curl:**
```powershell
curl http://localhost:8000/api/organizations/
```

**✅ Expected Response:**
```json
[
  {
    "id": 1,
    "name": "National Hospital Colombo",
    "registration_number": "NH001",
    "district": "Colombo",
    "sections": []
  }
]
```

---

### Test 2.2: Get Organization Hierarchy

**Method:** GET  
**URL:** http://localhost:8000/api/organizations/1/hierarchy/

**✅ Expected Response:**
```json
{
  "id": 1,
  "name": "National Hospital Colombo",
  "registration_number": "NH001",
  "district": "Colombo",
  "sections": [
    {
      "id": 1,
      "name": "Emergency Ward",
      "head_of_section": "Dr. Silva",
      "needs": [
        {
          "id": 1,
          "name": "Saline Bottles",
          "priority": "CRITICAL",
          "quantity_required": 500,
          "quantity_received": 0,
          "unit": "UNIT",
          "description": "0.9% Sodium Chloride 500ml"
        }
      ]
    }
  ]
}
```

**✅ Success:** You see the full hierarchy: Org → Section → Needs

---

### Test 2.3: Filter Needs by Priority

**Method:** GET  
**URL:** http://localhost:8000/api/needs/?priority=CRITICAL

**✅ Expected Response:** List of only CRITICAL priority items

---

## 🧪 TESTING PHASE 3: Document Upload (No AI Yet)

### Test 3.1: Upload PDF via Admin Panel

**Steps:**
1. Go to admin panel: http://localhost:8000/admin/
2. Click **"Document uploads"**
3. Click **"Add Document upload"**
4. Fill in:
   - Uploaded by: Select your admin user
   - Organization: `National Hospital Colombo`
   - File: Click "Choose File" and upload a PDF
5. Click **"Save"**

**✅ Success:** 
- Document uploaded
- Status: "PENDING"
- File saved in: `backend/media/needs_pdfs/`

---

### Test 3.2: Upload PDF via API (Postman)

**Method:** POST  
**URL:** http://localhost:8000/api/documents/  
**Auth:** Basic Auth (username: admin, password: admin123)  
**Body:** form-data

**Postman Steps:**
1. Create new request
2. Set to POST
3. URL: `http://localhost:8000/api/documents/`
4. Go to **Authorization** tab:
   - Type: Basic Auth
   - Username: `admin`
   - Password: `admin123`
5. Go to **Body** tab:
   - Select **"form-data"** (NOT raw or binary!)
   - Add key: `organization` → Value: `1`
   - Add key: `file` → Change type to "File" → Select your PDF
6. Click **Send**

**✅ Expected Response:**
```json
{
  "id": 1,
  "file": "http://localhost:8000/media/needs_pdfs/yourfile.pdf",
  "uploaded_by": 1,
  "organization": 1,
  "uploaded_at": "2026-03-12T...",
  "status": "PENDING",
  "ai_extracted_json": null
}
```

**❌ Common Errors:**

**Error: "Missing file"**
- Solution: Make sure you selected "form-data" in Body tab
- Make sure file key is set to "File" type (not "Text")

**Error: "Invalid Content-Type"**
- Solution: Don't use "raw" or "binary" in Body tab
- Use "form-data"

**Error: "Invalid file type"**
- Solution: Only PDF files are accepted
- Make sure file has .pdf extension

---

## 🧪 TESTING PHASE 4: AI Document Processing (Main Feature!)

### Test 4.1: Verify Gemini API Key

**Before testing AI, verify your key is set:**

```powershell
cd D:\Ravindu\Rebuild\rebuild_man\backend
cat .env | Select-String "GEMINI"
```

**Should show:**
```
GEMINI_API_KEY=AIzaSyA...your key...
```

**If empty or missing:**
1. Go to https://aistudio.google.com/app/apikey
2. Create API key
3. Add to `.env` file
4. Restart Django server (Ctrl+C, then `python manage.py runserver`)

---

### Test 4.2: Process Document with AI

**Method:** POST  
**URL:** http://localhost:8000/api/documents/1/process_with_ai/  
**Auth:** Basic Auth (admin/admin123)

**Postman Steps:**
1. Create new POST request
2. URL: `http://localhost:8000/api/documents/1/process_with_ai/`
   (Replace `1` with your document ID)
3. Authorization: Basic Auth (admin/admin123)
4. Body: None needed for this endpoint
5. Click **Send**

**⏳ Processing time:** 5-15 seconds (Gemini is processing)

**✅ Expected Response:**
```json
{
  "message": "Document processed successfully",
  "data": {
    "status": "success",
    "extracted_text_length": 1250,
    "data": {
      "sections": [
        {
          "name": "Emergency Ward",
          "items": [
            {
              "name": "Saline Bottles",
              "priority": "CRITICAL",
              "quantity_required": 100,
              "unit": "UNIT",
              "description": "0.9% NaCl solution"
            }
          ]
        }
      ]
    }
  }
}
```

**✅ Verify:**
1. Go to admin panel
2. Click "Document uploads"
3. Click your document
4. Status should be: **"PROCESSED"**
5. `ai_extracted_json` field should have the extracted data

---

**❌ Common Errors:**

**Error: "Gemini API key not configured"**
```json
{
  "message": "Processing failed",
  "error": "Gemini API key not configured. Set GEMINI_API_KEY environment variable."
}
```
**Solution:**
1. Get key from https://aistudio.google.com/app/apikey
2. Add to `.env` file: `GEMINI_API_KEY=your-key`
3. Restart Django server

---

**Error: "Could not extract sufficient text from PDF"**
```json
{
  "message": "Processing failed",
  "error": "Could not extract sufficient text from PDF. The file might be empty or image-based."
}
```
**Solution:**
- Your PDF might be scanned images (not text-based)
- Use a PDF with actual text content
- Or use OCR tool (pytesseract) to extract from images first

---

**Error: "Invalid JSON response from AI"**
```json
{
  "message": "Processing failed",
  "error": "Invalid JSON response from AI: Expecting value: line 1 column 1 (char 0)"
}
```
**Solution:**
- Gemini returned non-JSON response
- Try again (sometimes AI needs a retry)
- Check if API key has quota remaining

---

### Test 4.3: Approve and Create Needs

**This converts the AI-extracted data into actual NeedItem entries!**

**Method:** POST  
**URL:** http://localhost:8000/api/documents/1/approve_and_create_needs/  
**Auth:** Basic Auth (admin/admin123)

**Postman Steps:**
1. Create new POST request
2. URL: `http://localhost:8000/api/documents/1/approve_and_create_needs/`
3. Authorization: Basic Auth
4. Click **Send**

**✅ Expected Response:**
```json
{
  "message": "Needs created successfully",
  "created_items_count": 5,
  "created_items": [
    {
      "id": 2,
      "name": "Surgical Masks",
      "priority": "CRITICAL",
      "section": 1
    },
    ...
  ]
}
```

**✅ Verify:**
1. Go to admin panel → "Need items"
2. You should see NEW items created from the AI extraction!
3. Go to admin panel → "Sections"
4. New sections might have been created automatically

---

## 🧪 TESTING PHASE 5: Complete Workflow Test

### Full End-to-End Test

**Scenario:** Hospital uploads needs document → AI processes → Admin approves → Needs are in system

**Step 1:** Upload PDF
```powershell
# Via API
POST http://localhost:8000/api/documents/
# Attach PDF file
```

**Step 2:** Process with AI
```powershell
POST http://localhost:8000/api/documents/2/process_with_ai/
```

**Step 3:** Review AI extraction
```powershell
# Check the ai_extracted_json field
GET http://localhost:8000/api/documents/2/
```

**Step 4:** Approve and create needs
```powershell
POST http://localhost:8000/api/documents/2/approve_and_create_needs/
```

**Step 5:** View all needs
```powershell
GET http://localhost:8000/api/needs/
```

**Step 6:** Filter by priority
```powershell
GET http://localhost:8000/api/needs/?priority=CRITICAL
```

**✅ Success:** Complete workflow from PDF upload to structured needs in database!

---

## 📊 TESTING CHECKLIST

Use this to track your progress:

### Setup Phase
- [ ] PostgreSQL running (docker ps)
- [ ] Virtual environment activated
- [ ] Gemini API key added to .env
- [ ] Dependencies installed
- [ ] Migrations run
- [ ] Superuser created
- [ ] Server running

### Admin Panel Tests
- [ ] Can login to admin panel
- [ ] Admin role set correctly
- [ ] Organization created
- [ ] Section created
- [ ] Manual need item created

### API Tests (Read)
- [ ] List organizations
- [ ] Get organization hierarchy
- [ ] List sections
- [ ] List needs
- [ ] Filter needs by priority

### API Tests (Write)
- [ ] Upload document via admin
- [ ] Upload document via API

### AI Processing Tests
- [ ] Gemini API key verified
- [ ] Document processed with AI
- [ ] AI extracted data correctly
- [ ] Approve and create needs
- [ ] Verify new needs in database

### Full Workflow Test
- [ ] Complete end-to-end test passed

---

## 🛠️ TROUBLESHOOTING

### Server won't start

**Check port 8000:**
```powershell
netstat -ano | findstr :8000
```

**Kill process if needed:**
```powershell
taskkill /PID <process_id> /F
```

---

### Database connection error

**Verify PostgreSQL is running:**
```powershell
docker ps
```

**Restart if needed:**
```powershell
docker-compose down
docker-compose up -d
```

---

### "Module not found" errors

**Reinstall dependencies:**
```powershell
pip install -r requirements.txt
```

---

### Gemini API quota exceeded

**Error:** "Resource has been exhausted (e.g. check quota)"

**Solution:**
- Free tier: 15 requests/minute
- Wait 1 minute and try again
- Or upgrade to paid tier

---

## 📝 SAMPLE TEST PDF

Create a test PDF with this content:

```
NATIONAL HOSPITAL COLOMBO
Emergency Supplies Required - March 2026

CRITICAL ITEMS (Urgent):
1. Saline Bottles (0.9% NaCl 500ml) - 200 units
2. Surgical Masks (N95) - 500 units
3. Disposable Gloves (Latex, Medium) - 1000 pairs

ESSENTIAL ITEMS:
1. Paracetamol Tablets (500mg) - 50 boxes
2. Bandages (10cm x 4m) - 100 rolls
3. Antiseptic Solution (Dettol 500ml) - 20 liters

NICE TO HAVE:
1. Patient Gowns - 50 units
2. Bed Sheets - 100 units
```

Save as: `hospital_needs.pdf`

---

## 🎯 EXPECTED AI RESULTS

When Gemini processes the sample PDF above, you should get:

```json
{
  "sections": [
    {
      "name": "Emergency Ward",
      "items": [
        {
          "name": "Saline Bottles",
          "priority": "CRITICAL",
          "quantity_required": 200,
          "unit": "UNIT",
          "description": "0.9% NaCl 500ml"
        },
        {
          "name": "Surgical Masks",
          "priority": "CRITICAL",
          "quantity_required": 500,
          "unit": "UNIT",
          "description": "N95"
        }
        // ... more items
      ]
    }
  ]
}
```

---

## 📚 ADDITIONAL RESOURCES

- **Gemini API Docs:** https://ai.google.dev/docs
- **Get API Key:** https://aistudio.google.com/app/apikey
- **DRF Docs:** https://www.django-rest-framework.org/
- **Project Documentation:** See `backend/README.md`

---

## ✅ SUCCESS CRITERIA

Your project is working correctly if:

1. ✅ Can login to admin panel
2. ✅ Can create organizations, sections, needs manually
3. ✅ Can view data via API endpoints
4. ✅ Can upload PDF documents
5. ✅ **Gemini AI successfully extracts items from PDF**
6. ✅ Can approve AI results and create needs
7. ✅ Complete workflow: PDF → AI → Database works

---

## 🎉 CONGRATULATIONS!

If all tests pass, your Disaster Relief Management System is **fully functional**!

Next steps:
- Build the frontend UI (Next.js)
- Add authentication to frontend
- Create donor dashboard
- Implement donation tracking
- Add notifications

---

**Need Help?**
- Check error messages in Django terminal
- Review `backend/ERROR_MESSAGES_GUIDE.md`
- Check `backend/GEMINI_MIGRATION_GUIDE.md` for API setup
