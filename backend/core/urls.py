from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, SectionViewSet, NeedItemViewSet, DocumentUploadViewSet

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'needs', NeedItemViewSet)
router.register(r'documents', DocumentUploadViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]