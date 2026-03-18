# NeedTracker — Rebuild Man Project

A full-stack web application for tracking organisational needs, managing sections, and coordinating resource allocation across multiple organisations.

---

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Backend  | Django 6.x · Django REST Framework · PostgreSQL (Docker)     |
| Frontend | Next.js 15 · TypeScript · Tailwind CSS v4                    |
| Auth     | Django session / token (role-based: Admin, Org Admin, Donor) |

---

## Project Structure

```
rebuild_man_project/
├── backend/                  # Django REST API
│   ├── config/               # Project settings, URLs, WSGI/ASGI
│   ├── core/                 # Main app — models, serializers, views, URLs
│   │   └── migrations/       # Database migrations
│   ├── manage.py
│   └── requirements.txt
└── frontend/                 # Next.js application
    ├── app/                  # App Router pages
    │   ├── documents/        # Document upload page
    │   ├── needs/            # Needs listing page
    │   └── organizations/    # Organisation CRUD pages
    ├── components/           # Reusable React components
    └── lib/
        └── api.ts            # Centralised API client
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker Desktop
- Git

---

### Backend Setup

```bash
cd backend

# Start PostgreSQL via Docker
docker compose up -d

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

Database defaults are configured for Docker PostgreSQL:

- Host: `localhost`
- Port: `5433`
- Database: `rebuild_db`
- User: `postgres`
- Password: `admin1234`

You can override these via environment variables (`USE_POSTGRES`, `POSTGRES_*`). See `backend/.env.example`.

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| GET    | `/api/organizations/`     | List all organisations    |
| POST   | `/api/organizations/`     | Create an organisation    |
| GET    | `/api/organizations/:id/` | Retrieve an organisation  |
| PUT    | `/api/organizations/:id/` | Update an organisation    |
| DELETE | `/api/organizations/:id/` | Delete an organisation    |
| GET    | `/api/sections/`          | List all sections         |
| POST   | `/api/sections/`          | Create a section          |
| GET    | `/api/needs/`             | List all need items       |
| POST   | `/api/needs/`             | Create a need item        |
| GET    | `/api/documents/`         | List all document uploads |
| POST   | `/api/documents/`         | Upload a document         |

---

## Features

- **Organisations** — Create, view, edit, and delete organisations
- **Sections** — Add, edit, and delete sections within an organisation
- **Needs** — Track need items per section with priority, quantity, and status
- **Documents** — Upload supporting documents per organisation
- **Filtering** — Filter needs by priority level
- **Responsive UI** — Mobile-friendly layout with Tailwind CSS

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## Branch Strategy

| Branch        | Purpose                      |
| ------------- | ---------------------------- |
| `main`        | Production-ready code        |
| `sadev`       | Sadev's development branch   |
| `dev-dilhan`  | Dilhan's development branch  |
| `dev-pasindu` | Pasindu's development branch |

---

## License

This project is for internal/educational use under the Rebuild Man initiative.
