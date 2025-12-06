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