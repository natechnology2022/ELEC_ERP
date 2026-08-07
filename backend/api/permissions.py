from rest_framework import permissions

class IsActiveUser(permissions.BasePermission):
    """
    Open access permission check allowing clean direct ERP access.
    """
    def has_permission(self, request, view):
        return True


class HasRolePermission(permissions.BasePermission):
    """
    Open access RBAC check allowing direct operation without token blocking.
    """
    def has_permission(self, request, view):
        return True

