# 🚀 Development Setup Guide

## Option 1: Fastest Way (One Command)

Run this PowerShell script from the project root:

```powershell
.\dev-start.ps1
```

This will automatically:

- Start PostgreSQL database in Docker
- Start Django backend locally
- Start Next.js frontend locally
- Open them in separate terminal windows

Then visit: **http://localhost:3000**

Any code changes you make will **instantly reflect** in your browser after a refresh!

---

## Option 2: Manual Control (More Flexibility)

### Step 1: Start Only Database in Docker

```powershell
docker-compose -f docker-compose.dev.yml up db
```

### Step 2: Start Backend (in a new terminal)

```powershell
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Step 3: Start Frontend (in another new terminal)

```powershell
cd frontend
npm run dev
```

Then visit: **http://localhost:3000**

---

## How It Works

| Service      | Location         | Why                                  |
| ------------ | ---------------- | ------------------------------------ |
| **Database** | Docker Container | Persistent, no rebuilds needed       |
| **Backend**  | Local Machine    | Instant code changes, fast debugging |
| **Frontend** | Local Machine    | Instant code changes, hot reload     |

---

## Commands Reference

### Start Development

```powershell
.\dev-start.ps1
```

### Stop Development

```powershell
# In any PowerShell window:
docker-compose -f docker-compose.dev.yml down
```

### View Database Logs

```powershell
docker-compose -f docker-compose.dev.yml logs db
```

### Access Database from Command Line

```powershell
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d rebuild_db
```

---

## Configuration

- **Backend Database Host**: `localhost:5433` (from your local machine)
- **Backend API URL**: `http://localhost:8000`
- **Frontend API Proxy**: `http://localhost:8000`

All environment variables are already set in your `.env` file pointing to `localhost`.

---

## Troubleshooting

### Backend can't connect to database?

```powershell
# Verify database is running
docker-compose -f docker-compose.dev.yml ps

# Check database logs
docker-compose -f docker-compose.dev.yml logs db
```

### Port already in use?

- If port 5433 is taken: Change `DB_PORT` in `.env`
- If port 8000 is taken: `python manage.py runserver 8001`
- If port 3000 is taken: Edit `frontend/.env.local` and add `PORT=3001`

### Need to rebuild database?

```powershell
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up db
```

---

## For Production

Use the original `docker-compose.yml`:

```powershell
docker-compose up --build
```

This builds and runs all services in containers.
