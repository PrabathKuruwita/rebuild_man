# Move imports to the top
from django.db import models
from django.contrib.auth.models import AbstractUser



# 1. USERS
# Extending the default user to distinguish between Admin, Donors, and Gov Officials
class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'System Admin'),
        ('ORG_ADMIN', 'Org Admin'),
        ('DONOR', 'Donor'),
    )
    
    APPROVAL_STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    
    ORG_TYPE_CHOICES = (
        ('HOSPITAL', 'Hospital'),
        ('CLINIC', 'Clinic'),
        ('SCHOOL', 'School'),
        ('NGO', 'NGO'),
        ('CHARITY', 'Charity'),
        ('GOVERNMENT', 'Government'),
        ('OTHER', 'Other'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DONOR')
    phone_number = models.CharField(max_length=15, blank=True)
    
    # For org admin approval workflow
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='APPROVED'  # Donors and existing admins are pre-approved
    )
    requested_organization = models.ForeignKey(
        'Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_requests'
    )
    requested_organization_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Organization name submitted during org admin registration"
    )
    requested_organization_type = models.CharField(
        max_length=50,
        choices=ORG_TYPE_CHOICES,
        blank=True,
        help_text="Organization type submitted during org admin registration"
    )
    rejection_reason = models.TextField(blank=True, help_text="Reason for rejecting org admin request")
    approval_requested_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, help_text="When the org admin request was submitted")
    approval_decided_at = models.DateTimeField(null=True, blank=True, help_text="When the approval/rejection decision was made")
    approval_decided_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_decisions',
        help_text="The admin who approved/rejected this request"
    )
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admins',
        help_text="The organization this user is an admin for"
    )

    def save(self, *args, **kwargs):
        """
        Ensure that superusers always have the correct admin role.
        This prevents accidental downgrading of admin accounts if they're
        created through the registration endpoint instead of the management command.
        """
        # If this is a superuser, ensure role is ADMIN (not DONOR or ORG_ADMIN)
        if self.is_superuser and self.role != 'ADMIN':
            self.role = 'ADMIN'
        
        super().save(*args, **kwargs)


# 2. ORGANIZATION (The Hospital or Company)
class Organization(models.Model):
    ORG_TYPE_CHOICES = (
        ('HOSPITAL',   'Hospital'),
        ('CLINIC',     'Clinic'),
        ('SCHOOL',     'School'),
        ('NGO',        'NGO'),
        ('CHARITY',    'Charity'),
        ('GOVERNMENT', 'Government'),
        ('OTHER',      'Other'),
    )

    name = models.CharField(max_length=200)  # e.g., "National Hospital Colombo"
    registration_number = models.CharField(max_length=50, unique=True)
    address = models.TextField()
    district = models.CharField(max_length=50)

    org_type = models.CharField(max_length=20, choices=ORG_TYPE_CHOICES, default='HOSPITAL')
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email_contact = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    established_year = models.IntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name'], name='unique_organization_name')
        ]

    def __str__(self):
        return self.name


# 3. SECTIONS (Departments inside the Org)
class Section(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=100) # e.g., "OPD", "Kitchen", "Maternity Ward"
    head_of_section = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_sections", help_text="User who created this section")

    def __str__(self):
        return f"{self.organization.name} - {self.name}"


# 4. NEEDS (The Hierarchy: Critical / Essential / Nice to Have)
class NeedItem(models.Model):
    PRIORITY_CHOICES = (
        ('CRITICAL', 'Critical'),       # High Priority
        ('ESSENTIAL', 'Essential'),     # Medium Priority
        ('NICE', 'Nice to Have'),       # Low Priority
    )

    UNIT_CHOICES = (
        ('UNIT', 'Units'),
        ('BOX', 'Boxes'),
        ('KG', 'Kilograms'),
        ('LITER', 'Liters'),
    )

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="needs")
    name = models.CharField(max_length=200) # e.g., "Saline Bottles"
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    
    quantity_required = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='UNIT')
    
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.priority})"


# 5. DOCUMENT UPLOADS (For the AI OCR Feature)
class DocumentUpload(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Processing'),
        ('PROCESSED', 'Processed by AI'),
        ('APPROVED', 'Approved by Admin'),
        ('FAILED', 'Failed'),
    )

    id = models.AutoField(primary_key=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    file = models.FileField(upload_to='needs_pdfs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # We will store the AI result here as JSON before adding it to the NeedItem table
    ai_extracted_json = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Doc {self.id} - {self.status}"


# 6. DONATIONS (Track donations made towards NeedItems)
class Donation(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('FULFILLED', 'Fulfilled'),
        ('CANCELLED', 'Cancelled'),
    )
    
    DONOR_TYPE_CHOICES = (
        ('private', 'Private Donor'),
        ('government', 'Government'),
    )

    # Basic donation info
    donor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="donations")
    need_item = models.ForeignKey(NeedItem, on_delete=models.CASCADE, related_name="donations")
    quantity = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    message = models.TextField(blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Donor type and details (supports both private and government donations)
    donor_type = models.CharField(max_length=20, choices=DONOR_TYPE_CHOICES, default='private')
    
    # Private donor information
    donor_name = models.CharField(max_length=200, blank=True)
    donor_contact = models.CharField(max_length=50, blank=True)
    donor_organization = models.CharField(max_length=200, blank=True)
    donor_address = models.TextField(blank=True)
    donor_email = models.EmailField(blank=True)
    donor_phone = models.CharField(max_length=20, blank=True)
    
    # Government donor information
    government_department = models.CharField(max_length=200, blank=True)
    government_program = models.CharField(max_length=200, blank=True)
    government_officer_name = models.CharField(max_length=200, blank=True)
    government_officer_designation = models.CharField(max_length=100, blank=True)
    government_officer_contact = models.CharField(max_length=20, blank=True)
    government_email = models.EmailField(blank=True)
    
    # Donation letter (PDF)
    donation_letter_file = models.FileField(upload_to='donation_letters/', null=True, blank=True)

    # Admins who took actions
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="confirmed_donations")
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="cancelled_donations")

    def __str__(self):
        return f"Donation {self.id} - {self.quantity} units of {self.need_item.name}"

