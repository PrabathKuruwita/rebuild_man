from django.shortcuts import render 
from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from .models import Organization, Section, NeedItem, DocumentUpload
from .permissions import IsAdminOrReadOnly, IsOrgAdminOrReadOnly, IsOwnerOrAdmin, IsDonorOrReadOnly, IsAdminUser
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

# 1. Organization ViewSet (Public can read, Admin/OrgAdmin can edit their own)
class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsOrgAdminOrReadOnly]  # Changed to allow org admins to edit their own org
User = get_user_model()


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
    permission_classes = [IsOrgAdminOrReadOnly]


# 3. Needs ViewSet
class NeedItemViewSet(viewsets.ModelViewSet):
    queryset = NeedItem.objects.all()
    serializer_class = NeedItemSerializer
    permission_classes = [IsOrgAdminOrReadOnly]

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
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def create(self, request, *args, **kwargs):
        """
        Override create to provide helpful error messages for file upload issues.
        """
        # Check if file is in the request
        if 'file' not in request.FILES:
            return Response({
                'error': 'Missing file',
                'message': 'No file was uploaded in the request.',
                'help': {
                    'issue': 'You need to include a PDF file in your request.',
                    'solution': 'Make sure you are using multipart/form-data format.',
                    'examples': {
                        'curl': 'curl -X POST http://localhost:8000/api/documents/ -u username:password -F "organization=1" -F "file=@document.pdf"',
                        'python': 'requests.post(url, auth=(user, pass), files={"file": open("doc.pdf", "rb")}, data={"organization": 1})',
                        'postman': 'Body tab → select "form-data" → add key "file" with type "File"'
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if organization is in the request
        if 'organization' not in request.data:
            return Response({
                'error': 'Missing organization',
                'message': 'Please specify which organization this document belongs to.',
                'help': {
                    'solution': 'Add "organization" field with the organization ID.',
                    'example_curl': 'curl ... -F "organization=1" -F "file=@document.pdf"',
                    'example_python': 'data = {"organization": 1}; requests.post(url, data=data, files=files)'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check Content-Type header
        content_type = request.content_type
        if content_type and 'multipart/form-data' not in content_type:
            return Response({
                'error': 'Invalid Content-Type',
                'message': f'Received Content-Type: "{content_type}". For file uploads, you must use "multipart/form-data".',
                'help': {
                    'issue': 'You are using the wrong format to send files.',
                    'wrong_approaches': [
                        '❌ Don\'t use: Content-Type: application/json',
                        '❌ Don\'t use: Content-Type: application/pdf',
                        '❌ Don\'t send file path as string'
                    ],
                    'correct_approach': '✅ Use: Content-Type: multipart/form-data (set automatically)',
                    'how_to_fix': {
                        'curl': 'Use -F flag instead of -d or --data: curl -F "file=@document.pdf"',
                        'python_requests': 'Use files parameter, not json: requests.post(url, files={"file": open(...)}, data={...})',
                        'postman': 'Body tab → select "form-data" (not "raw" or "binary")',
                        'javascript': 'Use FormData: const form = new FormData(); form.append("file", file);'
                    }
                }
            }, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
        
        # Proceed with normal creation
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        # Automatically set the uploaded_by field to the current user
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def process_with_ai(self, request, pk=None):
        """
        Process the uploaded document with AI to extract need items.
        """
        from .ai_service import get_document_processor
        
        document = self.get_object()
        
        # Check if already processed
        if document.status == 'PROCESSED':
            return Response({
                'message': 'Document already processed',
                'data': document.ai_extracted_json
            }, status=status.HTTP_200_OK)
        
        # Update status to pending
        document.status = 'PENDING'
        document.save()
        
        try:
            # Process the document
            processor = get_document_processor()
            result = processor.process_document(document)
            
            if result['status'] == 'success':
                # Save the extracted JSON
                document.ai_extracted_json = result
                document.status = 'PROCESSED'
                document.save()
                
                return Response({
                    'message': 'Document processed successfully',
                    'data': result
                }, status=status.HTTP_200_OK)
            else:
                document.status = 'FAILED'
                document.save()
                return Response({
                    'message': 'Processing failed',
                    'error': result.get('error')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            document.status = 'FAILED'
            document.save()
            return Response({
                'message': 'Processing failed',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def approve_and_create_needs(self, request, pk=None):
        """
        Approve the AI-extracted data and create actual NeedItem entries.
        Only admins can approve.
        """
        from .ai_service import get_document_processor
        
        document = self.get_object()
        
        # Check if user is admin
        if request.user.role not in ['ADMIN', 'ORG_ADMIN']:
            return Response({
                'message': 'Only admins can approve documents'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if document is processed
        if document.status != 'PROCESSED':
            return Response({
                'message': 'Document must be processed before approval'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            processor = get_document_processor()
            created_items = processor.create_needs_from_json(
                document.ai_extracted_json,
                document
            )
            
            # Update document status
            document.status = 'APPROVED'
            document.save()
            
            return Response({
                'message': f'Successfully created {len(created_items)} need items',
                'items_created': len(created_items)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'message': 'Failed to create needs',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    permission_classes = [IsAdminUser]
