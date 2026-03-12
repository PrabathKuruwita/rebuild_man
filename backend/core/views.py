from django.shortcuts import render 
from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated, BasePermission
from .models import Organization, Section, NeedItem, DocumentUpload
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from .serializers import (
    OrganizationSerializer, 
    SectionSerializer, 
    NeedItemSerializer, 
    DocumentUploadSerializer,
    RegisterSerializer,
    UserSerializer,
    UpdateProfileSerializer
)

User = get_user_model()


# --- Custom Permissions ---

class IsAdminOrReadOnly(BasePermission):
    """Allow read access to anyone (including anonymous), but write access only to ADMIN / ORG_ADMIN."""
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'ORG_ADMIN')


class IsAdminUser(BasePermission):
    """Full access for ADMIN / ORG_ADMIN only."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'ORG_ADMIN')

# --- Auth Views ---

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UpdateProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)


# --- Password Reset Views ---

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        send_mail(
            subject="Password Reset Request – NeedTracker",
            message=(
                f"Hi {user.username},\n\n"
                f"We received a request to reset your password.\n\n"
                f"Click the link below to set a new password (valid for 1 hour):\n{reset_link}\n\n"
                f"If you did not request this, you can safely ignore this email.\n\n"
                f"— The NeedTracker Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass  # Don't reveal whether the email exists

    # Always return success to prevent email enumeration
    return Response(
        {'message': 'If an account with that email exists, a password reset link has been sent.'},
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uid = request.data.get('uid', '')
    token = request.data.get('token', '')
    new_password = request.data.get('new_password', '')

    if not uid or not token or not new_password:
        return Response({'error': 'uid, token, and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (User.DoesNotExist, ValueError, OverflowError):
        return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'This reset link is invalid or has already been used.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password reset successful. You can now log in.'}, status=status.HTTP_200_OK)


# --- ViewSets ---

# 1. Organization ViewSet (Public can read, Admin can edit)
class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        if Organization.objects.exists():
            return Response(
                {"detail": "Only one organization is allowed in this system. An organization already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    # Custom action to get hierarchy (Org -> Sections -> Needs)
    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        org = self.get_object()
        serializer = self.get_serializer(org)
        return Response(serializer.data)


# 2. Section ViewSet
class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]


# 3. Needs ViewSet
class NeedItemViewSet(viewsets.ModelViewSet):
    queryset = NeedItem.objects.all()
    serializer_class = NeedItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    # Filter needs by priority (e.g., /api/needs/?priority=CRITICAL)
    def get_queryset(self):
        queryset = NeedItem.objects.all()
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        return queryset


# 4. Document Upload View (For AI Processing)
class DocumentUploadViewSet(viewsets.ModelViewSet):
    queryset = DocumentUpload.objects.all()
    serializer_class = DocumentUploadSerializer
    
    permission_classes = [IsAdminUser]
