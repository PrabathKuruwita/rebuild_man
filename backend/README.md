# Rebuild Backend - Django REST API

A Django REST Framework backend for disaster relief and donation management system focused on hospitals and organizations.

## 🚀 Features

- ✅ **CORS Configuration** - Configured for frontend integration
- ✅ **Media Files Setup** - File upload support for documents
- ✅ **REST Framework Configuration** - Pagination, filtering, and authentication
- ✅ **Role-Based Permissions** - Admin, Org Admin, and Donor roles
- ✅ **AI/OCR Integration** - Automated document processing with Google Gemini
- ✅ **PostgreSQL Database** - Running via Docker Compose
- ✅ **Environment Variables** - Secure configuration management

## 📋 Prerequisites

- Python 3.10+
- PostgreSQL (via Docker)
- Google Gemini API Key (for AI document processing) - Get it free from https://makersuite.google.com/app/apikey

## 🛠️ Installation

### 1. Clone the repository

```bash
cd backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/Mac
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Copy the example environment file:
```bash
copy .env.example .env  # On Windows
# cp .env.example .env  # On Linux/Mac
```

Edit `.env` and add your configurations:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=rebuild_db
DB_USER=postgres
DB_PASSWORD=admin1234
DB_HOST=localhost
DB_PORT=5433
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
```

### 5. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

### 6. Run migrations

```bash
python manage.py migrate
```

### 7. Create a superuser

```bash
python manage.py createsuperuser
```

### 8. Run the development server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000`

## 📚 API Endpoints

### Authentication
- Admin Panel: `http://localhost:8000/admin/`

### Organizations
- `GET /api/organizations/` - List all organizations
- `POST /api/organizations/` - Create new organization (Admin only)
- `GET /api/organizations/{id}/` - Get organization details
- `PUT /api/organizations/{id}/` - Update organization (Admin only)
- `DELETE /api/organizations/{id}/` - Delete organization (Admin only)
- `GET /api/organizations/{id}/hierarchy/` - Get organization with nested sections and needs

### Sections
- `GET /api/sections/` - List all sections
- `POST /api/sections/` - Create new section (Org Admin only)
- `GET /api/sections/{id}/` - Get section details
- `PUT /api/sections/{id}/` - Update section (Org Admin only)
- `DELETE /api/sections/{id}/` - Delete section (Org Admin only)

### Needs
- `GET /api/needs/` - List all needs
- `GET /api/needs/?priority=CRITICAL` - Filter needs by priority
- `POST /api/needs/` - Create new need (Org Admin only)
- `GET /api/needs/{id}/` - Get need details
- `PUT /api/needs/{id}/` - Update need (Org Admin only)
- `DELETE /api/needs/{id}/` - Delete need (Org Admin only)

### Document Processing (AI/OCR)
- `GET /api/documents/` - List all uploaded documents
- `POST /api/documents/` - Upload a new document (Authenticated users)
- `GET /api/documents/{id}/` - Get document details
- `POST /api/documents/{id}/process_with_ai/` - Process document with AI
- `POST /api/documents/{id}/approve_and_create_needs/` - Approve and create needs (Admin only)

## 🔐 Permissions

### User Roles

1. **ADMIN** - System Administrator
   - Full access to all resources
   - Can create/edit/delete organizations, sections, and needs
   - Can approve AI-processed documents

2. **ORG_ADMIN** - Organization Administrator
   - Can manage their own organization's data
   - Can create/edit sections and needs for their organization
   - Can upload and process documents

3. **DONOR** - Regular Donor
   - Read-only access to organizations, sections, and needs
   - Can create donation records (future feature)

## 🤖 AI Document Processing

The system uses Google Gemini's AI model to extract structured data from uploaded PDF documents.

### Workflow:

1. **Upload Document**: Organization admin uploads a PDF containing needs
```bash
POST /api/documents/
{
  "organization": 1,
  "file": <pdf_file>
}
```

2. **Process with AI**: Trigger AI processing
```bash
POST /api/documents/{id}/process_with_ai/
```

The AI will:
- Extract text from the PDF
- Identify need items with priorities
- Categorize items into sections
- Structure data as JSON

3. **Review**: Admin reviews the extracted data in the response

4. **Approve and Create**: Admin approves and creates actual NeedItem entries
```bash
POST /api/documents/{id}/approve_and_create_needs/
```

### Document Status Flow:
- `PENDING` → `PROCESSED` → `APPROVED`
- Or: `PENDING` → `FAILED`

## 🗄️ Data Models

### User
Custom user model with roles (ADMIN, ORG_ADMIN, DONOR)

### Organization
Represents hospitals or relief organizations
- name, registration_number, address, district
- Linked to an admin user

### Section
Departments within organizations (e.g., "Emergency Ward", "Kitchen")
- Belongs to an Organization

### NeedItem
Priority-based needs (CRITICAL, ESSENTIAL, NICE)
- Tracks quantity required vs quantity received
- Belongs to a Section

### DocumentUpload
PDF documents for AI processing
- Tracks processing status
- Stores AI-extracted JSON

## 🔧 Configuration

### CORS Settings
Configure allowed origins in `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://yourfrontend.com
```

### Media Files
Uploaded files are stored in:
- Directory: `backend/media/needs_pdfs/`
- URL: `http://localhost:8000/media/needs_pdfs/`

### REST Framework
- Pagination: 20 items per page
- Authentication: Session + Basic Auth
- Permissions: IsAuthenticatedOrReadOnly (default)

## 🧪 Testing

```bash
python manage.py test
```

## 📦 Database Backup

```bash
# Export
python manage.py dumpdata > backup.json

# Import
python manage.py loaddata backup.json
```

## 🐳 Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f

# Reset database
docker-compose down -v
docker-compose up -d
python manage.py migrate
```

## 🚨 Common Issues

### Issue: Database connection error
**Solution**: Ensure Docker PostgreSQL is running: `docker-compose up -d`

### Issue: Gemini API error
**Solution**: Check your `GEMINI_API_KEY` in `.env` file. Get a free key from https://makersuite.google.com/app/apikey

### Issue: Permission denied errors
**Solution**: Ensure your user has the correct role (Admin/Org Admin)

### Issue: CORS errors from frontend
**Solution**: Add your frontend URL to `CORS_ALLOWED_ORIGINS` in `.env`

## 📝 Development Notes

### Adding New Endpoints
1. Create view in `core/views.py`
2. Register in `core/urls.py`
3. Add permissions from `core/permissions.py`

### Modifying Models
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Sample Data
Use Django admin panel at `http://localhost:8000/admin/`

## 🔮 Future Enhancements

- [ ] Authentication endpoints (JWT/OAuth)
- [ ] Donation tracking system
- [ ] Real-time notifications (WebSockets)
- [ ] Celery for background AI processing
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Mobile app API support

## 📄 License

MIT License

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📞 Support

For issues or questions, please create an issue in the repository.
