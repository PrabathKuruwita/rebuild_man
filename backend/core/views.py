from django.shortcuts import render 
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from .models import Organization, Section, NeedItem, DocumentUpload
from .permissions import IsAdminOrReadOnly, IsOrgAdminOrReadOnly, IsOwnerOrAdmin, IsDonorOrReadOnly

from .serializers import (
    OrganizationSerializer, 
    SectionSerializer, 
    NeedItemSerializer, 
    DocumentUploadSerializer
)

# 1. Organization ViewSet (Public can read, Admin/OrgAdmin can edit their own)
class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsOrgAdminOrReadOnly]  # Changed to allow org admins to edit their own org

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
