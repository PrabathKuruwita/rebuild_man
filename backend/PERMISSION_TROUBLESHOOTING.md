# Permission Troubleshooting Guide

## Issue: "You do not have permission to perform this action"

This error occurs when your user account doesn't have the required permissions. Here's how to fix it:

---

## Quick Fix Steps

### Step 1: Check Your User Role

1. **Log into Django Admin**: http://localhost:8000/admin/
2. Go to **Users** → Find your user → Click to edit
3. Check the **Role** field - it should be one of:
   - `ADMIN` - Full system access
   - `ORG_ADMIN` - Can manage own organization
   - `DONOR` - Read-only access

### Step 2: Set the Correct Role

If your role is `DONOR` or blank, change it:

1. In the User edit page, find the **Role** dropdown
2. Select `ADMIN` (for full access) or `ORG_ADMIN` (for organization management)
3. Click **Save**

### Step 3: Link Organization Admin User (for ORG_ADMIN)

If you're an `ORG_ADMIN`, you must be linked to an organization:

1. Go to **Organizations** → Find the organization you want to manage
2. Edit the organization
3. Set **Admin user** field to your user account
4. Click **Save**

---

## Permission Matrix

| Action | Public | DONOR | ORG_ADMIN | ADMIN |
|--------|--------|-------|-----------|-------|
| **View organizations** | ✅ | ✅ | ✅ | ✅ |
| **Create organization** | ❌ | ❌ | ❌ | ✅ |
| **Edit own organization** | ❌ | ❌ | ✅ | ✅ |
| **Edit any organization** | ❌ | ❌ | ❌ | ✅ |
| **View sections/needs** | ✅ | ✅ | ✅ | ✅ |
| **Edit own org sections/needs** | ❌ | ❌ | ✅ | ✅ |
| **Edit any sections/needs** | ❌ | ❌ | ❌ | ✅ |
| **Upload documents** | ❌ | ✅ | ✅ | ✅ |
| **Process documents** | ❌ | ✅* | ✅* | ✅ |
| **Approve documents** | ❌ | ❌ | ✅* | ✅ |

\* Only for own documents/organization

---

## Testing Permissions via Admin Panel

### Option 1: Quick Admin Setup

1. **Create or edit your superuser**:
   ```bash
   python manage.py createsuperuser
   ```

2. **Log into admin**: http://localhost:8000/admin/

3. **Edit your user**:
   - Go to **Users** → Your username
   - Set **Role** to `ADMIN`
   - Check **Staff status** ✅
   - Check **Superuser status** ✅ (optional, for full Django admin access)
   - Save

### Option 2: Create Test Users

Create different test users for each role:

#### Admin User:
```python
# In Django shell: python manage.py shell
from core.models import User

admin = User.objects.create_user(
    username='admin',
    email='admin@example.com',
    password='admin123',
    role='ADMIN',
    is_staff=True
)
```

#### Org Admin User:
```python
from core.models import User, Organization

org_admin = User.objects.create_user(
    username='orgadmin',
    email='orgadmin@example.com',
    password='your-secure-password',  # Use a strong password
    role='ORG_ADMIN'
)

# Link to organization
org = Organization.objects.first()
org.admin_user = org_admin
org.save()
```

#### Donor User:
```python
from core.models import User

donor = User.objects.create_user(
    username='donor',
    email='donor@example.com',
    password='your-secure-password',  # Use a strong password
    role='DONOR'
)
```

---

## API Testing with Different Roles

### Test as Admin:
```bash
curl -X PUT http://localhost:8000/api/organizations/1/ \
  -u admin:admin123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Hospital Name"}'
```

**Expected**: ✅ Success

### Test as Org Admin (linked to organization):
```bash
curl -X PUT http://localhost:8000/api/organizations/1/ \
  -u orgadmin:orgadmin123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Hospital Name"}'
```

**Expected**: ✅ Success (if linked to this organization)  
**Expected**: ❌ 403 Forbidden (if not linked or different org)

### Test as Donor:
```bash
curl -X PUT http://localhost:8000/api/organizations/1/ \
  -u donor:donor123 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Hospital Name"}'
```

**Expected**: ❌ 403 Forbidden

---

## Common Issues

### Issue 1: Superuser but still getting permission denied

**Problem**: Superuser status doesn't automatically give you a role

**Solution**: 
1. Go to admin → Users → Your user
2. Set **Role** field to `ADMIN`
3. Save

### Issue 2: ORG_ADMIN can't edit organization

**Problem**: User is not linked as the organization's admin

**Solution**:
1. Go to admin → Organizations → Your organization
2. Set **Admin user** to your user account
3. Save

### Issue 3: Can view but can't edit

**Problem**: GET requests work, but PUT/POST/DELETE fail

**Solution**: Check your role. DONOR role is read-only.

### Issue 4: Different permissions in admin vs API

**Problem**: Can edit in Django admin but not via API

**Explanation**: Django admin uses `is_staff` permission, API uses role-based permissions

**Solution**: Ensure both:
- `is_staff = True` (for admin panel access)
- `role = 'ADMIN'` or `'ORG_ADMIN'` (for API access)

---

## Verification Checklist

Before testing, verify:

- [ ] User exists and is active
- [ ] User has correct role (ADMIN, ORG_ADMIN, or DONOR)
- [ ] If ORG_ADMIN: User is linked to an organization via `admin_user` field
- [ ] User is authenticated (using session or basic auth)
- [ ] If using API: Credentials are correct in Authorization header

---

## Quick Test Script

Run this to check your permissions:

```python
# python manage.py shell

from core.models import User, Organization

# Check your user
user = User.objects.get(username='YOUR_USERNAME')
print(f"Username: {user.username}")
print(f"Role: {user.role}")
print(f"Is Staff: {user.is_staff}")
print(f"Is Superuser: {user.is_superuser}")

# If ORG_ADMIN, check linked organizations
if user.role == 'ORG_ADMIN':
    orgs = Organization.objects.filter(admin_user=user)
    print(f"Manages {orgs.count()} organization(s):")
    for org in orgs:
        print(f"  - {org.name} (ID: {org.id})")
```

---

## Updating Your Current User

If you need to fix your current superuser:

```bash
python manage.py shell
```

```python
from core.models import User

# Get your user
user = User.objects.get(username='YOUR_USERNAME')

# Set role to ADMIN
user.role = 'ADMIN'
user.save()

print(f"✅ User {user.username} is now an ADMIN")

# Optional: Link to organization if you want to test ORG_ADMIN
from core.models import Organization
org = Organization.objects.first()
if org:
    org.admin_user = user
    org.save()
    print(f"✅ User linked to organization: {org.name}")
```

---

## Still Having Issues?

1. **Check server logs** when making the request
2. **Restart the server** after making user changes
3. **Clear browser cache/sessions** if using session auth
4. **Test with a fresh user** to rule out caching issues
5. **Verify the URL** - make sure you're using the correct endpoint

---

## Need Help?

- Check [core/permissions.py](./core/permissions.py) for permission logic
- Check [core/views.py](./core/views.py) for which permissions are applied
- Run tests with debug mode to see detailed permission checks

---

## Summary

**Quick Fix for Testing:**

1. Make your user an ADMIN:
   ```bash
   python manage.py shell
   ```
   ```python
   from core.models import User
   user = User.objects.get(username='YOUR_USERNAME')
   user.role = 'ADMIN'
   user.save()
   ```

2. Restart server and try again

This gives you full access for testing purposes. For production, use appropriate roles!
