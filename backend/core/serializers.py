
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Organization, Section, NeedItem, DocumentUpload, Donation

User = get_user_model()

# 1. User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'first_name', 'last_name', 'approval_status', 'requested_organization']
        read_only_fields = ['role', 'approval_status', 'requested_organization']

class DonorUserSerializer(serializers.ModelSerializer):
    donations_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'date_joined', 'donations_count']

    def get_donations_count(self, obj):
        return obj.donations.filter(status__in=['CONFIRMED', 'FULFILLED']).count()

class UpdateProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password2 = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'current_password', 'new_password', 'new_password2']

    def validate(self, attrs):
        new_password = attrs.get('new_password', '')
        new_password2 = attrs.get('new_password2', '')
        current_password = attrs.get('current_password', '')

        if new_password or new_password2 or current_password:
            if not current_password:
                raise serializers.ValidationError({'current_password': 'Current password is required to set a new password.'})
            if not self.instance or not self.instance.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})
            if new_password != new_password2:
                raise serializers.ValidationError({'new_password2': 'New passwords do not match.'})
            if len(new_password) < 8:
                raise serializers.ValidationError({'new_password': 'Password must be at least 8 characters.'})
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('new_password2', None)
        validated_data.pop('current_password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'phone_number', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Make username unique automatically based on input
        base_username = attrs['username']
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        attrs['username'] = username
        
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='DONOR'  # Default role
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class OrgAdminRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    organization_name = serializers.CharField(write_only=True, required=True)
    organization_type = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'phone_number', 'first_name', 'last_name', 'organization_name', 'organization_type']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if email is already taken
        email = attrs.get('email', '')
        if email:
            existing_user = User.objects.filter(email=email).first()
            if existing_user:
                # If the existing user was previously rejected, allow them to re-register by updating their record
                if existing_user.role == 'ORG_ADMIN' and existing_user.approval_status == 'REJECTED':
                    attrs['existing_rejected_user'] = existing_user
                else:
                    raise serializers.ValidationError({"email": "A user with this email already exists."})

        # Make username unique automatically based on input (only if creating a new user)
        if not attrs.get('existing_rejected_user'):
            base_username = attrs['username']
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            attrs['username'] = username
        
        # Extract organization info (write-only fields)
        org_name = attrs.pop('organization_name')
        org_type = attrs.pop('organization_type')
        
        # Store organization details for later display
        attrs['requested_organization_name'] = org_name
        attrs['requested_organization_type'] = org_type
        
        # Try to find organization by name
        try:
            organization = Organization.objects.get(name__iexact=org_name)
            attrs['requested_organization'] = organization
        except Organization.DoesNotExist:
            # Store None - admin will assign organization during approval
            attrs['requested_organization'] = None
        
        return attrs

    def create(self, validated_data):
        existing_user = validated_data.pop('existing_rejected_user', None)
        
        # If they were rejected before, recycle and update their existing account
        if existing_user:
            existing_user.first_name = validated_data.get('first_name', existing_user.first_name)
            existing_user.last_name = validated_data.get('last_name', existing_user.last_name)
            existing_user.phone_number = validated_data.get('phone_number', existing_user.phone_number)
            existing_user.requested_organization_name = validated_data.get('requested_organization_name', '')
            existing_user.requested_organization_type = validated_data.get('requested_organization_type', '')
            existing_user.requested_organization = validated_data.get('requested_organization')
            existing_user.approval_status = 'PENDING'
            existing_user.set_password(validated_data['password'])
            existing_user.save()
            return existing_user

        # Otherwise create a brand new user
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='ORG_ADMIN',
            approval_status='PENDING',  # Pending approval
            requested_organization=validated_data.get('requested_organization'),  # Can be None
            requested_organization_name=validated_data.get('requested_organization_name', ''),
            requested_organization_type=validated_data.get('requested_organization_type', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# Admin Approval Serializer (for displaying pending requests)
class AdminApprovalSerializer(serializers.ModelSerializer):
    organization_name = serializers.SerializerMethodField()
    organization_type = serializers.SerializerMethodField()
    approval_decided_by_username = serializers.SerializerMethodField()
    approval_decided_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'approval_status', 'requested_organization',
            'organization_name', 'organization_type', 'rejection_reason',
            'approval_requested_at', 'approval_decided_at', 'approval_decided_by',
            'approval_decided_by_username'
        ]
        read_only_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number',
                           'approval_requested_at', 'approval_decided_by']
    
    def get_organization_name(self, obj):
        current_name = None
        if obj.organization:
            current_name = obj.organization.name
        elif obj.requested_organization:
            current_name = obj.requested_organization.name
            
        requested_name = obj.requested_organization_name
        
        if requested_name:
            if current_name and current_name != requested_name:
                return f"{requested_name} (changed to {current_name})"
            return requested_name
            
        return current_name or 'Not assigned'
    
    def get_organization_type(self, obj):
        current_type = None
        if obj.organization:
            current_type = obj.organization.org_type
        elif obj.requested_organization:
            current_type = obj.requested_organization.org_type
            
        requested_type = obj.requested_organization_type
        
        if requested_type:
            if current_type and current_type != requested_type:
                return f"{requested_type} (changed to {current_type})"
            return requested_type
            
        return current_type or 'N/A'

    def get_approval_decided_by_username(self, obj):
        decider = obj.approval_decided_by
        
        # If approval_decided_by is not set, use the fallback logic for ORG_ADMIN
        if not decider:
            if obj.role == 'ORG_ADMIN' and obj.organization:
                # Find the oldest active admin in the same organization
                decider = User.objects.filter(
                    organization=obj.organization,
                    role='ORG_ADMIN'
                ).exclude(id=obj.id).order_by('date_joined').first()
        
        if decider:
            if decider.role == 'ORG_ADMIN':
                first = decider.first_name or ''
                last = decider.last_name or ''
                full_name = f"{first} {last}".strip()
                if not full_name:
                    full_name = decider.username
                return f"Org Admin ({full_name})"
            elif decider.role == 'ADMIN':
                return 'System Admin'
            else:
                return decider.username
                
        return 'System Admin'

    def get_approval_decided_at(self, obj):
        if obj.approval_decided_at:
            return obj.approval_decided_at
        # Fall back to date_joined for invited users
        return obj.date_joined

class SectionDetailSerializer(serializers.ModelSerializer):
    organization_name = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    created_by_role = serializers.CharField(source='created_by.role', read_only=True, allow_null=True)
    
    def get_organization_name(self, obj):
        return obj.organization.name if obj.organization else None
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'organization', 'organization_name', 'created_by', 'created_by_username', 'created_by_role']

# 2.5 Need Item Serializer with section detail
class NeedItemSerializer(serializers.ModelSerializer):
    section_detail = SectionDetailSerializer(source='section', read_only=True)
    quantity_received = serializers.IntegerField(read_only=True)
    quantity_confirmed = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    description = serializers.CharField(required=False, allow_blank=True)
    name = serializers.CharField(required=True, max_length=200)
    
    class Meta:
        model = NeedItem
        fields = [
            'id', 'section', 'section_detail', 'name', 'priority', 
            'quantity_required', 'quantity_received', 'quantity_confirmed', 'unit', 
            'description', 'created_at'
        ]

    def get_quantity_confirmed(self, obj):
        if hasattr(obj, 'quantity_confirmed'):
            return obj.quantity_confirmed
        from django.db.models import Sum
        result = obj.donations.filter(
            status__in=['CONFIRMED', 'FULFILLED']
        ).aggregate(total=Sum('quantity'))
        return result['total'] or 0

# 3. Section Serializer (Includes the needs inside it)
class SectionSerializer(serializers.ModelSerializer):
    needs = NeedItemSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    created_by_role = serializers.CharField(source='created_by.role', read_only=True, allow_null=True)

    class Meta:
        model = Section
        fields = ['id', 'organization', 'name', 'head_of_section', 'needs', 'created_by', 'created_by_username', 'created_by_role']

# 4. Organization Serializer (Includes sections inside it)
class OrganizationSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    admins = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'registration_number', 'address', 'district', 
            'org_type', 'description', 'phone', 'email_contact', 'website', 
            'established_year', 'admins', 'sections', 'latitude', 'longitude',
        ]
        
    def get_admins(self, obj):
        return [admin.username for admin in obj.admins.all()]

    def validate_name(self, value):
        """Check if organization name is unique"""
        queryset = Organization.objects.filter(name__iexact=value)
        # If updating, exclude the current object
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(f"Organization with name '{value}' already exists.")
        return value

# 5. Document Upload Serializer
class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentUpload
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'uploaded_at', 'status', 'ai_extracted_json']
    
    def validate_file(self, value):
        """
        Validate the uploaded file.
        """
        # Check if file exists
        if not value:
            raise serializers.ValidationError(
                "No file was uploaded. Please attach a PDF file."
            )
        
        # Check file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError(
                f"Invalid file type: '{value.name}'. Only PDF files are supported. "
                f"Please upload a file with .pdf extension."
            )
        
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large: {value.size / (1024*1024):.1f}MB. "
                f"Maximum file size is 10MB. Please upload a smaller file."
            )
        
        # Check minimum file size (at least 1KB)
        min_size = 1024  # 1KB
        if value.size < min_size:
            raise serializers.ValidationError(
                "File too small. The PDF appears to be empty or corrupted. "
                "Please upload a valid PDF document."
            )
        
        return value
    
    def validate_organization(self, value):
        """
        Validate the organization exists.
        """
        if not value:
            raise serializers.ValidationError(
                "Organization is required. Please specify which organization this document belongs to."
            )
        return value

# 6. Donation Serializer
class NeedItemDetailSerializer(serializers.ModelSerializer):
    """Nested serializer for displaying need item details in donation responses"""
    class Meta:
        model = NeedItem
        fields = ['id', 'name', 'unit']

class DonationSerializer(serializers.ModelSerializer):
    need_item_detail = NeedItemDetailSerializer(source='need_item', read_only=True)
    confirmed_by_name = serializers.SerializerMethodField()
    confirmed_by_role = serializers.SerializerMethodField()
    cancelled_by_name = serializers.SerializerMethodField()
    cancelled_by_role = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    received_by_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Donation
        fields = [
            'id', 'donor', 'need_item', 'need_item_detail', 'quantity', 'status', 
            'message', 'estimated_delivery_date', 'created_at', 'donor_type',
            'donor_name', 'donor_contact', 'donor_organization', 'donor_address',
            'donor_email', 'donor_phone', 'government_department', 'government_program',
            'government_officer_name', 'government_officer_designation',
            'government_officer_contact', 'government_email', 'donation_letter_file',
            'confirmed_by_name', 'confirmed_by_role', 'cancelled_by_name', 'cancelled_by_role', 'cancellation_reason', 'cancelled_at',
            'received_by_name', 'received_by_role'
        ]

    def get_confirmed_by_name(self, obj):
        if obj.confirmed_by:
            if obj.confirmed_by.first_name or obj.confirmed_by.last_name:
                return f"{obj.confirmed_by.first_name} {obj.confirmed_by.last_name}".strip()
            return obj.confirmed_by.username
        return None

    def get_confirmed_by_role(self, obj):
        if obj.confirmed_by:
            return getattr(obj.confirmed_by, 'role', None)
        return None

    def get_cancelled_by_name(self, obj):
        if obj.cancelled_by:
            if obj.cancelled_by.first_name or obj.cancelled_by.last_name:
                return f"{obj.cancelled_by.first_name} {obj.cancelled_by.last_name}".strip()
            return obj.cancelled_by.username
        return None

    def get_cancelled_by_role(self, obj):
        if obj.cancelled_by:
            return getattr(obj.cancelled_by, 'role', None)
        return None

    def get_received_by_name(self, obj):
        if obj.received_by:
            if obj.received_by.first_name or obj.received_by.last_name:
                return f"{obj.received_by.first_name} {obj.received_by.last_name}".strip()
            return obj.received_by.username
        return None

    def get_received_by_role(self, obj):
        if obj.received_by:
            return getattr(obj.received_by, 'role', None)
        return None

