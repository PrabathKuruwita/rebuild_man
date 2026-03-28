# POSTMAN TESTING GUIDE - Complete Backend Functionality

## 📋 TABLE OF CONTENTS
1. Postman Setup
2. Authentication Configuration
3. Testing Organizations
4. Testing Sections
5. Testing Needs
6. Testing Document Upload & AI Processing
7. Complete End-to-End Workflow
8. Error Handling & Troubleshooting

---

## 1️⃣ POSTMAN SETUP

### Step 1: Download Postman
- Go to: https://www.postman.com/downloads/
- Download and install Postman
- Launch Postman

### Step 2: Create a New Collection
1. Click **"Collections"** in left sidebar
2. Click **"Create new collection"**
3. Name it: `Rebuild Backend API`
4. Click **"Create"**

### Step 3: Create Environment Variables
1. Click **Settings icon** (⚙️) → **Environments**
2. Click **"Create new environment"**
3. Name it: `Local Development`
4. Add these variables:

```
Variable Name        | Initial Value      | Current Value
==================================================
base_url            | localhost:8000     | localhost:8000
username            | superuser          | superuser
password            | password123        | password123
org_id              | 1                  | 1
section_id          | 1                  | 1
need_id             | 1                  | 1
document_id         | 1                  | 1
```

5. Click **"Save"**
6. Select this environment from the dropdown (top right)

---

## 2️⃣ AUTHENTICATION SETUP

### Configure Basic Auth (for all requests)

All API requests need Basic Authentication using your superuser credentials.

**Method 1: Set globally for collection**
1. Open your collection
2. Click **"..."** → **"Edit"**
3. Go to **"Authorization"** tab
4. Select Type: **"Basic Auth"**
5. Username: `{{username}}`
6. Password: `{{password}}`

**Method 2: Per request (if using different creds)**
1. In any request
2. Go to **"Authorization"** tab
3. Type: **"Basic Auth"**
4. Username: `superuser`
5. Password: `password123`

---

## 3️⃣ TESTING ORGANIZATIONS

### Test 3.1: Get All Organizations (Public - No Auth Needed)

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/organizations/
```

**Expected Response (200 OK):**
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

**Steps in Postman:**
1. Create new request
2. Name: `Get All Organizations`
3. Method: GET
4. URL: `http://{{base_url}}/api/organizations/`
5. Click **Send**

---

### Test 3.2: Create Organization (Admin Only)

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/organizations/
Authorization: Basic Auth (superuser/password123)
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Colombo General Hospital",
  "registration_number": "CGH-001",
  "address": "123 Hospital Avenue, Colombo 7",
  "district": "Colombo",
  "admin_user": 1
}
```

**Expected Response (201 Created):**
```json
{
  "id": 2,
  "name": "Colombo General Hospital",
  "registration_number": "CGH-001",
  "district": "Colombo",
  "sections": []
}
```

**Steps in Postman:**
1. Create new request
2. Name: `Create Organization`
3. Method: POST
4. URL: `http://{{base_url}}/api/organizations/`
5. Authorization: Basic Auth (superuser/password123)
6. Body → raw → JSON:
```json
{
  "name": "Colombo General Hospital",
  "registration_number": "CGH-001",
  "address": "123 Hospital Avenue, Colombo 7",
  "district": "Colombo",
  "admin_user": 1
}
```
7. Click **Send**
8. **Save organization ID** from response (e.g., `{{org_id}}` = 2)

---

### Test 3.3: Get Organization Details

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/organizations/{{org_id}}/
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "name": "National Hospital Colombo",
  "registration_number": "NH001",
  "district": "Colombo",
  "sections": []
}
```

**Steps in Postman:**
1. Create new request
2. Name: `Get Organization Details`
3. Method: GET
4. URL: `http://{{base_url}}/api/organizations/{{org_id}}/`
5. Click **Send**

---

### Test 3.4: Get Organization Hierarchy (Full Tree View)

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/organizations/{{org_id}}/hierarchy/
```

**Expected Response (200 OK):**
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
          "description": "0.9% NaCl"
        }
      ]
    }
  ]
}
```

**Steps in Postman:**
1. Create new request
2. Name: `Get Organization Hierarchy`
3. Method: GET
4. URL: `http://{{base_url}}/api/organizations/{{org_id}}/hierarchy/`
5. Click **Send**
6. ⭐ This is perfect for frontend tree view!

---

### Test 3.5: Update Organization

**Request:**
```
Method: PUT
URL: http://{{base_url}}/api/organizations/{{org_id}}/
Authorization: Basic Auth
Content-Type: application/json
```

**Body:**
```json
{
  "name": "National Hospital Colombo (Updated)",
  "registration_number": "NH001",
  "address": "Regent Street, Colombo 7",
  "district": "Colombo",
  "admin_user": 1
}
```

**Expected Response (200 OK):** Updated organization object

**Steps in Postman:**
1. Create new request
2. Name: `Update Organization`
3. Method: PUT
4. URL: `http://{{base_url}}/api/organizations/{{org_id}}/`
5. Authorization: Basic Auth
6. Body → raw → JSON (paste above)
7. Click **Send**

---

### Test 3.6: Delete Organization

**Request:**
```
Method: DELETE
URL: http://{{base_url}}/api/organizations/{{org_id}}/
Authorization: Basic Auth
```

**Expected Response (204 No Content)** - Empty body

**Steps in Postman:**
1. Create new request
2. Name: `Delete Organization`
3. Method: DELETE
4. URL: `http://{{base_url}}/api/organizations/{{org_id}}/`
5. Authorization: Basic Auth
6. Click **Send**
7. ⚠️ This will delete the organization and all related data!

---

## 4️⃣ TESTING SECTIONS (Departments)

### Test 4.1: Create Section

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/sections/
Authorization: Basic Auth
Content-Type: application/json
```

**Body:**
```json
{
  "organization": 1,
  "name": "Emergency Ward",
  "head_of_section": "Dr. Nimal Silva"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "name": "Emergency Ward",
  "head_of_section": "Dr. Nimal Silva",
  "needs": []
}
```

**Steps in Postman:**
1. Create new request
2. Name: `Create Section`
3. Method: POST
4. URL: `http://{{base_url}}/api/sections/`
5. Authorization: Basic Auth
6. Body → raw → JSON:
```json
{
  "organization": 1,
  "name": "Emergency Ward",
  "head_of_section": "Dr. Nimal Silva"
}
```
7. Click **Send**
8. **Save section ID** from response

---

### Test 4.2: Get All Sections

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/sections/
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Emergency Ward",
    "head_of_section": "Dr. Nimal Silva",
    "needs": []
  }
]
```

---

### Test 4.3: Get Section Details

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/sections/{{section_id}}/
```

---

### Test 4.4: Update Section

**Request:**
```
Method: PUT
URL: http://{{base_url}}/api/sections/{{section_id}}/
Authorization: Basic Auth
```

**Body:**
```json
{
  "organization": 1,
  "name": "Emergency Ward (Updated)",
  "head_of_section": "Dr. Chandrika Perera"
}
```

---

### Test 4.5: Delete Section

**Request:**
```
Method: DELETE
URL: http://{{base_url}}/api/sections/{{section_id}}/
Authorization: Basic Auth
```

---

## 5️⃣ TESTING NEEDS (Supply Items)

### Test 5.1: Create Need Item

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/needs/
Authorization: Basic Auth
Content-Type: application/json
```

**Body:**
```json
{
  "section": 1,
  "name": "Saline Bottles (0.9% NaCl 500ml)",
  "priority": "CRITICAL",
  "quantity_required": 200,
  "unit": "UNIT",
  "description": "Emergency IV fluid therapy"
}
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "section": 1,
  "name": "Saline Bottles (0.9% NaCl 500ml)",
  "priority": "CRITICAL",
  "quantity_required": 200,
  "quantity_received": 0,
  "unit": "UNIT",
  "description": "Emergency IV fluid therapy",
  "created_at": "2026-03-14T10:30:45.123456Z"
}
```

**Steps in Postman:**
1. Create new request
2. Name: `Create Need Item`
3. Method: POST
4. URL: `http://{{base_url}}/api/needs/`
5. Authorization: Basic Auth
6. Body → raw → JSON (paste above)
7. Click **Send**
8. **Save need ID** from response

---

### Test 5.2: Create More Need Items (Bulk)

Use the same `POST /api/needs/` endpoint, but for this test send a JSON array in `Body -> raw -> JSON`.

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/needs/
Authorization: Basic Auth
Content-Type: application/json
```

**Body:**
```json
[
  {
    "section": 1,
    "name": "Surgical Masks (N95)",
    "priority": "CRITICAL",
    "quantity_required": 500,
    "unit": "UNIT",
    "description": "Infection control"
  },
  {
    "section": 1,
    "name": "Paracetamol 500mg",
    "priority": "ESSENTIAL",
    "quantity_required": 50,
    "unit": "BOX",
    "description": "Fever and pain management"
  },
  {
    "section": 1,
    "name": "Patient Gowns",
    "priority": "NICE",
    "quantity_required": 100,
    "unit": "UNIT",
    "description": "Patient comfort"
  }
]
```

**Expected Response (201 Created):** Array of created need items.

If you are testing against an older server instance that does not include this bulk-create fix yet, send these as three separate `POST /api/needs/` requests instead of one array.

Create these to test filtering:

**Critical Item:**
```json
{
  "section": 1,
  "name": "Surgical Masks (N95)",
  "priority": "CRITICAL",
  "quantity_required": 500,
  "unit": "UNIT",
  "description": "Infection control"
}
```

**Essential Item:**
```json
{
  "section": 1,
  "name": "Paracetamol 500mg",
  "priority": "ESSENTIAL",
  "quantity_required": 50,
  "unit": "BOX",
  "description": "Fever and pain management"
}
```

**Nice to Have Item:**
```json
{
  "section": 1,
  "name": "Patient Gowns",
  "priority": "NICE",
  "quantity_required": 100,
  "unit": "UNIT",
  "description": "Patient comfort"
}
```

---

### Test 5.3: Get All Needs

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/needs/
```

**Expected Response (200 OK):** Array of all need items

---

### Test 5.4: Filter Needs by Priority ⭐

**Critical Items Only:**
```
Method: GET
URL: http://{{base_url}}/api/needs/?priority=CRITICAL
```

**Essential Items Only:**
```
Method: GET
URL: http://{{base_url}}/api/needs/?priority=ESSENTIAL
```

**Nice to Have Items:**
```
Method: GET
URL: http://{{base_url}}/api/needs/?priority=NICE
```

**Steps in Postman:**
1. Create new request
2. Name: `Get Critical Needs`
3. Method: GET
4. URL: `http://{{base_url}}/api/needs/`
5. Params tab:
   - Key: `priority`
   - Value: `CRITICAL`
6. Click **Send**
7. Only CRITICAL items returned!

---

### Test 5.5: Get Need Details

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/needs/{{need_id}}/
```

---

### Test 5.6: Update Need Item (Track Received Quantity)

**Request:**
```
Method: PUT
URL: http://{{base_url}}/api/needs/{{need_id}}/
Authorization: Basic Auth
```

**Body:**
```json
{
  "section": 1,
  "name": "Saline Bottles (0.9% NaCl 500ml)",
  "priority": "CRITICAL",
  "quantity_required": 200,
  "quantity_received": 150,
  "unit": "UNIT",
  "description": "Emergency IV fluid therapy"
}
```

**Steps in Postman:**
1. Create new request
2. Name: `Update Need (Track Donations)`
3. Method: PUT
4. URL: `http://{{base_url}}/api/needs/{{need_id}}/`
5. Authorization: Basic Auth
6. Update `quantity_received` to show donations received
7. Click **Send**

---

### Test 5.7: Delete Need

**Request:**
```
Method: DELETE
URL: http://{{base_url}}/api/needs/{{need_id}}/
Authorization: Basic Auth
```

---

## 6️⃣ TESTING DOCUMENT UPLOAD & AI PROCESSING ⭐ (Main Feature)

### Test 6.1: Upload Document

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/documents/
Authorization: Basic Auth
Content-Type: multipart/form-data
```

**Steps in Postman:**

1. Create new request
2. Name: `Upload PDF Document`
3. Method: POST
4. URL: `http://{{base_url}}/api/documents/`
5. Authorization: Basic Auth (superuser/password123)
6. **Body tab → form-data**:
   - Key: `organization`
     - Type: Text
     - Value: `1`
   - Key: `file`
     - Type: File
     - Click "Select Files" and choose a PDF from your computer

**⚠️ Important: PDF Requirements**
- Must be a valid PDF file
- Must have text (not just scanned images)
- Should contain hospital needs information
- Example format:
  ```
  HOSPITAL NEEDS - March 2026
  
  CRITICAL ITEMS:
  - Saline Bottles 0.9% - 200 units
  - Surgical Masks N95 - 500 units
  
  ESSENTIAL:
  - Paracetamol 500mg - 50 boxes
  
  NICE TO HAVE:
  - Patient Gowns - 100 units
  ```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "file": "http://localhost:8000/media/needs_pdfs/document_abc123.pdf",
  "uploaded_by": 1,
  "organization": 1,
  "uploaded_at": "2026-03-14T10:45:30.123456Z",
  "status": "PENDING",
  "ai_extracted_json": null
}
```

**Save document ID!** (from response, e.g., `{{document_id}} = 1`)

Optional Postman **Tests** script to save it automatically:
```javascript
pm.test("Upload successful", function () {
  pm.response.to.have.status(201);
});

const data = pm.response.json();
if (data && data.id) {
  pm.environment.set("document_id", data.id);
}
```

---

### Test 6.2: Check Document Status (Before Processing)

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/documents/{{document_id}}/
Authorization: Basic Auth
```

**Expected Response:**
```json
{
  "id": 1,
  "file": "...",
  "status": "PENDING",
  "ai_extracted_json": null
}
```

---

### Test 6.3: Process Document with Gemini AI ⭐⭐⭐

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/documents/{{document_id}}/process_with_ai/
Authorization: Basic Auth
```

**Steps in Postman:**
1. Create new request
2. Name: `Process Document with AI`
3. Method: POST
4. URL: `http://{{base_url}}/api/documents/{{document_id}}/process_with_ai/`
5. Authorization: Basic Auth
6. Body: None (leave empty)
7. Click **Send**
8. ⏳ **Wait 5-15 seconds** - Gemini is processing!

If you see `.../api/documents//process_with_ai/`, your `document_id` variable is empty.

**Expected Response (200 OK):**
```json
{
  "message": "Document processed successfully",
  "data": {
    "status": "success",
    "extracted_text_length": 1245,
    "data": {
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
              "description": "N95 Standard"
            }
          ]
        }
      ]
    }
  }
}
```

**What just happened:**
1. ✅ PDF text extracted
2. ✅ Sent to Gemini AI
3. ✅ AI classified items by priority
4. ✅ AI organized by sections
5. ✅ Returned structured JSON
6. ✅ Saved to database under `ai_extracted_json`

---

### Test 6.4: View Extracted Data

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/documents/{{document_id}}/
Authorization: Basic Auth
```

**Expected Response:**
```json
{
  "id": 1,
  "file": "...",
  "status": "PROCESSED",
  "ai_extracted_json": {
    "status": "success",
    "extracted_text_length": 1245,
    "data": {
      "sections": [
        "..."
      ]
    }
  }
}
```

**✅ Notice:** 
- Status changed from `PENDING` to `PROCESSED`
- `ai_extracted_json` now contains the extracted data

---

### Test 6.5: Approve and Create Needs ⭐⭐⭐

**This converts AI-extracted data into actual database entries!**

**Request:**
```
Method: POST
URL: http://{{base_url}}/api/documents/{{document_id}}/approve_and_create_needs/
Authorization: Basic Auth
```

**Steps in Postman:**
1. Create new request
2. Name: `Approve & Create Needs from AI`
3. Method: POST
4. URL: `http://{{base_url}}/api/documents/{{document_id}}/approve_and_create_needs/`
5. Authorization: Basic Auth
6. Body: None
7. Click **Send**

**Expected Response (201 Created):**
```json
{
  "message": "Needs created successfully",
  "created_items_count": 5,
  "created_items": [
    {
      "id": 5,
      "name": "Saline Bottles",
      "priority": "CRITICAL",
      "section": 2
    },
    {
      "id": 6,
      "name": "Surgical Masks",
      "priority": "CRITICAL",
      "section": 2
    }
  ]
}
```

**What just happened:**
1. ✅ Read AI-extracted JSON
2. ✅ Created new Sections if needed
3. ✅ Created NeedItem entries
4. ✅ Associated with Organization
5. ✅ Now visible in `/api/needs/`

---

### Test 6.6: Verify New Needs Were Created

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/needs/
Authorization: Basic Auth
```

**Expected Response:** Should now include the newly created items from AI!

**Quick test:** Filter by critical:
```
Method: GET
URL: http://{{base_url}}/api/needs/?priority=CRITICAL
Authorization: Basic Auth
```

---

### Test 6.7: List All Documents

**Request:**
```
Method: GET
URL: http://{{base_url}}/api/documents/
Authorization: Basic Auth
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "file": "...",
    "status": "APPROVED",
    "uploaded_by": 1,
    "organization": 1,
    "uploaded_at": "..."
  }
]
```

---

## 7️⃣ COMPLETE END-TO-END WORKFLOW

### Full Test Scenario: Hospital Sends Needs via PDF → AI Processes → Needs Available to Donors

**Follow these steps IN ORDER:**

#### Step 1: Create Organization (If not exists)
```
POST /api/organizations/
Body: {
  "name": "St. Mary's Hospital",
  "registration_number": "SMH-001",
  "address": "Main Road, Colombo",
  "district": "Colombo",
  "admin_user": 1
}
```
**Save org_id from response (e.g., 2)**

---

#### Step 2: Create Section
```
POST /api/sections/
Body: {
  "organization": 2,
  "name": "Emergency Department",
  "head_of_section": "Dr. Rajith Kumar"
}
```
**Save section_id from response**

---

#### Step 3: Upload PDF with Hospital Needs
```
POST /api/documents/
Form-data:
  organization: 2
  file: <select your PDF>
```
**Save document_id from response**

---

#### Step 4: Check Upload Status
```
GET /api/documents/2/
```
**Verify status = PENDING**

---

#### Step 5: Process with AI (The Magic! ✨)
```
POST /api/documents/2/process_with_ai/
```
**⏳ Wait 5-15 seconds for AI processing**

---

#### Step 6: Check Processed Data
```
GET /api/documents/2/
```
**Verify:**
- status = PROCESSED
- ai_extracted_json contains extracted items

---

#### Step 7: Review & Approve
```
POST /api/documents/2/approve_and_create_needs/
```
**Verify: created_items_count > 0**

---

#### Step 8: View Organization Hierarchy (Complete Tree!)
```
GET /api/organizations/2/hierarchy/
```
**Should show:**
- Organization
  - Section (Emergency Department)
    - All NeedItems created from PDF!

---

#### Step 9: Donor Views What's Needed
```
GET /api/needs/?priority=CRITICAL
```
**Donor sees critical items first!**

---

#### Step 10: Donor Provides Donation (Update quantities)
```
PUT /api/needs/[need_id]/
Body: {
  "quantity_received": 150  ← Donor provided 150 units
}
```

---

## 8️⃣ ERROR HANDLING & TROUBLESHOOTING

### ❌ Error: "401 Unauthorized"

**Cause:** Missing or wrong authentication

**Fix in Postman:**
1. Click **Authorization** tab
2. Type: **Basic Auth**
3. Username: `superuser`
4. Password: `password123`
5. Click **Send** again

---

### ❌ Error: "404 Not Found"

**Cause:** Wrong URL or resource doesn't exist

**Check:**
- URL spelling
- Organization/Section/Need IDs exist
- Use correct base_url environment variable

**For document AI endpoints specifically:**
- If URL looks like `http://localhost:8000/api/documents//process_with_ai/`, `{{document_id}}` is empty.
- Run upload first (`POST /api/documents/`), copy returned `id`, and set Postman environment variable `document_id`.

---

### ❌ Error: "415 Unsupported Media Type"

**Cause:** Wrong Content-Type for file upload

**Fix for document upload:**
1. Body → **form-data** (NOT raw/json)
2. Key: `organization` (Text)
3. Key: `file` (File)

---

### ❌ Error: "400 Bad Request" during document upload

**Cause:** Missing fields or invalid file

**Check:**
- organization ID is provided
- File is a valid PDF
- File has .pdf extension

---

### ❌ Error: "Gemini API key not configured"

**Cause:** GEMINI_API_KEY not in .env

**Fix:**
1. Get free key: https://aistudio.google.com/app/apikey
2. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=AIzaSy...your_key...
   ```
3. Restart Django server

---

### ❌ Error: "google-generativeai package is not installed"

**Cause:** The Python environment running Django does not have `google-generativeai` installed.

**Fix:**
1. Open terminal in `rebuild_man/backend`
2. Install dependencies into backend venv:
  ```powershell
  .\venv\Scripts\python.exe -m pip install -r requirements.txt
  ```
3. Restart Django server:
  ```powershell
  .\venv\Scripts\python.exe manage.py runserver
  ```

**Quick verify:**
```powershell
.\venv\Scripts\python.exe -c "import google.generativeai as genai; print('OK')"
```

---

## 🎯 QUICK REFERENCE TABLE

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/organizations/` | GET | ❌ | List all orgs |
| `/api/organizations/` | POST | ✅ | Create org |
| `/api/organizations/{id}/` | GET | ❌ | Get org details |
| `/api/organizations/{id}/` | PUT | ✅ | Update org |
| `/api/organizations/{id}/` | DELETE | ✅ | Delete org |
| `/api/organizations/{id}/hierarchy/` | GET | ❌ | Get full tree |
| `/api/sections/` | GET | ❌ | List sections |
| `/api/sections/` | POST | ✅ | Create section |
| `/api/sections/{id}/` | GET | ❌ | Get section |
| `/api/sections/{id}/` | PUT | ✅ | Update section |
| `/api/sections/{id}/` | DELETE | ✅ | Delete section |
| `/api/needs/` | GET | ❌ | List needs |
| `/api/needs/?priority=CRITICAL` | GET | ❌ | Filter needs |
| `/api/needs/` | POST | ✅ | Create need |
| `/api/needs/{id}/` | GET | ❌ | Get need details |
| `/api/needs/{id}/` | PUT | ✅ | Update need |
| `/api/needs/{id}/` | DELETE | ✅ | Delete need |
| `/api/documents/` | GET | ✅ | List documents |
| `/api/documents/` | POST | ✅ | Upload PDF |
| `/api/documents/{id}/` | GET | ✅ | Get doc details |
| `/api/documents/{id}/process_with_ai/` | POST | ✅ | Process with AI |
| `/api/documents/{id}/approve_and_create_needs/` | POST | ✅ | Create needs |

---

## 🚀 TESTING CHECKLIST

Use this to track your progress:

```
SETUP
[ ] Postman installed
[ ] Collection created
[ ] Environment configured
[ ] Authentication working

ORGANIZATIONS
[ ] ✅ Get all (public)
[ ] ✅ Create (auth)
[ ] ✅ Get details
[ ] ✅ Get hierarchy
[ ] ✅ Update
[ ] ✅ Delete

SECTIONS
[ ] ✅ Create
[ ] ✅ Get all
[ ] ✅ Get details
[ ] ✅ Update
[ ] ✅ Delete

NEEDS
[ ] ✅ Create
[ ] ✅ Get all
[ ] ✅ Filter by priority (Critical)
[ ] ✅ Filter by priority (Essential)
[ ] ✅ Filter by priority (Nice)
[ ] ✅ Get details
[ ] ✅ Update (track donations)
[ ] ✅ Delete

DOCUMENTS & AI ⭐
[ ] ✅ Upload PDF
[ ] ✅ Check upload status
[ ] ✅ Process with AI
[ ] ✅ View extracted data
[ ] ✅ Approve & create needs
[ ] ✅ Verify needs created

END-TO-END WORKFLOW
[ ] ✅ Complete full workflow
[ ] ✅ Organization → Section → PDF → AI → Needs
```

---

## 💡 PRO TIPS

1. **Save responses to variables:**
   - Send request
   - Tests tab:
   ```javascript
   pm.environment.set("org_id", pm.response.json().id);
   ```
   - Now use `{{org_id}}` in next requests!

2. **Test in different order:**
   - Test happy path (everything works)
   - Test error cases (missing fields, wrong auth)
   - Test edge cases (large files, special characters)

3. **Export test results:**
   - Runner → Run collection
   - View results
   - Export as HTML

4. **Automate tests with scripts:**
   Use Postman's Tests tab for assertions:
   ```javascript
   pm.test("Status is 200", function () {
       pm.response.to.have.status(200);
   });
   
   pm.test("Response has org name", function () {
       pm.expect(pm.response.json()).to.have.property('name');
   });
   ```

---

## 📞 QUICK START (Copy-Paste Ready)

### Setup Variables
```
base_url: localhost:8000
username: superuser
password: password123
```

### First Request - Get All Organizations
```
GET http://localhost:8000/api/organizations/
(No auth needed)
```

### Create Test Organization
```
POST http://localhost:8000/api/organizations/
Auth: Basic Auth (superuser/password123)
Body:
{
  "name": "Test Hospital",
  "registration_number": "TH-001",
  "address": "123 Test Ave",
  "district": "Test District",
  "admin_user": 1
}
```

### Upload & Process PDF
```
POST http://localhost:8000/api/documents/
Auth: Basic Auth
Form-data:
  organization: 1
  file: <your.pdf>

Then:
POST http://localhost:8000/api/documents/{{document_id}}/process_with_ai/

Then:
POST http://localhost:8000/api/documents/{{document_id}}/approve_and_create_needs/
```

---

**Now you're ready to test everything! Start with the Quick Start section and work your way through the complete workflow.** 🎯
