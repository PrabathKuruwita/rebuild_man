# Testing AI/OCR Document Processing

## Complete Testing Guide

### Prerequisites Checklist

✅ PostgreSQL running (docker-compose up -d)  
✅ Virtual environment activated  
✅ Dependencies installed (pip install -r requirements.txt)  
✅ Database migrated (python manage.py migrate)  
✅ Superuser created (python manage.py createsuperuser)  
⚠️ OpenAI API Key configured in .env file

---

## Step 1: Configure OpenAI API Key

1. Get your API key from: https://platform.openai.com/api-keys
2. Create `.env` file (copy from `.env.example`):
   ```bash
   copy .env.example .env
   ```
3. Edit `.env` and add your key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

---

## Step 2: Start the Server

```bash
python manage.py runserver
```

Server will run at: `http://localhost:8000`

---

## Step 3: Create Test Data via Admin Panel

### A. Access Admin Panel
Open:  `http://localhost:8000/admin/`

Login with your superuser credentials.

### B. Create an Organization
1. Go to **Organizations** → **Add Organization**
2. Fill in:
   - Name: `General Hospital Colombo`
   - Registration Number: `GH001`
   - Address: `123 Hospital Road, Colombo`
   - District: `Colombo`
   - Admin User: (select your superuser)
3. Click **Save**

---

## Step 4: Create a Test PDF Document

Create a PDF with sample needs. Here's example text you can put in a Word/PDF document:

```
GENERAL HOSPITAL COLOMBO
URGENT NEEDS LIST - March 2026

EMERGENCY WARD:
- Saline Bottles (500ml) - 200 units URGENT
- Surgical Gloves (Large) - 50 boxes CRITICAL
- Blood Pressure Monitors - 10 units NEEDED

PHARMACY SECTION:
- Paracetamol Tablets - 500 boxes ESSENTIAL
- Antibiotic Injections - 100 units CRITICAL
- Bandages (5cm width) - 300 units NEEDED

OPERATION THEATER:
- Surgical Masks (N95) - 1000 units URGENT
- Anesthesia Supplies - 20 boxes CRITICAL
- Surgical Instruments Set - 5 units NEEDED

KITCHEN:
- Rice - 100 kg ESSENTIAL
- Cooking Oil - 50 liters ESSENTIAL
- Vegetables - 200 kg NEEDED
```

Save this as a PDF file (e.g., `hospital_needs.pdf`)

---

## Step 5: Test via API (Recommended)

### Method 1: Using Python Requests

Create a test script `test_ocr.py`:

```python
import requests
from requests.auth import HTTPBasicAuth

# Configuration
BASE_URL = "http://localhost:8000/api"
USERNAME = "your_superuser_username"
PASSWORD = "your_superuser_password"

# 1. Upload Document
print("Step 1: Uploading document...")
files = {
    'file': open('hospital_needs.pdf', 'rb')
}
data = {
    'organization': 1  # ID of the organization you created
}

response = requests.post(
    f"{BASE_URL}/documents/",
    files=files,
    data=data,
    auth=HTTPBasicAuth(USERNAME, PASSWORD)
)

print(f"Upload Status: {response.status_code}")
document = response.json()
print(f"Document ID: {document['id']}")
document_id = document['id']

# 2. Process with AI
print("\nStep 2: Processing with AI...")
response = requests.post(
    f"{BASE_URL}/documents/{document_id}/process_with_ai/",
    auth=HTTPBasicAuth(USERNAME, PASSWORD)
)

print(f"Processing Status: {response.status_code}")
result = response.json()
print(f"AI Result:\n{result}")

# 3. Approve and Create Needs
print("\nStep 3: Approving and creating needs...")
response = requests.post(
    f"{BASE_URL}/documents/{document_id}/approve_and_create_needs/",
    auth=HTTPBasicAuth(USERNAME, PASSWORD)
)

print(f"Approval Status: {response.status_code}")
approval = response.json()
print(f"Result: {approval}")

# 4. Verify Created Needs
print("\nStep 4: Verifying created needs...")
response = requests.get(
    f"{BASE_URL}/organizations/1/hierarchy/",
    auth=HTTPBasicAuth(USERNAME, PASSWORD)
)

print(f"Hierarchy Status: {response.status_code}")
hierarchy = response.json()
print(f"\nOrganization: {hierarchy['name']}")
print(f"Total Sections: {len(hierarchy['sections'])}")
for section in hierarchy['sections']:
    print(f"\n  Section: {section['name']}")
    print(f"  Needs: {len(section['needs'])} items")
    for need in section['needs']:
        print(f"    - {need['name']}: {need['quantity_required']} {need['unit']} ({need['priority']})")
```

Run the script:
```bash
python test_ocr.py
```

### Method 2: Using cURL

```bash
# 1. Upload Document
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -F "organization=1" \
  -F "file=@hospital_needs.pdf"

# Response will give you a document ID, use it below (e.g., ID=1)

# 2. Process with AI
curl -X POST http://localhost:8000/api/documents/1/process_with_ai/ \
  -u admin:password

# 3. Approve and Create Needs
curl -X POST http://localhost:8000/api/documents/1/approve_and_create_needs/ \
  -u admin:password

# 4. View Results
curl http://localhost:8000/api/organizations/1/hierarchy/ \
  -u admin:password
```

### Method 3: Using Postman

1. **Upload Document**
   - Method: `POST`
   - URL: `http://localhost:8000/api/documents/`
   - Auth: Basic Auth (username/password)
   - Body: form-data
     - `organization`: `1`
     - `file`: (select your PDF)

2. **Process with AI**
   - Method: `POST`
   - URL: `http://localhost:8000/api/documents/{id}/process_with_ai/`
   - Auth: Basic Auth

3. **Approve and Create**
   - Method: `POST`
   - URL: `http://localhost:8000/api/documents/{id}/approve_and_create_needs/`
   - Auth: Basic Auth

---

## Step 6: Test via Django Admin (Alternative)

### A. Upload Document
1. Go to `http://localhost:8000/admin/core/documentupload/`
2. Click **Add Document Upload**
3. Fill in:
   - **Uploaded by**: Your user
   - **Organization**: Select the organization
   - **File**: Upload your PDF
   - **Status**: Leave as PENDING
4. Click **Save**
5. Note the Document ID

### B. Process via API
Since the admin panel doesn't have buttons for custom actions, you need to use the API:

```bash
curl -X POST http://localhost:8000/api/documents/{ID}/process_with_ai/ -u admin:password
```

### C. View Results
1. Refresh the document in admin - status should be PROCESSED
2. Click on the document to see the extracted JSON in `ai_extracted_json` field

### D. Approve via API
```bash
curl -X POST http://localhost:8000/api/documents/{ID}/approve_and_create_needs/ -u admin:password
```

### E. Verify Created Items
1. Go to **Sections** - you should see new sections created
2. Go to **Need Items** - you should see all extracted items
3. Go to your **Organization** - view the hierarchy

---

## Expected Results

### After Upload:
```json
{
  "id": 1,
  "uploaded_by": 1,
  "organization": 1,
  "file": "http://localhost:8000/media/needs_pdfs/hospital_needs.pdf",
  "uploaded_at": "2026-03-04T12:00:00Z",
  "status": "PENDING",
  "ai_extracted_json": null
}
```

### After AI Processing:
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
          "items": [...]
        }
      ]
    }
  }
}
```

### After Approval:
```json
{
  "message": "Successfully created 9 need items",
  "items_created": 9
}
```

---

## Troubleshooting

### Error: "OpenAI API key not configured"
**Solution**: Add `OPENAI_API_KEY` to your `.env` file

### Error: "Could not extract sufficient text from PDF"
**Solution**: 
- Make sure the PDF contains actual text (not just images)
- Use text-based PDFs, not scanned images
- Minimum 50 characters needed

### Error: "Permission denied"
**Solution**: Make sure you're logged in with an admin user

### Error: "Document must be processed before approval"
**Solution**: Run the `process_with_ai` endpoint first

### No sections created
**Solution**: 
- Check the AI extracted JSON - it should have sections
- Verify the document status is PROCESSED before approving
- Check server logs for errors

---

## Testing Different Priority Levels

The AI automatically categorizes items:

- **CRITICAL**: Emergency, life-saving, urgent items
- **ESSENTIAL**: Important operational items, medicines
- **NICE**: Comfort items, non-urgent supplies

Test with different wording:
- "URGENT", "CRITICAL", "EMERGENCY" → CRITICAL
- "NEEDED", "IMPORTANT", "ESSENTIAL" → ESSENTIAL
- "NICE TO HAVE", "IF POSSIBLE" → NICE

---

## Advanced Testing

### Test 1: Multiple Documents
Upload multiple documents for the same organization and verify sections are merged properly.

### Test 2: Different Organizations
Create multiple organizations and verify data isolation.

### Test 3: Large Documents
Test with PDF containing 50+ items to verify pagination.

### Test 4: Different Formats
Test various PDF formats and layouts.

### Test 5: Error Handling
- Upload empty PDF → should fail gracefully
- Process same document twice → should handle idempotently
- Approve without processing → should reject

---

## Viewing Results

### API Browsable Interface:
Visit `http://localhost:8000/api/` in your browser while logged in to explore the API interactively.

### Admin Panel:
- View all documents: `http://localhost:8000/admin/core/documentupload/`
- View sections: `http://localhost:8000/admin/core/section/`
- View needs: `http://localhost:8000/admin/core/needitem/`
- Filter by priority: Use filters on the right side

### Direct API Calls:
```bash
# All needs
curl http://localhost:8000/api/needs/

# Critical needs only
curl http://localhost:8000/api/needs/?priority=CRITICAL

# Organization hierarchy
curl http://localhost:8000/api/organizations/1/hierarchy/
```

---

## Performance Notes

- PDF processing: 2-5 seconds
- AI processing: 5-15 seconds (depends on document size)
- Total workflow: ~20 seconds for typical document

---

## Cost Considerations

OpenAI API costs (approximate):
- GPT-4o-mini: ~$0.01 per document
- GPT-3.5-turbo: ~$0.002 per document

For production, consider:
- Caching results
- Batch processing
- Using Celery for async processing
- Rate limiting

---

## Next Steps

After successful testing:
1. ✅ Implement frontend upload interface
2. ✅ Add real-time status updates
3. ✅ Create admin approval interface
4. ✅ Add document preview feature
5. ✅ Implement notification system
6. ✅ Add audit logging

---

## Questions?

Check:
- [README.md](README.md) - Setup and configuration
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details

Happy testing! 🚀
