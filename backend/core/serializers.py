from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Organization, Section, NeedItem, DocumentUpload

User = get_user_model()

# 1. User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'first_name', 'last_name']
        read_only_fields = ['role'] # Role is not editable by default

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
            if not self.instance.check_password(current_password):
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
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'phone_number']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            role='DONOR'  # Default role
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

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
        fields = ['id', 'organization', 'name', 'head_of_section', 'needs']

# 4. Organization Serializer (Includes sections inside it)
class OrganizationSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'registration_number', 'address', 'district',
            'org_type', 'description', 'phone', 'email_contact', 'website',
            'established_year', 'sections',
        ]

# 5. Document Upload Serializer
class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentUpload
        fields = '__all__'