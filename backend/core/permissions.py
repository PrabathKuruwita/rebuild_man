from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    Read-only access for everyone else.
    """
    def has_permission(self, request, view) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for authenticated admins
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'ORG_ADMIN']


class IsOrgAdminOrReadOnly(permissions.BasePermission):
    """
    Organization admins can edit their own organization's data.
    Read-only for others.
    """
    def has_permission(self, request, view) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions for authenticated users with admin roles
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'ORG_ADMIN']
    
    def has_object_permission(self, request, view, obj) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # System admins can edit anything
        if request.user.role == 'ADMIN':
            return True
        
        # Org admins can only edit their own organization's data
        if request.user.role == 'ORG_ADMIN':
            # Check if the object belongs to the admin's organization
            if hasattr(obj, 'organization'):
                return obj.organization.admin_user == request.user
            elif obj.__class__.__name__ == 'Organization':
                return obj.admin_user == request.user
        
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object owner or admin can edit.
    """
    def has_object_permission(self, request, view, obj) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # System admins can do anything
        if request.user.role == 'ADMIN':
            return True
        
        # Object owner can edit
        if hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        
        return False


class IsAdminUser(permissions.BasePermission):
    """Full access for ADMIN / ORG_ADMIN only."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ('ADMIN', 'ORG_ADMIN')


class IsDonorOrReadOnly(permissions.BasePermission):
    """
    Authenticated donors can create entries.
    """
    def has_permission(self, request, view) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # All authenticated users can POST
        return request.user and request.user.is_authenticated
