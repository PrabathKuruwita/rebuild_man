# Security Fixes & Setup Guide

## ✅ AUTOMATED FIXES COMPLETED

The following security issues have been automatically fixed:

### 1. ✅ Removed Hardcoded Credentials from Docker Compose
- **Files Updated**: `docker-compose.yml`, `docker-compose.dev.yml`
- **Changes**: All environment variables now use `${VAR_NAME}` syntax
- **Details**: Credentials are now loaded from `.env` file instead of hardcoded values
- **Required**: Set `DB_PASSWORD`, `SECRET_KEY` in `.env` before running

### 2. ✅ Fixed Django Settings.py Configuration
- **File Updated**: `backend/config/settings.py`
- **Changes**:
  - `SECRET_KEY` now requires environment variable (no insecure default)
  - `DEBUG` defaults to `False` (production-safe)
  - `ALLOWED_HOSTS` now restrictive (no wildcards or external IPs)
- **Action**: Requires you to generate and set `SECRET_KEY` environment variable

### 3. ✅ Updated .env Configuration Files
- **Files Updated**: `backend/.env`, `backend/.env.example`, created `backend/.env.production`
- **Changes**:
  - Removed hardcoded `admin1234` password
  - Removed insecure Django SECRET_KEY
  - Added comprehensive security comments
  - Separated dev and production configurations
- **Files Created**:
  - `backend/.env.production` - Template for production secrets

### 4. ✅ Removed Debug Logging
- **File Updated**: `backend/core/views.py`
- **Changes**: Removed console print statements that exposed authentication state
- **Security Impact**: Prevents information disclosure in logs

### 5. ✅ Frontend BACKEND_URL Validation
- **File Updated**: `frontend/next.config.ts`
- **Changes**: Added validation to ensure BACKEND_URL uses http:// or https://
- **Details**: Warns if using HTTP in production environment

---

## ⚠️ MANUAL FIXES REQUIRED (Priority Order)

### 1. 🔴 CRITICAL - Generate New Django SECRET_KEY

**Why**: The previous SECRET_KEY is exposed in your git history. Even though it's now removed, it must be regenerated.

**Steps**:
```bash
cd backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Then**:
- Copy the generated key
- Set it in your `.env` file: `SECRET_KEY=your-generated-key`
- Or set it as environment variable in your deployment

**Verification**:
```bash
python manage.py check
```

---

### 2. 🔴 CRITICAL - Change Database Password

**Why**: `admin1234` is exposed in git history and is easily guessable.

**Steps**:
1. Generate a strong password (16+ chars, mix of upper/lower/numbers/special):
   - Use: `python -c "import secrets; print(secrets.token_urlsafe(20))"`
   
2. Update in `.env`:
   ```
   DB_PASSWORD=your-new-strong-password
   ```

3. If database already exists, change PostgreSQL password:
   ```bash
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'your-new-strong-password';
   ```

---

### 3. 🔴 CRITICAL - Configure ALLOWED_HOSTS for Production

**Current Default**: `localhost,127.0.0.1,backend`

**For Production**:
```bash
# In .env.production or deployment secrets:
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,api.your-domain.com
```

**DO NOT include**:
- ❌ Wildcard `*`
- ❌ `0.0.0.0`
- ❌ External IPs that aren't your domain
- ❌ IP addresses in production

---

### 4. 🟠 HIGH - Secure Password Reset for invite_admin Endpoint

**Current Issue**: Temporary passwords sent in plain email.

**Recommended Fix**: Use secure token-based invitations instead.

**Implementation Steps**:

1. **Create an invitation token model** in `backend/core/models.py`:
```python
from django.db import models
from django.utils import timezone
from datetime import timedelta

class OrgAdminInvitation(models.Model):
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE)
    email = models.EmailField()
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    def is_expired(self):
        """Invitations valid for 7 days"""
        return timezone.now() > self.created_at + timedelta(days=7)
    
    def is_valid(self):
        return not self.is_expired() and self.accepted_at is None
```

2. **Update invite_admin endpoint** to create invitation instead of user:
```python
@action(detail=True, methods=['post'])
def invite_admin(self, request, pk=None):
    org = self.get_object()
    email = request.data.get('email')
    
    # Create invitation token
    import secrets
    token = secrets.token_urlsafe(32)
    
    OrgAdminInvitation.objects.create(
        organization=org,
        email=email,
        token=token
    )
    
    # Send email with link (no password in email)
    reset_url = f"{settings.FRONTEND_URL}/accept-invitation?token={token}"
    send_mail(
        subject=f"Invitation to manage {org.name}",
        message=f"Click here to accept invitation: {reset_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email]
    )
```

3. **Create acceptance endpoint**:
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def accept_admin_invitation(request):
    token = request.data.get('token')
    password = request.data.get('password')
    
    invitation = OrgAdminInvitation.objects.get(token=token)
    
    if not invitation.is_valid():
        return Response({'error': 'Invalid or expired invitation'}, status=400)
    
    # Create user with provided password
    user = User.objects.create(
        username=invitation.email.split('@')[0],
        email=invitation.email,
        role='ORG_ADMIN',
        organization=invitation.organization
    )
    user.set_password(password)
    user.save()
    
    invitation.accepted_at = timezone.now()
    invitation.save()
    
    return Response({'message': 'Account created successfully'})
```

---

### 5. 🟠 HIGH - Add File Upload Security Restrictions

**Location**: `backend/core/views.py` - DocumentUploadViewSet

**Add file type validation**:
```python
def validate_file_type(file):
    """Only allow PDF and image uploads"""
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise ValueError(f"File type {file.content_type} not allowed")

def validate_file_size(file, max_mb=50):
    """Limit file size to prevent abuse"""
    max_bytes = max_mb * 1024 * 1024
    if file.size > max_bytes:
        raise ValueError(f"File too large. Maximum {max_mb}MB allowed")

# In DocumentUploadViewSet.create():
file = request.FILES['file']
validate_file_type(file)
validate_file_size(file)  # Default 50MB limit
```

**Add to NeedItem model**:
```python
class DocumentUpload(models.Model):
    # ... existing fields ...
    
    # Add file size and type tracking
    file_size = models.BigIntegerField()  # bytes
    file_type = models.CharField(max_length=50)  # MIME type
    
    class Meta:
        # Prevent uploading same file twice
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'file'], 
                name='unique_org_file'
            )
        ]
```

---

### 6. 🟡 MEDIUM - Add Rate Limiting to Auth Endpoints

**Protects against brute force attacks**

**Install dependency**:
```bash
pip install django-ratelimit
```

**Add to views**:
```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='5/m', method='POST')
@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    """Max 5 login attempts per minute per IP"""
    # ... existing code ...
```

**Also rate limit**:
- `forgot_password` - 3/hour per email
- `reset_password` - 3/hour per IP
- `register` - 5/hour per IP

---

### 7. 🟡 MEDIUM - Configure Email for Production

**Current State**: Defaults to console backend (prints to console)

**For Production**:

1. **Using Gmail SMTP** (not recommended for production):
```bash
# Set in environment variables or .env.production:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

2. **Better: Use SendGrid or similar service**:
```bash
EMAIL_BACKEND=sendgrid_backend.SendgridBackend
SENDGRID_API_KEY=your-sendgrid-key
```

---

### 8. 🟡 MEDIUM - Run Dependency Security Audit

**Identify vulnerable packages**:

```bash
# Check Python dependencies
pip install pip-audit
pip-audit

# Check frontend dependencies
cd frontend
npm audit
npm audit fix  # Auto-fix if possible
```

**Action on findings**:
- Update vulnerable packages to patched versions
- Test thoroughly before deploying
- Monitor for security advisories

---

### 9. 🟢 LOW - Restrict Django Admin Access (Optional)

**Consider limiting `/admin/` access**:

1. **Move Django admin to unusual URL**:
```python
# backend/config/urls.py
urlpatterns = [
    path('admin-secret-key-xyz/', admin.site.urls),  # Not typical /admin/
    # ... rest of urls
]
```

2. **Or require IP whitelist**:
```python
class AdminIPWhitelistMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_ips = ['203.0.113.5', '203.0.113.6']
    
    def __call__(self, request):
        if request.path.startswith('/admin/'):
            if request.META.get('REMOTE_ADDR') not in self.allowed_ips:
                return HttpForbidden()
        return self.get_response(request)
```

---

### 10. 🟢 LOW - Review and Update Dependencies Regularly

**Set up automated checks**:
- Enable Dependabot on GitHub
- Configure security alerts
- Review updates monthly
- Test before deploying updates

---

## 🚀 Deployment Checklist

Before deploying to production, verify:

- [ ] New `SECRET_KEY` generated and set
- [ ] New database password set
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] HTTPS enabled (SSL certificate)
- [ ] Email service configured
- [ ] Database backups configured
- [ ] Logging configured (not to console)
- [ ] CORS/CSRF origins configured
- [ ] Rate limiting configured
- [ ] File upload restrictions implemented
- [ ] Static files collected and served by web server
- [ ] Security headers configured (Nginx/reverse proxy)
- [ ] Database password changed from default
- [ ] Dependencies audited and updated

---

## 📋 Environment Configuration Examples

### Development (.env)
```bash
SECRET_KEY=django-insecure-dev-only
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_PASSWORD=dev_password
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Production (.env.production)
```bash
SECRET_KEY=<generated-random-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DB_PASSWORD=<strong-random-password>
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
FRONTEND_URL=https://your-domain.com
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

---

## 📞 Getting Help

For issues with specific steps:
1. Check Django security documentation: https://docs.djangoproject.com/en/stable/topics/security/
2. Review OWASP security guidelines: https://owasp.org/
3. Check your framework's security best practices

