# NeedTracker — Rebuild Man Project

> A full-stack web application for tracking organisational needs, managing sections, and coordinating resource and donation allocation across multiple organisations in Sri Lanka.

[![CI/CD Pipeline](https://github.com/ravindudilhan/rebuild_man/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ravindudilhan/rebuild_man/actions/workflows/ci-cd.yml)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Django](https://img.shields.io/badge/Django-5.1-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![Kubernetes](https://img.shields.io/badge/Kubernetes-k3s-326CE5)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development (Manual)](#local-development-manual)
  - [Docker (Recommended)](#docker-recommended)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [CI/CD Pipeline](#cicd-pipeline)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Branch Strategy](#branch-strategy)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Key Features at a Glance

### 🔐 Authentication & Access Control
- JWT-based login with **automatic token refresh** on expiry
- Login via **username or email**
- **3-tier role system** — `ADMIN`, `ORG_ADMIN`, `DONOR`
- Org Admin **registration approval workflow** (Pending → Approved / Rejected)
- Secure **email-based password reset** with 1-hour token expiry
- Org Admins can **invite additional admins** to their organisation (sends email)
- Route-level protection on both frontend and backend

### 🏥 Organisation & Need Management
- Full **CRUD for Organisations** with type, district, address, geo-coordinates, contact info
- **Section management** within organisations (head of section, metadata)
- **Need tracking** per section — priority levels (`CRITICAL`, `ESSENTIAL`, `NICE TO HAVE`), quantity required vs. received, units (`UNIT`, `BOX`, `KG`, `LITER`)
- **Organisation hierarchy API** — retrieve a full org → sections → needs tree in one request
- Role-scoped data visibility: Org Admins only see their own organisation's data

### 💝 Donation Lifecycle
- **Private and Government donor flows** with distinct form fields
- Full donation status lifecycle: `PENDING` → `CONFIRMED` → `FULFILLED` / `CANCELLED`
- Confirm, cancel (with reason), and receive/fulfil actions per donation
- Optional **donation letter file upload**
- **Public recent donations feed** — visible without authentication
- Automatically tracks `quantity_received` against `quantity_required` per need item

### 🤖 AI-Powered Document Processing
- Upload PDF documents per organisation
- Trigger **Google Gemini AI** + **PyTesseract OCR** extraction pipeline
- AI extracts structured need items from uploaded documents
- Admin **reviews and approves** AI output before it creates actual `NeedItem` records
- Document statuses: `PENDING` → `PROCESSED` → `APPROVED` / `FAILED`

### 🔍 Search & Discovery
- **Cross-entity search** across organisations and needs from a single endpoint
- Filter by `priority`, `org_type`, pagination (`limit`, `offset`)
- Exclude fulfilled needs from results with `exclude_fulfilled=true`
- **System-wide statistics** endpoint: provinces covered, verified hospitals, donors onboarded, delivery success rate

### 📧 Email Notifications
- Org Admin **approval email** with login link and account details
- Org Admin **rejection email** with reason (sent before account deletion)
- **Admin invitation email** with temporary credentials when inviting co-admins
- **Password reset email** with secure tokenised link

### 🐳 Docker & Local Dev
- Single command startup: `docker-compose up --build`
- **3-service stack**: PostgreSQL, Django backend, Next.js frontend
- Health checks — backend waits for DB to be ready before starting
- **Volume persistence** — data and media files survive container restarts
- Dev startup scripts for PowerShell and CMD (`dev-start.ps1`, `dev-start.bat`)

### 🚀 CI/CD & Kubernetes
- **7-stage GitHub Actions pipeline**: test → lint → build → Trivy security scan → Docker push → K8s deploy
- **Trivy vulnerability scanning** (HIGH/CRITICAL) on every pull request
- Automatic **Docker Hub image push** tagged with both `:latest` and commit SHA
- **Rolling deployment** to k3s with zero-downtime strategy (`maxUnavailable: 0`)
- **Kubernetes Secrets** injection — no credentials in manifests
- Production URL: **`https://rebuild-app.duckdns.org`**

### 📊 Monitoring & Observability
- **Prometheus metrics** exposed at `/metrics` via `django-prometheus`
- Metrics cover: HTTP request counts & latency, DB query performance, model events
- **Grafana dashboard** at `https://grafana.rebuild-app.duckdns.org`
- Prometheus scrapes: Django backend, Kubernetes node exporter, kube-state-metrics

---

## Tech Stack

| Layer       | Technology                                                              |
| ----------- | ----------------------------------------------------------------------- |
| **Backend** | Django 5.1 · Django REST Framework 3.15 · PostgreSQL 15                 |
| **Frontend**| Next.js 15 · TypeScript · Tailwind CSS v4                               |
| **Auth**    | JWT (SimpleJWT) · Role-based: `ADMIN`, `ORG_ADMIN`, `DONOR`            |
| **AI**      | Google Gemini (`google-generativeai`) · PyTesseract OCR · PyPDF2        |
| **DevOps**  | Docker · Docker Compose · GitHub Actions · k3s Kubernetes               |
| **Monitoring** | Prometheus · Grafana · `django-prometheus` · Node Exporter           |
| **Email**   | Django SMTP (Gmail) — password reset, approval/rejection notifications  |

---

## Architecture

```
                         ┌──────────────────────────────────────┐
                         │            Browser / Client           │
                         └────────────────┬─────────────────────┘
                                          │
                         ┌────────────────▼─────────────────────┐
                         │      Next.js Frontend (:3000)         │
                         │   App Router · TypeScript · Tailwind  │
                         └────────────────┬─────────────────────┘
                                          │ REST API (JWT)
                         ┌────────────────▼─────────────────────┐
                         │      Django Backend (:8000)           │
                         │   DRF · JWT Auth · Gemini AI · SMTP   │
                         └──────┬──────────────────┬────────────┘
                                │ SQL               │ /metrics
                   ┌────────────▼──────┐   ┌────────▼───────────┐
                   │  PostgreSQL (:5433)│   │  Prometheus + Grafana│
                   │  (Docker / K8s)   │   │  (monitoring ns)    │
                   └───────────────────┘   └─────────────────────┘
```

**Production (K8s — `rebuild-app.duckdns.org`):**

```
Internet → Traefik Ingress → frontend (svc:3000)
                           → /api/**  → backend (svc:8000)
                           → /metrics → backend (svc:8000)
grafana.rebuild-app.duckdns.org → Grafana (monitoring ns)
```

---

## Features

### Frontend

| Feature | Description |
|---|---|
| **Authentication** | JWT login with auto-refresh on 401, login by username **or** email |
| **Role-based Dashboards** | Separate views for `ADMIN`, `ORG_ADMIN`, and `DONOR` |
| **Organization Management** | Full CRUD — create, view, edit, delete organisations with geo-coordinates |
| **Section Management** | Add / edit / delete sections within an organisation |
| **Need Tracking** | Track needs per section — priority (`CRITICAL`, `ESSENTIAL`, `NICE`), quantity, unit |
| **Donation System** | Private & government donor flows, confirmation, cancellation, receipt lifecycle |
| **Document Upload & AI** | Upload PDFs → trigger Gemini AI processing → approve extracted need items |
| **Search** | Cross-entity search across organisations and needs with filters |
| **Public Donations Feed** | Public view of recent donations without authentication |
| **Impact Page** | System-wide stats: provinces covered, hospitals, donors, delivery rate |
| **Profile Management** | Users can update profile info and change password |
| **Password Reset** | Email-based forgot-password / reset flow |
| **Org Admin Approval** | Registration requests with admin approve/reject workflow |
| **Admin Panel** | Approve/reject org admin registrations, manage donors |
| **Responsive Design** | Mobile-friendly layout with Tailwind CSS |

### Backend

| Feature | Description |
|---|---|
| **REST API** | Full Django REST Framework with viewsets and custom actions |
| **JWT Authentication** | `djangorestframework-simplejwt` with custom claims (role embedded in token) |
| **3-Level RBAC** | `ADMIN` (global), `ORG_ADMIN` (own org only), `DONOR` (read + donate) |
| **Org Admin Approval Workflow** | Pending → Approved/Rejected with email notifications |
| **AI Document Processing** | Google Gemini + PyTesseract OCR + PyPDF2 pipeline |
| **Email Notifications** | SMTP via Gmail — approval, rejection, invitation, password reset |
| **Password Reset** | Secure token-based reset with 1-hour expiry |
| **Prometheus Metrics** | `/metrics` endpoint via `django-prometheus` |
| **Pagination** | DRF pagination with `results` envelope, handled gracefully on frontend |
| **CORS** | `django-cors-headers` configured for local and production origins |
| **Media Files** | Uploaded documents persisted in `media/` volume |
| **Celery + Redis** | Included in dependencies for optional async background tasks |

### Database

| Feature | Description |
|---|---|
| **PostgreSQL 15** | Primary database — containerised in Docker and K8s |
| **21 Migrations** | All applied and tracked in version control |
| **Volume Persistence** | Data survives container restarts via named Docker/K8s volumes |
| **Health Checks** | `pg_isready` probe in Docker Compose and Kubernetes |
| **Relationships** | Org → Sections → Needs → Donations; User → Organisation |

### DevOps

| Feature | Description |
|---|---|
| **Docker Compose** | 3-service stack (db, backend, frontend) with health checks and network isolation |
| **Multi-stage Builds** | Optimised Docker images for backend and frontend |
| **GitHub Actions CI/CD** | Automated test → security scan → Docker build → push → K8s deploy |
| **Trivy Scanning** | Vulnerability scan (HIGH/CRITICAL) and infrastructure policy check on every PR |
| **K8s (k3s)** | Production deployment with rolling-update strategy, secrets from K8s Secrets |
| **Traefik Ingress** | HTTP/HTTPS routing in production cluster |
| **Prometheus + Grafana** | Live metrics for Django backend, node, and kube-state |

---

## Project Structure

```
rebuild_man/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # GitHub Actions — test, scan, build, push, deploy
│
├── k8s/                            # Kubernetes manifests (namespace: rikili001)
│   ├── backend.yaml                # Deployment + Service (reads K8s Secrets)
│   ├── frontend.yaml               # Deployment + Service
│   ├── postgres.yaml               # StatefulSet + PVC + Service
│   ├── ingress.yaml                # Traefik Ingress (rebuild-app.duckdns.org)
│   ├── grafana-ingress.yaml        # Grafana ingress (grafana.rebuild-app.duckdns.org)
│   └── prometheus-scrape-config.yaml # Prometheus ConfigMap (scrapes Django /metrics)
│
├── backend/                        # Django REST API
│   ├── config/                     # Project settings, URLs, WSGI/ASGI
│   │   ├── settings.py             # JWT, CORS, DB, email, Prometheus config
│   │   └── urls.py
│   ├── core/                       # Main application
│   │   ├── models.py               # User, Organisation, Section, NeedItem, DocumentUpload, Donation
│   │   ├── views.py                # ViewSets + auth views (login, register, approval, reset)
│   │   ├── serializers.py          # All DRF serializers
│   │   ├── serializers_jwt.py      # Custom JWT token claims
│   │   ├── permissions.py          # IsAdminOrReadOnly, IsAdminUser, IsOrgAdminOfThisOrg
│   │   ├── ai_service.py           # Gemini AI + OCR document processor
│   │   └── migrations/             # 21 database migrations
│   ├── Dockerfile                  # Multi-stage Django image (Python 3.12)
│   ├── entrypoint.sh               # Auto-migrate + create default admin on startup
│   ├── requirements.txt
│   └── .env.example                # All supported environment variables
│
├── frontend/                       # Next.js 15 application
│   ├── app/                        # App Router pages
│   │   ├── page.tsx                # Landing / home page
│   │   ├── login/                  # Login page
│   │   ├── admin/                  # Admin dashboard (approval management, donors)
│   │   ├── org-admin/              # Org Admin dashboard
│   │   ├── organizations/          # Organisation CRUD pages
│   │   ├── needs/                  # Needs listing and management
│   │   ├── documents/              # Document upload and AI processing
│   │   ├── search/                 # Search page
│   │   ├── impact/                 # Impact / stats page
│   │   ├── profile/                # User profile
│   │   ├── forgot-password/        # Password reset request
│   │   ├── reset-password/         # Password reset confirm
│   │   ├── about/                  # About page
│   │   ├── contact/                # Contact page
│   │   ├── terms/                  # Terms of service
│   │   └── privacy/                # Privacy policy
│   ├── components/                 # Reusable React components
│   ├── lib/
│   │   ├── api.ts                  # Centralised API client (JWT auto-refresh on 401)
│   │   ├── AuthContext.tsx         # Global auth state + token management
│   │   └── useAuthGuard.ts         # Route protection hook
│   ├── Dockerfile                  # Multi-stage Next.js image (Node 22)
│   └── next.config.ts              # API proxy rewrites
│
├── docker-compose.yml              # Production-style 3-service stack
├── docker-compose.dev.yml          # Dev overrides
├── dev-start.ps1 / dev-start.bat   # Quick local dev startup scripts
├── run-docker.ps1 / run-docker.bat # Docker startup scripts
├── setup-manual.ps1                # Full automated local setup
└── docs/                           # Additional documentation
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| Node.js | 18+ (22 recommended) |
| Docker Desktop | Latest |
| Git | Any |

---

### Local Development (Manual)

#### 1. Backend

```bash
cd backend

# Start PostgreSQL via Docker
docker compose up -d

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Create default admin (optional — entrypoint.sh does this in Docker)
python manage.py create_default_admin

# Start development server
python manage.py runserver
```

API available at: **`http://localhost:8000/api/`**

Default DB (Docker PostgreSQL):

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `rebuild_db` |
| User | `postgres` |
| Password | `admin1234` |

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend available at: **`http://localhost:3000`**

---

### Docker (Recommended)

#### First run (builds images from source):

```bash
docker-compose up --build
```

#### Subsequent runs:

```bash
docker-compose up
```

#### Useful Docker commands:

```bash
# View all running services
docker-compose ps

# Tail logs for a specific service
docker-compose logs -f backend

# Restart a single service after code change
docker-compose restart backend

# Rebuild a single service after dependency change
docker-compose up --build backend

# Full reset (removes volumes — deletes all data)
docker-compose down -v && docker-compose up --build
```

Access points after startup:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin |
| Prometheus Metrics | http://localhost:8000/metrics |

**Default credentials:** `admin` / `Admin@1234`

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values.

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | (required in prod) |
| `DEBUG` | Enable debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `DB_NAME` | PostgreSQL database name | `rebuild_db` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `admin1234` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `FRONTEND_URL` | Frontend base URL for email links | `http://localhost:3000` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USE_TLS` | Enable TLS | `True` |
| `EMAIL_HOST_USER` | SMTP email address | (required for email) |
| `EMAIL_HOST_PASSWORD` | SMTP app password | (required for email) |
| `DEFAULT_FROM_EMAIL` | Sender address | Same as `EMAIL_HOST_USER` |
| `GEMINI_API_KEY` | Google Gemini API key | (required for AI features) |

Frontend (`.env.local`):

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL visible to browser | `/api` (Docker) or `http://localhost:8000/api` (local) |
| `BACKEND_URL` | Server-side backend URL (Next.js rewrites) | `http://backend:8000` |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login/` | None | Login (username or email) — returns JWT tokens |
| `POST` | `/api/auth/register/` | None | Register as Donor |
| `POST` | `/api/auth/register-org-admin/` | None | Register as Org Admin (requires approval) |
| `POST` | `/api/auth/refresh/` | None | Refresh access token |
| `GET` | `/api/auth/me/` | JWT | Get current user profile |
| `PATCH` | `/api/auth/me/` | JWT | Update profile / change password |
| `POST` | `/api/auth/forgot-password/` | None | Request password reset email |
| `POST` | `/api/auth/reset-password/` | None | Confirm password reset with token |

### Admin — Org Admin Approvals

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/approvals/` | ADMIN | List pending approval requests |
| `GET` | `/api/admin/approvals/{id}/` | ADMIN | Get single approval request |
| `POST` | `/api/admin/approvals/{id}/approve/` | ADMIN | Approve registration + send email |
| `POST` | `/api/admin/approvals/{id}/reject/` | ADMIN | Reject registration + send email + delete account |
| `GET` | `/api/admin/approvals/approved_list/` | ADMIN | List approved org admins |
| `GET` | `/api/admin/approvals/rejected_list/` | ADMIN | List rejected org admins |

### Organisations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/organizations/` | Public | List all organisations |
| `POST` | `/api/organizations/` | ADMIN / ORG_ADMIN | Create an organisation |
| `GET` | `/api/organizations/{id}/` | Public | Retrieve an organisation |
| `PATCH` | `/api/organizations/{id}/` | ADMIN / ORG_ADMIN | Update an organisation |
| `DELETE` | `/api/organizations/{id}/` | ADMIN | Delete an organisation |
| `GET` | `/api/organizations/{id}/hierarchy/` | Public | Full org → sections → needs tree |
| `GET` | `/api/organizations/{id}/admins/` | ORG_ADMIN | List admins of this org |
| `POST` | `/api/organizations/{id}/invite_admin/` | ORG_ADMIN | Invite another admin (sends email) |

### Sections

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sections/` | Public | List sections |
| `POST` | `/api/sections/` | ADMIN / ORG_ADMIN | Create a section |
| `GET` | `/api/sections/{id}/` | Public | Retrieve a section |
| `PATCH` | `/api/sections/{id}/` | ADMIN / ORG_ADMIN | Update a section |
| `DELETE` | `/api/sections/{id}/` | ADMIN / ORG_ADMIN | Delete a section |

### Needs

| Method | Endpoint | Auth | Query Params | Description |
|---|---|---|---|---|
| `GET` | `/api/needs/` | Public | `priority`, `exclude_fulfilled` | List need items |
| `POST` | `/api/needs/` | ADMIN / ORG_ADMIN | | Create a need item |
| `GET` | `/api/needs/{id}/` | Public | | Retrieve a need item |
| `PATCH` | `/api/needs/{id}/` | ADMIN / ORG_ADMIN | | Update a need item |
| `DELETE` | `/api/needs/{id}/` | ADMIN / ORG_ADMIN | | Delete a need item |

### Documents & AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/documents/` | ADMIN / ORG_ADMIN | List uploaded documents |
| `POST` | `/api/documents/` | ADMIN / ORG_ADMIN | Upload a document (`multipart/form-data`) |
| `POST` | `/api/documents/{id}/process_with_ai/` | ADMIN / ORG_ADMIN | Run Gemini AI extraction |
| `POST` | `/api/documents/{id}/approve_and_create_needs/` | ADMIN / ORG_ADMIN | Approve AI output → create NeedItems |

### Donations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/donations/` | JWT | List donations (role-filtered) |
| `POST` | `/api/donations/` | JWT | Create a donation pledge |
| `GET` | `/api/donations/{id}/` | JWT | Get a donation |
| `PATCH` | `/api/donations/{id}/` | JWT | Update a donation |
| `DELETE` | `/api/donations/{id}/` | ADMIN | Delete a donation |
| `POST` | `/api/donations/{id}/confirm/` | ADMIN / ORG_ADMIN | Confirm a donation |
| `POST` | `/api/donations/{id}/cancel/` | ADMIN / ORG_ADMIN | Cancel a donation |
| `POST` | `/api/donations/{id}/receive/` | ADMIN / ORG_ADMIN | Mark donation as received |
| `GET` | `/api/donations/public_recent/` | Public | Recent donations (public feed) |

### Other Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/donors/` | ADMIN | List all donor users |
| `GET` | `/api/search/` | Public | Cross-entity search (`q`, `type`, `priority`, `org_type`) |
| `GET` | `/api/stats/` | Public | System stats (provinces, hospitals, donors, delivery rate) |
| `GET` | `/metrics` | Public | Prometheus metrics (Django, DB, requests) |

---

## CI/CD Pipeline

The pipeline is defined in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) and runs on every push to `main` and every pull request.

```
Push / PR to main
      │
      ├─► backend-test          (Python 3.12, Django check + manage.py test, live Postgres)
      ├─► frontend-test         (Node 22, npm ci, ESLint, next build)
      │
      └─── (both pass) ─────────────────────────────────────────────────────────────────┐
                                                                                        │
            ├─► trivy-vulnerability-scan   (HIGH/CRITICAL deps — backend + frontend)   │
            └─► trivy-policy-check         (Dockerfile + infra misconfig scan)         │
                                                                                        │
                    (all pass, push to main only) ──────────────────────────────────────┤
                                                                                        │
                          ├─► docker-build     (builds backend + frontend images)      │
                          └─► push-images      (push to Docker Hub as :latest + :sha)  │
                                                                                        │
                                    (push-images done) ─────────────────────────────────┘
                                                                                        │
                                          └─► deploy-k3s  (kubectl apply k8s manifests,
                                                            rolling update with new SHA tag,
                                                            apply Prometheus scrape config,
                                                            apply Grafana ingress)
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DB_PASSWORD` | PostgreSQL password used in test job |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `DJANGO_SECRET_KEY` | Django secret key for production |
| `KUBECONFIG` | Base64-encoded kubeconfig for production k3s cluster |
| `EMAIL_HOST_USER` | SMTP email address |
| `EMAIL_HOST_PASSWORD` | SMTP app password |

---

## Kubernetes Deployment

Production runs on a self-hosted **k3s** cluster under namespace `rikili001`.

**Public URL:** `https://rebuild-app.duckdns.org`

### Manifests Overview

| File | Resource | Description |
|---|---|---|
| `k8s/postgres.yaml` | StatefulSet + PVC + Service | PostgreSQL with persistent volume |
| `k8s/backend.yaml` | Deployment + Service | Django app, pulls secrets from K8s Secrets |
| `k8s/frontend.yaml` | Deployment + Service | Next.js app, rolling update strategy |
| `k8s/ingress.yaml` | Ingress (Traefik) | Routes `/api` → backend, `/` → frontend |
| `k8s/grafana-ingress.yaml` | Ingress (Traefik) | Routes `grafana.rebuild-app.duckdns.org` → Grafana |
| `k8s/prometheus-scrape-config.yaml` | ConfigMap | Prometheus scrape jobs for Django, node, kube-state |

### Manual Deployment

```bash
# Apply all at once
kubectl apply -f k8s/

# Or individually
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/grafana-ingress.yaml
kubectl apply -f k8s/prometheus-scrape-config.yaml

# Check status
kubectl get pods -n rikili001
kubectl get ingress -n rikili001
```

### K8s Secrets (created by CI or manually)

```bash
kubectl create secret generic backend-secrets \
  --from-literal=SECRET_KEY="your-secret-key" \
  --from-literal=DB_PASSWORD="your-db-password" \
  --from-literal=EMAIL_HOST_USER="your@email.com" \
  --from-literal=EMAIL_HOST_PASSWORD="your-app-password" \
  --from-literal=DEFAULT_FROM_EMAIL="your@email.com" \
  -n rikili001
```

---

## Monitoring & Observability

### Prometheus

Prometheus is deployed in the `monitoring` namespace and scrapes three targets:

| Job | Target | Interval |
|---|---|---|
| `django-backend` | `backend.rikili001.svc.cluster.local:8000/metrics` | 30s |
| `node-exporter` | `prometheus-prometheus-node-exporter.monitoring:9100` | 15s |
| `kube-state-metrics` | `prometheus-kube-state-metrics.monitoring:8080` | 15s |

Prometheus metrics are exposed by `django-prometheus` and include:
- HTTP request counts and latency by view/method/status
- Database query counts and latency
- Django model creation/deletion events

### Grafana

Grafana is available at: `https://grafana.rebuild-app.duckdns.org`

Dashboards can be built from the Prometheus data source to visualise:
- Request throughput and error rates
- Database performance
- Node CPU / memory usage
- Kubernetes pod health

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code — triggers full CI/CD and K8s deployment |
| `sadev` | Sadev's development branch |
| `dev-dilhan` | Dilhan's development branch |
| `dev-pasindu` | Pasindu's development branch |

> **Note:** Only merges into `main` trigger Docker image pushes and Kubernetes deployment.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes using conventional commits: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`

CI will automatically run tests, lint, and security scans on your PR.

---

## Production Checklist

Before going live, ensure:

- [ ] `SECRET_KEY` is a unique, randomly generated value
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` set to your actual domain
- [ ] CORS origins locked to production frontend URL
- [ ] All K8s Secrets populated (no defaults)
- [ ] HTTPS / TLS configured via Traefik or cert-manager
- [ ] Database backups scheduled
- [ ] Prometheus and Grafana dashboards set up
- [ ] Email SMTP credentials verified
- [ ] Gemini AI API key configured

---

## System Requirements

### Minimum (Docker Compose local)

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB |
| Disk | 2 GB free | 5 GB free |
| CPU | 2 cores | 4+ cores |

> First Docker build downloads ~1 GB of base images and takes 5–10 minutes. Subsequent builds are fast due to layer caching.

---

## License

This project is for internal and educational use under the **Rebuild Man** initiative.
