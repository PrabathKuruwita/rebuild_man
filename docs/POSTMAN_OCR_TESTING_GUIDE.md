# Testing OCR Functionality with Postman - Step by Step Guide

## Prerequisites

✅ Django server running: `python manage.py runserver`  
✅ PostgreSQL database running: `docker-compose up -d`  
✅ Superuser created with role set to `ADMIN`  
✅ **Gemini API key** configured in `.env` file (FREE from https://aistudio.google.com/app/apikey)  
✅ Organization created in admin panel  
✅ PDF document ready for upload  

---

## Step 1: Launch Postman

1. Open Postman application
2. Create a new request (click the `+` tab or `New` button)

---

## Step 2: Upload Document

### Request Configuration:

**Method:** `POST`

**URL:** `http://localhost:8000/api/documents/`

### Set Authentication:

1. Click the **"Authorization"** tab (below the URL bar)
2. **Type:** Select `Basic Auth` from the dropdown
3. **Username:** Enter your superuser username (e.g., `admin`)
4. **Password:** Enter your superuser password
5. Click outside the fields to apply

### Set Request Body (IMPORTANT):

1. Click the **"Body"** tab (next to Authorization)
2. **Select `form-data`** (NOT "raw", NOT "binary", NOT "x-www-form-urlencoded")
3. Add two fields:

   **Field 1: organization**
   - **KEY:** Type `organization`
   - **VALUE:** Type `1` (or your organization ID)
   - **TYPE:** Keep as `Text` (default)

   **Field 2: file**
   - **KEY:** Type `file`
   - **VALUE:** Click "Select Files" button (appears when you hover over the value area)
   - Choose your PDF file (e.g., `hospital_needs.pdf`)
   - **TYPE:** Will automatically change to `File`

### Your form-data should look like:

```
KEY             VALUE                    TYPE
organization    1                        Text
file            hospital_needs.pdf       File
```

### Send Request:

4. Click the blue **"Send"** button

### Expected Response (201 Created):

```json
{
    "id": 1,
    "uploaded_by": 1,
    "organization": 1,
    "file": "http://localhost:8000/media/needs_pdfs/hospital_needs.pdf",
    "uploaded_at": "2026-03-07T10:30:00Z",
    "status": "PENDING",
    "ai_extracted_json": null
}
```

**Important:** Note the `"id": 1` - you'll need this for the next step!

---

## Step 3: Process Document with AI

### Create a New Request:

**Method:** `POST`

**URL:** `http://localhost:8000/api/documents/1/process_with_ai/`
(Replace `1` with your document ID from Step 2)

### Set Authentication:

1. **Authorization** tab
2. **Type:** `Basic Auth`
3. **Username:** Your username
4. **Password:** Your password

### Body:

- **No body needed** for this request
- You can leave it on "none" or keep any setting - body is ignored

### Send Request:

Click **"Send"**

⏱️ **Wait 10-20 seconds** - AI processing takes time!

### Expected Response (200 OK):

```json
{
    "message": "Document processed successfully",
    "data": {
        "status": "success",
        "extracted_text_length": 450,
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
                            "description": "500ml saline solution"
                        },
                        {
                            "name": "Surgical Gloves",
                            "priority": "CRITICAL",
                            "quantity_required": 50,
                            "unit": "BOX",
                            "description": "Large size"
                        }
                    ]
                },
                {
                    "name": "Pharmacy Section",
                    "items": [
                        {
                            "name": "Paracetamol Tablets",
                            "priority": "ESSENTIAL",
                            "quantity_required": 500,
                            "unit": "BOX",
                            "description": ""
                        }
                    ]
                }
            ]
        }
    }
}
```

**✅ Success!** The AI has extracted structured data from your PDF!

---

## Step 4: Review the Extracted Data

Look at the response carefully:

- **sections**: Array of department/sections found
- **items**: Array of needed items in each section
- **name**: Item name
- **priority**: CRITICAL, ESSENTIAL, or NICE
- **quantity_required**: How many units needed
- **unit**: UNIT, BOX, KG, or LITER
- **description**: Additional details

**Decision Point:** Does the extracted data look correct?
- ✅ **Yes** → Proceed to Step 5 (Approve)
- ❌ **No** → You can process again or manually edit in admin panel later

---

## Step 5: Approve and Create Needs

### Create a New Request:

**Method:** `POST`

**URL:** `http://localhost:8000/api/documents/1/approve_and_create_needs/`
(Replace `1` with your document ID)

### Set Authentication:

1. **Authorization** tab
2. **Type:** `Basic Auth`
3. **Username:** Your username (must be ADMIN or ORG_ADMIN)
4. **Password:** Your password

### Body:

- **No body needed**

### Send Request:

Click **"Send"**

### Expected Response (201 Created):

```json
{
    "message": "Successfully created 9 need items",
    "items_created": 9
}
```

**✅ Success!** The AI-extracted data is now in your database!

---

## Step 6: Verify Results

### View Organization Hierarchy:

**Method:** `GET`

**URL:** `http://localhost:8000/api/organizations/1/hierarchy/`
(Replace `1` with your organization ID)

### Set Authentication:

1. **Authorization** tab
2. **Type:** `Basic Auth`
3. **Username:** Your username
4. **Password:** Your password

### Send Request:

Click **"Send"**

### Expected Response:

```json
{
    "id": 1,
    "name": "General Hospital Colombo",
    "registration_number": "GH001",
    "district": "Colombo",
    "sections": [
        {
            "id": 1,
            "name": "Emergency Ward",
            "head_of_section": "",
            "needs": [
                {
                    "id": 1,
                    "section": 1,
                    "name": "Saline Bottles",
                    "priority": "CRITICAL",
                    "quantity_required": 200,
                    "quantity_received": 0,
                    "unit": "UNIT",
                    "description": "500ml saline solution",
                    "created_at": "2026-03-07T10:35:00Z"
                },
                {
                    "id": 2,
                    "section": 1,
                    "name": "Surgical Gloves",
                    "priority": "CRITICAL",
                    "quantity_required": 50,
                    "quantity_received": 0,
                    "unit": "BOX",
                    "description": "Large size",
                    "created_at": "2026-03-07T10:35:00Z"
                }
            ]
        },
        {
            "id": 2,
            "name": "Pharmacy Section",
            "head_of_section": "",
            "needs": [...]
        }
    ]
}
```

**🎉 Perfect!** Your needs are now in the system!

---

## Bonus: View All Documents

### Method: `GET`

### URL: `http://localhost:8000/api/documents/`

### Response:

```json
{
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "uploaded_by": 1,
            "organization": 1,
            "file": "http://localhost:8000/media/needs_pdfs/hospital_needs.pdf",
            "uploaded_at": "2026-03-07T10:30:00Z",
            "status": "APPROVED",
            "ai_extracted_json": {
                "status": "success",
                "data": {...}
            }
        }
    ]
}
```

Status progression: `PENDING` → `PROCESSED` → `APPROVED`

---

## Bonus: View Needs by Priority

### Critical Needs Only:

**Method:** `GET`

**URL:** `http://localhost:8000/api/needs/?priority=CRITICAL`

### Essential Needs:

**URL:** `http://localhost:8000/api/needs/?priority=ESSENTIAL`

### Nice to Have:

**URL:** `http://localhost:8000/api/needs/?priority=NICE`

---

## Common Issues & Solutions

### ❌ Issue 1: "Unsupported media type"

**Problem:** You're using the wrong body type

**Solution:**
- Go to Body tab
- Select **"form-data"** (not "raw" or "binary")
- Make sure file type is "File" not "Text"

---

### ❌ Issue 2: "You do not have permission"

**Problem:** Your user doesn't have the right role

**Solution:**
1. Run: `python fix_permissions.py`
2. Or set role to ADMIN in Django admin panel
3. Restart server after changes

---

### ❌ Issue 3: "Gemini API key not configured"

**Problem:** Missing or invalid API key

**Solution:**
1. Get FREE API key from: https://aistudio.google.com/app/apikey
2. Create `.env` file: `copy .env.example .env`
3. Edit `.env` and add: `GEMINI_API_KEY=your-gemini-key-here`
4. Restart server

---

### ❌ Issue 4: "Could not extract sufficient text from PDF"

**Problem:** PDF is image-based or empty

**Solution:**
- Make sure PDF contains real text (not scanned images)
- Use text-based PDFs
- Ensure PDF has at least 50 characters

---

### ❌ Issue 5: "Invalid credentials"

**Problem:** Wrong username or password

**Solution:**
- Double-check username and password
- Try logging into admin panel: http://localhost:8000/admin/
- If needed, reset password: `python manage.py changepassword username`

---

### ❌ Issue 6: "Organization with this field does not exist"

**Problem:** Organization ID doesn't exist

**Solution:**
1. Go to: http://localhost:8000/admin/core/organization/
2. Create an organization or note the correct ID
3. Use that ID in the upload request

---

## Postman Collection (Optional)

You can save these requests as a Collection in Postman:

1. Click "Collections" in left sidebar
2. Click "New Collection"
3. Name it "Rebuild API - OCR Testing"
4. Click the three dots → "Add request" for each step above

**Benefit:** Saves time - you won't need to reconfigure each time!

---

## Sample PDF Content

If you need to create a test PDF, use this content:

```
GENERAL HOSPITAL COLOMBO
URGENT NEEDS LIST - March 2026

EMERGENCY WARD:
- Saline Bottles (500ml) - 200 units URGENT
- Surgical Gloves (Large) - 50 boxes CRITICAL
- Blood Pressure Monitors - 10 units NEEDED
- Oxygen Cylinders - 20 units CRITICAL

PHARMACY SECTION:
- Paracetamol Tablets - 500 boxes ESSENTIAL
- Antibiotic Injections - 100 units CRITICAL
- Bandages (5cm width) - 300 units NEEDED
- First Aid Kits - 50 boxes ESSENTIAL

OPERATION THEATER:
- Surgical Masks (N95) - 1000 units URGENT
- Anesthesia Supplies - 20 boxes CRITICAL
- Surgical Instruments Set - 5 units NEEDED
- Sterilization Equipment - 3 units ESSENTIAL

KITCHEN:
- Rice - 100 kg ESSENTIAL
- Cooking Oil - 50 liters ESSENTIAL
- Vegetables - 200 kg NEEDED
- Canned Food - 300 boxes NICE TO HAVE
```

Save this as a Word document, then export as PDF.

---

## Complete Workflow Summary

```
1. Upload PDF
   POST /api/documents/
   → Get document ID
   
2. Process with AI
   POST /api/documents/{id}/process_with_ai/
   → Review extracted data
   
3. Approve & Create
   POST /api/documents/{id}/approve_and_create_needs/
   → Items created in database
   
4. View Results
   GET /api/organizations/{id}/hierarchy/
   → See all sections and needs
```

---

## Tips for Faster Testing

1. **Save requests as a Collection** - Reuse without reconfiguring
2. **Use Environment Variables** in Postman for:
   - `{{base_url}}` = `http://localhost:8000/api`
   - `{{username}}` = Your username
   - `{{password}}` = Your password
3. **Keep document IDs handy** - Write them down after upload
4. **Test with small PDFs first** - Faster processing
5. **Check admin panel** between steps: http://localhost:8000/admin/

---

## Video Tutorial Alternative

If you prefer visual learning:

1. Launch Postman
2. Watch the "Pretty" response tab turn your JSON into readable format
3. Use the "Code" button (right side) to see equivalent curl commands
4. Use "Send and Download" for large responses

---

## Next Steps After Testing

Once OCR works:
- ✅ Test with different PDF formats
- ✅ Test with large documents (multiple pages)
- ✅ Test with different priority levels
- ✅ Test approval workflow with different users
- ✅ Integrate with your frontend
- ✅ Add webhooks for real-time updates

---

## Need Help?

- **Server logs:** Check terminal where `python manage.py runserver` is running
- **Admin panel:** http://localhost:8000/admin/ to verify data
- **API browser:** http://localhost:8000/api/ for interactive testing
- **Documentation:** See README.md, API_DOCUMENTATION.md

---

**Happy Testing!** 🚀

If you encounter any errors, remember: the error messages now include solutions and examples!
