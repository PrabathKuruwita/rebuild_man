from django.shortcuts import render 
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from .models import Organization, Section, NeedItem, DocumentUpload

from .serializers import (
    OrganizationSerializer, 
    SectionSerializer, 
    NeedItemSerializer, 
    DocumentUploadSerializer
)

# 1. Organization ViewSet (Public can read, Admin can edit)
class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

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
    permission_classes = [IsAuthenticatedOrReadOnly]


# 3. Needs ViewSet
class NeedItemViewSet(viewsets.ModelViewSet):
    queryset = NeedItem.objects.all()
    serializer_class = NeedItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

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
    
    # We will secure this later, but for now allow access to test
    permission_classes = [AllowAny]
