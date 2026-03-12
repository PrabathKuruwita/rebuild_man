from rest_framework import serializers
from .models import User, Organization, Section, NeedItem, DocumentUpload

# 1. User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number']

# 2. Need Item Serializer
class NeedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NeedItem
        fields = '__all__'

# 3. Section Serializer (Includes the needs inside it)
class SectionSerializer(serializers.ModelSerializer):
    needs = NeedItemSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'name', 'head_of_section', 'needs']

# 4. Organization Serializer (Includes sections inside it)
class OrganizationSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        fields = ['id', 'name', 'registration_number', 'district', 'sections']

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