from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    Read-only access for everyone else.
    ORG_ADMIN users can only edit their own organization's data.
    """
    def has_permission(self, request, view) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions for authenticated system admins and org admins
        return (request.user and request.user.is_authenticated and 
                hasattr(request.user, 'role') and
                request.user.role in ['ADMIN', 'ORG_ADMIN'])

    def has_object_permission(self, request, view, obj) -> bool:
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user has role attribute
        if not hasattr(request.user, 'role'):
            return False
        
        # System admins can edit anything
        if request.user.role == 'ADMIN':
            return True
        
        # Org admins can only edit their own organization's data
        if request.user.role == 'ORG_ADMIN':
            # For Organization objects
            if obj.__class__.__name__ == 'Organization':
                return obj == request.user.organization
            # For Section, NeedItem, and other objects with organization reference
            elif hasattr(obj, 'organization'):
                return obj.organization == request.user.organization
            # For Section checking
            elif hasattr(obj, 'section') and hasattr(obj.section, 'organization'):
                return obj.section.organization == request.user.organization
        
        return False


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
                return obj.organization == request.user.organization
            elif obj.__class__.__name__ == 'Organization':
                return obj == request.user.organization
        
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

class IsSystemAdminUser(permissions.BasePermission):
    """Full access for SYSTEM ADMIN only (Not ORG_ADMIN)."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


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
