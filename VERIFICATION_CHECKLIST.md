# ✅ SYSTEM VERIFICATION CHECKLIST

## 🎯 Pre-Run Checklist

Before running the system, ensure you have:

- [ ] **Docker Desktop installed** (for Docker setup)
  - Download: https://www.docker.com/products/docker-desktop
  - Test: `docker --version`

- [ ] **Docker running** (if using Docker setup)
  - Start Docker Desktop application
  - Test: `docker ps`

- [ ] **Python 3.12+** (for manual setup)
  - Test: `python --version`

- [ ] **Node.js 22+** (for manual setup)
  - Test: `node --version` and `npm --version`

- [ ] **PostgreSQL 15** (for manual setup)
  - Test: Can connect or willing to run via Docker

- [ ] **Internet connection** (first run downloads base images ~1GB)

---

## 🐳 Docker Setup Verification

### Step 1: Start System
```bash
cd rebuild_man
docker-compose up --build
```
Expected: Services start, download images (first time), no errors

### Step 2: Wait for Readiness
Watch for:
```
[+] Building X/Y  (progresses to 100%)
...
rebuilt_db      "Up (healthy)"
rebuild_backend "Up (healthy)"  
rebuild_frontend "Up (healthy)"
```

### Step 3: Verify All Services

#### ✅ Check Services Running
```bash
docker-compose ps
```
**Expected Output:**
```
NAME              STATUS          PORTS
rebuild_db        Up (healthy)    5433->5432/tcp
rebuild_backend   Up (healthy)    8000->8000/tcp
rebuild_frontend  Up (healthy)    3000->3000/tcp
```

#### ✅ Check Backend API
```bash
curl http://localhost:8000/api/organizations/
```
**Expected:** HTTP 200, JSON response with organizations list

#### ✅ Check Frontend Accessible
```bash
curl http://localhost:3000
```
**Expected:** HTTP 200, HTML page returned

#### ✅ Check Logs for Errors
```bash
docker-compose logs | grep -i error
docker-compose logs | grep -i failed
```
**Expected:** No critical errors

---

## 🌐 Frontend Testing

### ✅ Test 1: Access Frontend
1. Open browser: **http://localhost:3000**
2. Expected: Login page loads
3. Check browser console (F12) for errors: Should be clean

### ✅ Test 2: Login
1. Username: `admin`
2. Password: `Admin@1234`
3. Click Login
4. Expected: Redirects to dashboard

### ✅ Test 3: Dashboard Display
After login, verify you see:
- [ ] Title: "Dashboard" (not "What's Needed Right Now")
- [ ] 4 stat cards:
  - [ ] Organizations
  - [ ] Sections
  - [ ] Needs
  - [ ] Critical
- [ ] Blue "Create Organization" button is **visible and clickable**

### ✅ Test 4: Create Organization
1. Click "Create Organization" button
2. Fill in details:
   - Name: "Test Hospital"
   - Type: "HOSPITAL"
   - Email: "hospital@test.com"
3. Click "Create"
4. Expected: 
   - [ ] Modal closes
   - [ ] Organization appears in list
   - [ ] No error messages

### ✅ Test 5: Navigation
Test each menu item:
- [ ] Organizations page loads
- [ ] Sections page loads (or empty if no organization)
- [ ] Needs page loads
- [ ] Documents page loads

---

## 🔧 Backend Testing

### ✅ Test 1: API Health Check
```bash
curl -X GET http://localhost:8000/api/organizations/
```
**Response Should Be:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Test Hospital",
      "type": "HOSPITAL",
      ...
    }
  ]
}
```

### ✅ Test 2: Admin Panel
1. Open: **http://localhost:8000/admin**
2. Login with: admin / Admin@1234
3. Expected:
   - [ ] Admin panel loads
   - [ ] Can see organizations, sections, needs, documents

### ✅ Test 3: Database Check
```bash
docker-compose exec db psql -U postgres -d rebuild_db -c "SELECT COUNT(*) FROM core_organization;"
```
**Expected:** Returns count > 0 if you created organizations

### ✅ Test 4: Migrations Verification
```bash
docker-compose exec backend python manage.py showmigrations
```
**Expected:** All migrations show [X]  (applied)

---

## 📱 Complete End-to-End Test

### Scenario: Create Full Need Tracking Entry

#### Step 1: Login
- [ ] Access http://localhost:3000
- [ ] Login: admin/Admin@1234
- [ ] Dashboard loads

#### Step 2: Create Organization
- [ ] Click "Create Organization"
- [ ] Fill: Name, Type, Email
- [ ] Submit successfully

#### Step 3: Create Section
- [ ] Click on organization
- [ ] Click "Add Section"
- [ ] Fill: Name, Category, Description
- [ ] Submit successfully

#### Step 4: Create Need
- [ ] Click on section (if available via UI)
- [ ] Or go to Needs page
- [ ] Click "Add Need"
- [ ] Fill: Title, Description, Category, Priority
- [ ] Submit successfully

#### Step 5: Upload Document
- [ ] Go to Documents page
- [ ] Click "Upload Document"
- [ ] Select file
- [ ] Submit successfully

#### Step 6: Verify Persistence
- [ ] Do a full page refresh (Ctrl+R)
- [ ] Expected: All created data still visible
- [ ] Check console: No errors

---

## 🚨 Problem Indicators

### ❌ If You See These, There's an Issue

| Issue | Check |
|-------|-------|
| **Blank dashboard** | Check if role shows as "Donor". Logout & login again. |
| **Can't create org button** | Check browser console for errors. Verify role = ADMIN |
| **API 403 errors** | Check JWT token is sent. Check role permissions. |
| **Database connection err** | Check docker-compose ps shows db healthy. Restart db. |
| **Frontend shows error page** | Check backend API is running. Check API_URL in .env |
| **Slow loading (>5sec)** | Normal for first run. Check system resources. |
| **Login fails** | Verify admin user: `docker-compose exec backend python manage.py createsuperuser` |

---

## 📊 Performance Baseline

| Metric | Expected | Your Result |
|--------|----------|-------------|
| Frontend load time | <2 sec | _____ |
| API response time | <500ms | _____ |
| Login time | <3 sec | _____ |
| Organization creation | <2 sec | _____ |
| Page refresh | <1 sec | _____ |
| Total startup time | 1-2 min | _____ |

---

## 🔐 Security Verification

### ✅ Items to Verify

- [ ] **JWT tokens working**: Can login and access protected endpoints
- [ ] **Role-based access**: Donor can't create organizations
- [ ] **CORS working**: Frontend can call backend API
- [ ] **Credentials not exposed**: No passwords in terminal output
- [ ] **HTTPS ready**: Can be configured for production

---

## 📝 Log Checklist

After `docker-compose up --build`, check for absence of:

```bash
# Should return nothing (no errors)
docker-compose logs | grep -i "error"
docker-compose logs | grep -i "failed"
docker-compose logs | grep -i "critical"
docker-compose logs | grep -i "exception"
```

---

## ✅ Final Sign-Off Checklist

### Core System
- [ ] All 3 Docker containers running and healthy
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API accessible at http://localhost:8000/api
- [ ] Database connected and contains migrations

### Authentication
- [ ] Can login with admin/Admin@1234
- [ ] Dashboard shows "Dashboard" title (not "Donor")
- [ ] Admin has full access to features

### Features
- [ ] Can create organization
- [ ] Can view organizations
- [ ] Can manage section (if organization created)
- [ ] Can track needs
- [ ] Can upload documents

### Data Persistence
- [ ] Created data survives page refresh
- [ ] Created data survives container restart
- [ ] Database volume persists data

### No Errors
- [ ] Browser console clean (F12)
- [ ] No error messages in UI
- [ ] Docker logs contain no critical errors

---

## 🎯 Success Criteria

✅ **System is ready if:**
1. All 3 services show "Up (healthy)"
2. Can access frontend at localhost:3000
3. Can login with admin/Admin@1234  
4. Dashboard shows full admin interface
5. Can create an organization
6. API endpoints respond with 200 OK
7. No critical errors in logs

---

## 🚀 Status Summary

```
┌─────────────────────────────────────┐
│  SYSTEM VERIFICATION STATUS         │
├─────────────────────────────────────┤
│ Frontend:    _____ (working/failed) │
│ Backend:     _____ (working/failed) │
│ Database:    _____ (working/failed) │
│ Admin Login: _____ (working/failed) │
│ Full Flow:   _____ (working/failed) │
└─────────────────────────────────────┘
```

---

## 📞 Troubleshooting Resources

- See `SYSTEM_SETUP_GUIDE.md` for complete troubleshooting
- See `DOCKER_AND_SETUP.md` for Docker-specific issues
- Check `ADMIN_ROLE_FIX_GUIDE.md` if admin issues
- Run `docker-compose logs` for detailed error messages

---

## ✨ You're Good To Go! 🎉

All checks passing? Excellent! Your system is fully operational and ready for:
- [ ] Development
- [ ] Testing
- [ ] Deployment
- [ ] Production use (with config updates)

Happy coding! 🚀
