# File Upload Error Messages - Quick Reference

## ✅ Improvements Made

The codebase now provides **helpful, actionable error messages** when file uploads fail, instead of cryptic errors.

---

## Error Scenarios & Messages

### 1. Wrong Content-Type (Most Common)

#### ❌ Before:
```json
{
    "detail": "Unsupported media type \"application/pdf\" in request."
}
```

#### ✅ After:
```json
{
    "error": "Invalid Content-Type",
    "message": "Received Content-Type: \"application/json\". For file uploads, you must use \"multipart/form-data\".",
    "help": {
        "issue": "You are using the wrong format to send files.",
        "wrong_approaches": [
            "❌ Don't use: Content-Type: application/json",
            "❌ Don't use: Content-Type: application/pdf",
            "❌ Don't send file path as string"
        ],
        "correct_approach": "✅ Use: Content-Type: multipart/form-data",
        "how_to_fix": {
            "curl": "Use -F flag: curl -F \"file=@document.pdf\"",
            "python_requests": "Use files parameter: requests.post(url, files={'file': open(...)}, data={...})",
            "postman": "Body tab → select \"form-data\"",
            "javascript": "Use FormData: form.append(\"file\", file);"
        }
    }
}
```

---

### 2. Missing File in Request

#### ✅ Error Message:
```json
{
    "error": "Missing file",
    "message": "No file was uploaded in the request.",
    "help": {
        "issue": "You need to include a PDF file in your request.",
        "solution": "Make sure you are using multipart/form-data format.",
        "examples": {
            "curl": "curl -X POST http://localhost:8000/api/documents/ -u username:password -F \"organization=1\" -F \"file=@document.pdf\"",
            "python": "requests.post(url, auth=(user, pass), files={\"file\": open(\"doc.pdf\", \"rb\")}, data={\"organization\": 1})",
            "postman": "Body tab → select \"form-data\" → add key \"file\" with type \"File\""
        }
    }
}
```

---

### 3. Missing Organization ID

#### ✅ Error Message:
```json
{
    "error": "Missing organization",
    "message": "Please specify which organization this document belongs to.",
    "help": {
        "solution": "Add \"organization\" field with the organization ID.",
        "example_curl": "curl ... -F \"organization=1\" -F \"file=@document.pdf\"",
        "example_python": "data = {\"organization\": 1}; requests.post(url, data=data, files=files)"
    }
}
```

---

### 4. Invalid File Type

#### ✅ Error Message:
```json
{
    "file": [
        "Invalid file type: 'document.docx'. Only PDF files are supported. Please upload a file with .pdf extension."
    ]
}
```

---

### 5. File Too Large

#### ✅ Error Message:
```json
{
    "file": [
        "File too large: 15.3MB. Maximum file size is 10MB. Please upload a smaller file."
    ]
}
```

---

### 6. File Too Small/Empty

#### ✅ Error Message:
```json
{
    "file": [
        "File too small. The PDF appears to be empty or corrupted. Please upload a valid PDF document."
    ]
}
```

---

## What Was Added to the Codebase

### 1. Enhanced Serializer Validation (`core/serializers.py`)

```python
class DocumentUploadSerializer(serializers.ModelSerializer):
    def validate_file(self, value):
        # ✅ Check file exists
        # ✅ Check file extension (.pdf only)
        # ✅ Check file size (max 10MB)
        # ✅ Check minimum size (not empty)
        # Shows helpful error messages for each case
        
    def validate_organization(self, value):
        # ✅ Check organization is provided
```

**Features:**
- ✅ File type validation (PDF only)
- ✅ File size validation (1KB - 10MB)
- ✅ Clear error messages
- ✅ Suggestions for fixing issues

---

### 2. Enhanced ViewSet (`core/views.py`)

```python
class DocumentUploadViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        # ✅ Check if file is in request
        # ✅ Check if organization is in request  
        # ✅ Check Content-Type header
        # ✅ Provide detailed help for each issue
```

**Features:**
- ✅ Detects missing file before processing
- ✅ Detects missing organization field
- ✅ Detects wrong Content-Type
- ✅ Provides code examples in error responses
- ✅ Shows correct usage for curl, Python, Postman, JavaScript

---

### 3. Custom Exception Handler (`core/exceptions.py`)

```python
def custom_exception_handler(exc, context):
    # ✅ Catches unsupported media type errors
    # ✅ Catches parse errors
    # ✅ Provides helpful explanations
    # ✅ Shows code examples
```

**Features:**
- ✅ Global error handling
- ✅ Consistent error format
- ✅ Educational responses
- ✅ Links to documentation

---

### 4. Configuration Update (`config/settings.py`)

```python
REST_FRAMEWORK = {
    ...
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}
```

---

## Testing the Improvements

### Test 1: Wrong Content-Type

**Command:**
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{"organization": 1, "file": "test.pdf"}'
```

**Result:** Detailed error with examples showing correct usage ✅

---

### Test 2: Missing File

**Command:**
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -F "organization=1"
```

**Result:** Clear message explaining file is required with examples ✅

---

### Test 3: Wrong File Type

**Command:**
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -F "organization=1" \
  -F "file=@document.docx"
```

**Result:** Clear message that only PDF files are accepted ✅

---

### Test 4: File Too Large

**Upload a 15MB PDF:**
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -F "organization=1" \
  -F "file=@large_file.pdf"
```

**Result:** Message showing file size and 10MB limit ✅

---

### Test 5: Correct Upload

**Command:**
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -F "organization=1" \
  -F "file=@hospital_needs.pdf"
```

**Result:** Success! Document uploaded ✅

---

## Benefits

### For Developers:
- ✅ **Faster debugging** - Know exactly what's wrong
- ✅ **Code examples** - See correct usage immediately
- ✅ **Multiple languages** - Examples for curl, Python, Postman, JS
- ✅ **Educational** - Learn the right way while debugging

### For API Users:
- ✅ **Self-service** - Fix issues without asking for help
- ✅ **Clear guidance** - Step-by-step instructions
- ✅ **Prevents mistakes** - Shows common pitfalls
- ✅ **Better UX** - Less frustration, faster development

---

## Summary

All file upload errors now provide:

1. **What went wrong** - Clear error description
2. **Why it happened** - Explanation of the issue
3. **How to fix it** - Specific solutions
4. **Code examples** - Working examples in multiple languages
5. **Common mistakes** - What NOT to do

**No more cryptic errors!** 🎉

---

## Quick Start After Changes

1. **Restart your server:**
   ```bash
   python manage.py runserver
   ```

2. **Test with correct format:**
   ```bash
   curl -X POST http://localhost:8000/api/documents/ \
     -u your_username:your_password \
     -F "organization=1" \
     -F "file=@hospital_needs.pdf"
   ```

3. **If you get an error**, read the error message carefully - it now includes:
   - What's wrong
   - How to fix it
   - Code examples for your tool (curl/Python/Postman/etc.)

That's it! Happy uploading! 🚀
