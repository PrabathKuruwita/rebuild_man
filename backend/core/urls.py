from django.urls import path, include, re_path
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
    DonationViewSet,
    AdminApprovalViewSet,
    DonorUserViewSet,
    RegisterView,
    OrgAdminRegisterView,
    MeView,
    custom_login,
    forgot_password,
    reset_password,
    system_stats,
    NotificationViewSet,
)
from .search_views import search

# Create a router with optional trailing slash — matches both /organizations and /organizations/
router = DefaultRouter()
router.trailing_slash = '/?'  # Makes trailing slash optional on all router-generated URLs
router.register(r'organizations', OrganizationViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'needs', NeedItemViewSet)
router.register(r'documents', DocumentUploadViewSet)
router.register(r'donations', DonationViewSet)
router.register(r'donors', DonorUserViewSet, basename='donors')
router.register(r'admin/approvals', AdminApprovalViewSet, basename='admin_approval')
router.register(r'notifications', NotificationViewSet, basename='notification')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    re_path(r'^stats/?$', system_stats, name='system_stats'),
    re_path(r'^search/?$', search, name='search'),
    re_path(r'^auth/register/?$', RegisterView.as_view(), name='auth_register'),
    re_path(r'^auth/register-org-admin/?$', OrgAdminRegisterView.as_view(), name='auth_register_org_admin'),
    re_path(r'^auth/login/?$', custom_login, name='custom_login'),
    re_path(r'^auth/login-jwt/?$', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    re_path(r'^auth/refresh/?$', TokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^auth/me/?$', MeView.as_view(), name='auth_me'),
    re_path(r'^auth/forgot-password/?$', forgot_password, name='auth_forgot_password'),
    re_path(r'^auth/reset-password/?$', reset_password, name='auth_reset_password'),
    path('', include(router.urls)),
]
