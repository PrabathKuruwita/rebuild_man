# API Documentation - Rebuild Backend

## Base URL
```
http://localhost:8000/api/
```

## Authentication

The API uses Session Authentication and Basic Authentication. To make authenticated requests:

1. **Session Auth**: Login through Django admin panel
2. **Basic Auth**: Send credentials in headers:
   ```
   Authorization: Basic <base64_encoded_credentials>
   ```

## Response Format

All responses are in JSON format:

### Success Response
```json
{
  "id": 1,
  "name": "Example",
  ...other fields
}
```

### Error Response
```json
{
  "detail": "Error message",
  "error": "Specific error information"
}
```

---

## Endpoints

### 1. Organizations

#### List Organizations
```http
GET /api/organizations/
```

**Response:**
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/organizations/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "National Hospital Colombo",
      "registration_number": "NH001",
      "district": "Colombo",
      "sections": [...]
    }
  ]
}
```

#### Create Organization
```http
POST /api/organizations/
```

**Permission:** Admin only

**Request Body:**
```json
{
  "name": "National Hospital Colombo",
  "registration_number": "NH001",
  "address": "123 Main Street, Colombo",
  "district": "Colombo",
  "admin_user": 1
}
```

#### Get Organization Details
```http
GET /api/organizations/{id}/
```

**Response:**
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
      "head_of_section": "Dr. Smith",
      "needs": [...]
    }
  ]
}
```

#### Get Organization Hierarchy
```http
GET /api/organizations/{id}/hierarchy/
```

Returns complete nested structure with sections and needs.

---

### 2. Sections

#### List Sections
```http
GET /api/sections/
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Emergency Ward",
      "head_of_section": "Dr. Smith",
      "needs": [...]
    }
  ]
}
```

#### Create Section
```http
POST /api/sections/
```

**Permission:** Org Admin or System Admin

**Request Body:**
```json
{
  "organization": 1,
  "name": "Emergency Ward",
  "head_of_section": "Dr. Smith"
}
```

---

### 3. Need Items

#### List Needs
```http
GET /api/needs/
```

**Query Parameters:**
- `priority` - Filter by priority (CRITICAL, ESSENTIAL, NICE)

**Examples:**
```http
GET /api/needs/?priority=CRITICAL
GET /api/needs/?priority=ESSENTIAL
```

**Response:**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "section": 1,
      "name": "Saline Bottles",
      "priority": "CRITICAL",
      "quantity_required": 100,
      "quantity_received": 50,
      "unit": "UNIT",
      "description": "500ml saline solution",
      "created_at": "2026-03-01T10:30:00Z"
    }
  ]
}
```

#### Create Need Item
```http
POST /api/needs/
```

**Permission:** Org Admin or System Admin

**Request Body:**
```json
{
  "section": 1,
  "name": "Saline Bottles",
  "priority": "CRITICAL",
  "quantity_required": 100,
  "quantity_received": 0,
  "unit": "UNIT",
  "description": "500ml saline solution"
}
```

**Field Options:**

- `priority`: `CRITICAL`, `ESSENTIAL`, `NICE`
- `unit`: `UNIT`, `BOX`, `KG`, `LITER`

#### Update Need Item
```http
PUT /api/needs/{id}/
PATCH /api/needs/{id}/
```

**Permission:** Org Admin or System Admin

**Example (Update quantity received):**
```json
{
  "quantity_received": 75
}
```

---

### 4. Document Upload & AI Processing

#### Upload Document
```http
POST /api/documents/
```

**Permission:** Authenticated users

**Request (multipart/form-data):**
```
organization: 1
file: <pdf_file>
```

**Response:**
```json
{
  "id": 1,
  "uploaded_by": 1,
  "organization": 1,
  "file": "http://localhost:8000/media/needs_pdfs/document.pdf",
  "uploaded_at": "2026-03-04T12:00:00Z",
  "status": "PENDING",
  "ai_extracted_json": null
}
```

#### Process Document with AI
```http
POST /api/documents/{id}/process_with_ai/
```

**Permission:** Document owner or Admin

**Response:**
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
              "description": "500ml saline solution"
            }
          ]
        }
      ]
    }
  }
}
```

**Status Flow:**
1. Upload → `PENDING`
2. Process → `PROCESSED` (or `FAILED`)
3. Approve → `APPROVED`

#### Approve and Create Needs
```http
POST /api/documents/{id}/approve_and_create_needs/
```

**Permission:** Admin or Org Admin only

**Response:**
```json
{
  "message": "Successfully created 5 need items",
  "items_created": 5
}
```

This endpoint:
1. Validates the user is an admin
2. Creates Section objects (if they don't exist)
3. Creates NeedItem objects from the AI-extracted data
4. Updates document status to `APPROVED`

#### List Documents
```http
GET /api/documents/
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "uploaded_by": 1,
      "organization": 1,
      "file": "http://localhost:8000/media/needs_pdfs/doc1.pdf",
      "uploaded_at": "2026-03-04T12:00:00Z",
      "status": "APPROVED",
      "ai_extracted_json": {...}
    }
  ]
}
```

---

## Permissions Summary

| Endpoint | Public | Donor | Org Admin | System Admin |
|----------|--------|-------|-----------|--------------|
| GET (List/Detail) | ✅ | ✅ | ✅ | ✅ |
| POST Organizations | ❌ | ❌ | ❌ | ✅ |
| POST Sections | ❌ | ❌ | ✅* | ✅ |
| POST Needs | ❌ | ❌ | ✅* | ✅ |
| POST Documents | ❌ | ✅ | ✅ | ✅ |
| Process AI | ❌ | ✅** | ✅** | ✅ |
| Approve Documents | ❌ | ❌ | ✅* | ✅ |

\* Org Admin can only modify their own organization's data  
\** Only document owner or admin

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production.

---

## CORS

The API allows requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Configure additional origins in `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourfrontend.com
```

---

## Example Workflow

### Complete Document Processing Flow

1. **Create Organization** (Admin)
```bash
POST /api/organizations/
{
  "name": "General Hospital",
  "registration_number": "GH001",
  "address": "456 Hospital Rd",
  "district": "Galle"
}
```

2. **Upload Document** (Org Admin)
```bash
POST /api/documents/
- organization: 1
- file: needs_list.pdf
```

3. **Process with AI**
```bash
POST /api/documents/1/process_with_ai/
```

4. **Review extracted data** (in response)

5. **Approve and Create Needs** (Admin)
```bash
POST /api/documents/1/approve_and_create_needs/
```

6. **View created needs**
```bash
GET /api/organizations/1/hierarchy/
```

---

## Testing with cURL

### List Organizations
```bash
curl http://localhost:8000/api/organizations/
```

### Create Need (Basic Auth)
```bash
curl -X POST http://localhost:8000/api/needs/ \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{
    "section": 1,
    "name": "Medical Masks",
    "priority": "CRITICAL",
    "quantity_required": 500,
    "unit": "BOX"
  }'
```

### Upload Document
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -u admin:password \
  -F "organization=1" \
  -F "file=@needs.pdf"
```

---

## WebSocket Support (Future)

Real-time updates for need fulfillment will be added in future versions.

---

## GraphQL Support (Future)

GraphQL endpoint planned for more flexible queries.

---

For more details, visit the [README](README.md) or Django Admin Browsable API at:
```
http://localhost:8000/api/
```
