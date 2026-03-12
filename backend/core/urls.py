from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    OrganizationViewSet, 
    SectionViewSet, 
    NeedItemViewSet, 
    DocumentUploadViewSet,
    RegisterView,
    MeView,
    forgot_password,
    reset_password,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'needs', NeedItemViewSet)
router.register(r'documents', DocumentUploadViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('auth/forgot-password/', forgot_password, name='auth_forgot_password'),
    path('auth/reset-password/', reset_password, name='auth_reset_password'),
    path('', include(router.urls)),
]