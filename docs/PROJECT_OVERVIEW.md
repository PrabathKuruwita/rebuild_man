# Rebuild Management Project - Full Overview (Simple English)

## 1. What this project is

This project is a full web platform for managing real-world needs and donations.

Main idea:
- Organizations (like hospitals, clinics, schools, NGOs) can publish what they need.
- Donors can see those needs and pledge donations.
- Admin users can control approvals, data quality, and document processing.

The platform helps connect people who need support with people who can give support.

## 2. Main goal

The goal is to make donation coordination easier, faster, and more transparent.

The system is designed to:
- Track urgent and non-urgent need items.
- Organize needs by organization and by section/department.
- Let donors pledge support with proper details.
- Let admins review and manage the full process.
- Support PDF-based need extraction using AI.

## 3. Main user roles

The project has 3 main user roles:

1. ADMIN
- Full system control.
- Can manage organizations, sections, needs, documents, approvals, and donations.
- Can approve or reject ORG_ADMIN registration requests.

2. ORG_ADMIN (Organization Admin)
- Manages one organization.
- Can create and update sections and needs for their organization.
- Can upload documents and process needs.

3. DONOR
- Can view organizations and needs.
- Can create donation pledges.
- Can track own donation records.

## 4. High-level architecture

This is a standard modern 3-layer web application:

1. Frontend
- Next.js + React + TypeScript
- Runs on port 3000
- Handles UI, pages, forms, and user interactions.

2. Backend
- Django + Django REST Framework
- Runs on port 8000
- Handles business logic, database operations, permissions, and APIs.

3. Database
- PostgreSQL in Docker for normal setup
- SQLite option available for local fallback/testing

Data flow:
- Browser calls frontend.
- Frontend calls backend API.
- Backend reads/writes database.

## 5. Important features already implemented

### A. User authentication and account features
- Donor registration flow.
- Organization admin registration flow with approval status.
- Login using username or email.
- JWT auth with access token + refresh token.
- Automatic token refresh and retry support in frontend API client.
- Profile read/update endpoint.
- Profile password change using current-password verification.
- Forgot password email flow.
- Reset password by secure token link.
- Login block for non-approved org admins.

### B. Role-based access and permissions
- 3-role system: ADMIN, ORG_ADMIN, DONOR.
- Public read access for selected resources.
- Write access restricted by role.
- Object-level permission checks for organization ownership.
- ORG_ADMIN sees and manages only their own organization data.
- DONOR can create/view own donation records.
- Role guards in frontend routes/pages.

### C. Organization admin approval workflow
- Pending approval queue for org-admin requests.
- Approve action with admin tracking fields.
- Reject action with mandatory reason support.
- Decision metadata tracking (requested time, decided time, decided by).
- Approved and rejected history lists.
- Frontend approvals page with tabs: Pending, Approved, Rejected.
- Confirmation dialogs for approve/reject actions.
- Re-registration support for previously rejected applicants.
- Email notifications for approval and rejection decisions.

### D. Organization management features
- Create, read, update, delete organizations.
- Organization type support (Hospital, Clinic, School, NGO, Charity, Government, Other).
- Unique checks for organization name and registration number.
- Rich organization profile fields (contact, website, established year, description).
- Automatic geocoding for latitude/longitude using OpenStreetMap Nominatim.
- Re-geocoding when address/location fields change.
- Keep manual coordinates if user explicitly sets custom coordinates.
- Organization hierarchy endpoint (organization -> sections -> needs).
- Invite additional org admins to the same organization.
- List all admins assigned to an organization.

### E. Section management features
- Create, read, update, delete sections.
- Link sections to organizations.
- Track who created each section.
- Org-scoped section visibility for ORG_ADMIN users.

### F. Need management features
- Create, read, update, delete need items.
- Priority model: CRITICAL, ESSENTIAL, NICE.
- Quantity model: quantity_required and quantity_received.
- Unit support: UNIT, BOX, KG, LITER.
- Need filtering by priority in API and UI.
- Exclude fulfilled needs filter in API.
- Frontend sorting options: priority, most recent, least fulfilled.
- Frontend need statistics panel and priority-based browsing.

### G. Donation management and lifecycle features
- Donation creation from need cards.
- Support for private donor and government donor forms.
- Detailed donor fields (name/contact/org/address/email/phone and government-specific fields).
- Estimated delivery date and donor message support.
- Donation statuses: PENDING, CONFIRMED, FULFILLED, CANCELLED.
- Confirm donation action by ORG_ADMIN/ADMIN.
- Cancel donation action with cancellation reason.
- Mark confirmed donation as physically received.
- Partial confirmation support with automatic surplus split.
- Auto-create cancelled surplus donation records when confirmed quantity is less than pledge.
- Track who confirmed/cancelled/received and when.
- Donation email notifications for confirm/cancel/receive updates.
- Public recent-donations endpoint for landing page live feed.
- Admin/org-admin donation management pages with status filters and detail views.

### H. Document upload and AI processing features
- Secure document upload endpoint.
- PDF-only validation and file-size checks.
- Helpful error responses for wrong content type or missing form fields.
- Document status workflow: PENDING -> PROCESSED -> APPROVED (or FAILED).
- AI text extraction from uploaded PDFs.
- Google Gemini integration for structured need extraction.
- AI output stored as JSON for human review.
- Approve-and-create-needs action from extracted data.
- Documents frontend page for upload, status tracking, and extracted-data preview.
- Manual need entry form available from the document workflow.

### I. Search, discovery, and analytics features
- Unified search endpoint for organizations and needs.
- Search by query text with type filter (all/organization/need).
- Search filters for need priority and organization type.
- Search option to exclude already fulfilled needs.
- Pagination controls in search endpoint (limit/offset).
- Dedicated frontend search page with live filters and grouped results.
- System stats endpoint for homepage metrics.
- Impact page with donation/fulfillment analytics and trend summaries.
- Organization and system dashboards with KPI cards.
- Charts for monthly and yearly donation trends.
- Section-wise analytics and progress indicators.

### J. Maps and geographic visibility
- Sri Lanka organization map components.
- Advanced Leaflet map integration.
- Marker plotting from organization coordinates.
- District/province coverage visibility through stats and map views.

### K. Frontend user experience features
- Responsive multi-page Next.js application.
- Role-aware navigation and dashboard routing.
- Admin dashboard for platform-wide monitoring.
- Organization admin dashboard for organization-level operations.
- Org-admin page to manage and invite co-admins.
- Organization list, create, detail, and edit pages.
- Needs page with filters, sorting, and donation actions.
- Authentication pages: login, forgot password, reset password.
- User profile page.
- Public information pages: about, contact, privacy, terms.
- Loading states, error handling, and guarded routes.

### L. Security and reliability features
- Environment-variable driven secrets and config.
- JWT authentication in backend API.
- CORS and CSRF trusted-origin configuration.
- Custom DRF exception handler for cleaner API errors.
- Input validation in serializers and API endpoints.
- Anti-email-enumeration behavior in forgot-password response.
- Superuser role safety in user save logic.

### M. Operations, deployment, and observability features
- Full Docker Compose stack (frontend + backend + PostgreSQL).
- Dev Docker Compose option for DB-only local development.
- Startup helper scripts for Windows (PowerShell and batch).
- Kubernetes manifests for backend, frontend, and ingress.
- Ingress routing for frontend, API, and metrics.
- Prometheus middleware and /metrics exposure support.
- Media volume persistence in containerized setup.

### N. Testing and quality checks already present
- API tests for donation lifecycle actions.
- Tests for partial confirmation and surplus split behavior.
- Tests for cancellation timestamp and receive transition.
- Tests for organization geocoding behavior.
- Tests for geocode refresh on location changes and manual coordinate preservation.

## 6. Core backend data model (simple view)

Main tables/models:

1. User
- Extended Django user.
- Stores role and approval status details.

2. Organization
- Name, registration number, address, district, type, contact info.
- Stores latitude/longitude (auto geocoding logic included).

3. Section
- A department inside an organization (example: Emergency Ward, Pharmacy).

4. NeedItem
- Item name, priority, quantity required, quantity received, unit, description.

5. DocumentUpload
- Stores uploaded PDF and AI processing status/data.

6. Donation
- Donation pledge details, donor info, status history fields, and admin action fields.

## 7. API design summary

The backend uses REST endpoints under /api.

Main endpoint groups:
- /api/auth/* for auth and profile.
- /api/organizations/* for organizations.
- /api/sections/* for sections.
- /api/needs/* for needs.
- /api/documents/* for document processing.
- /api/donations/* for donations.
- /api/admin/approvals/* for org admin approval actions.
- /api/search/ for combined search.
- /api/stats/ for landing page stats.

Permissions are role-based and enforced in backend view logic.

## 8. Frontend structure summary

The frontend is a Next.js App Router project.

Key parts:
- app/: routes/pages.
- components/: reusable UI components (modals, cards, map, analytics, etc.).
- lib/api.ts: API client and shared frontend data types.

The frontend reads JWT tokens from local storage and retries requests after token refresh on 401.

## 9. Environment and configuration

Main configuration points:
- SECRET_KEY and DB settings for Django.
- CORS and CSRF trusted origins.
- FRONTEND_URL for links and redirects.
- GEMINI_API_KEY for AI document processing.
- Email settings for sending account and donation notifications.

## 10. How to run the project

### Option 1: Full Docker stack
- Uses root docker-compose.yml.
- Starts db, backend, and frontend containers.

### Option 2: Hybrid development
- Use docker-compose.dev.yml to run only database.
- Run backend and frontend directly on host for faster coding.

Helper scripts exist at project root for Windows PowerShell/BAT startup flows.

## 11. Deployment story

The repository includes Kubernetes manifests for:
- backend deployment/service
- frontend deployment/service
- ingress routing
- extra infra files (monitoring-related manifests are also present)

Ingress routes requests so:
- /api goes to backend
- / goes to frontend

## 12. What this project does well

- Clear role-based workflow.
- Strong practical feature set (approval flow + donation flow + AI document flow).
- Good separation between frontend and backend.
- Multiple run modes (full docker, local dev mix, k8s manifests).
- API-first structure that is easy to extend.

## 13. Current scope and future expansion potential

Based on code and docs, this project is already a solid operational platform.

Natural future improvements can include:
- More automated tests.
- Background job queue for AI processing.
- Better audit/reporting tools.
- Notifications and analytics expansion.
- Performance hardening for large-scale usage.

## 14. One-sentence summary

Rebuild Management is a full-stack donation coordination platform where organizations publish needs, admins manage trust and operations, and donors pledge support through a structured, trackable workflow.
