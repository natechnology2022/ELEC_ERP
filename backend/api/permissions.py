from rest_framework import permissions

class IsActiveUser(permissions.BasePermission):
    """
    Global permission check ensuring user is authenticated and active.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # If user is Django User or UserAccount
        user_account = getattr(request, 'user_account', None)
        if user_account:
            return user_account.isActive
        
        return request.user.is_active


class HasRolePermission(permissions.BasePermission):
    """
    Role-Based Access Control (RBAC) permission check for ERP API endpoints.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user = getattr(request, 'user_account', None)
        if not user or not user.isActive:
            return False

        # Super Admin has full access to all endpoints
        if user.isSuperAdmin or user.role == 'super_admin':
            return True

        role = user.role
        method = request.method

        # User Management Endpoint Permissions
        if view.basename == 'users' or 'users' in request.path:
            if method in permissions.SAFE_METHODS:
                return user.canManageUsers or role in ['admin', 'super_admin', 'manager']
            else:
                return user.canManageUsers or role in ['admin', 'super_admin']

        # Machine Tracking Endpoint Permissions
        if view.basename == 'machines' or 'machines' in request.path:
            if method in permissions.SAFE_METHODS:
                return True # All logged-in roles can view machine list
            elif method in ['POST', 'PUT', 'PATCH']:
                return user.canEditMachines or role in ['admin', 'engineer', 'manager', 'production']
            elif method == 'DELETE':
                return user.canEditMachines or role in ['admin']

        # Component Stock Inventory Endpoint Permissions
        if view.basename == 'stock' or 'stock' in request.path:
            if method in permissions.SAFE_METHODS:
                return True
            elif method in ['POST', 'PUT', 'PATCH']:
                return role in ['admin', 'warehouse', 'engineer', 'production', 'manager']
            elif method == 'DELETE':
                return role in ['admin', 'warehouse']

        # Audit Logs Endpoint Permissions (Strictly Append-Only for non-admins)
        if view.basename == 'audit' or 'audit' in request.path:
            if method in permissions.SAFE_METHODS:
                return role in ['admin', 'super_admin', 'manager']
            elif method == 'POST':
                return True # System / backend event logging
            else:
                return user.isSuperAdmin # PUT, PATCH, DELETE strictly forbidden for normal users

        # Status History Log & Service Records
        if view.basename in ['history', 'service', 'shipment-leg']:
            if method in permissions.SAFE_METHODS:
                return True
            else:
                return role in ['admin', 'engineer', 'sales', 'warehouse', 'production']

        return True
