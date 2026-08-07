from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle

from .models import UserAccount, Machine, StatusHistoryLog, ComponentStock, ServiceRecord, AuditLog, ShipmentLeg
from .serializers import (
    UserAccountSerializer, MachineSerializer, 
    StatusHistoryLogSerializer, ComponentStockSerializer, 
    AuditLogSerializer, ServiceRecordSerializer, ShipmentLegSerializer
)
from .permissions import IsActiveUser, HasRolePermission


def get_client_ip(request):
    """Utility to extract client IP address handling proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_authenticated_user_account(request):
    """Retrieve UserAccount instance associated with request."""
    if not request.user or not request.user.is_authenticated:
        return None
    try:
        return UserAccount.objects.get(email__iexact=request.user.email)
    except UserAccount.DoesNotExist:
        return None


def log_audit_event(request, action, module, result='SUCCESS', details='', entity_type='', entity_id='', user_account=None):
    """Centralized Audit Logging Service."""
    if not user_account:
        user_account = get_authenticated_user_account(request)

    username = user_account.fullName if user_account else (request.data.get('email') or 'System')
    user_id = user_account.id if user_account else None
    ip = get_client_ip(request)

    AuditLog.objects.create(
        user_id=user_id,
        username=username,
        action=action,
        module=module,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip,
        result=result,
        details=details
    )


class LoginRateThrottle(AnonRateThrottle):
    rate = '10/minute'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    """
    Secure Login View with Argon2/PBKDF2 Password Hashing, Lockout, and Audit Logging.
    """
    identifier = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()

    if not identifier or not password:
        log_audit_event(request, 'LOGIN_FAILED', 'Authentication', result='FAILURE', details='Missing email or password')
        return Response({'success': False, 'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        user = UserAccount.objects.filter(
            Q(email__iexact=identifier) | Q(fullName__iexact=identifier)
        ).first()

        if not user:
            # Generic response to prevent account enumeration
            log_audit_event(request, 'LOGIN_FAILED', 'Authentication', result='FAILURE', details=f'Invalid user identifier: {identifier}')
            return Response({'success': False, 'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check Account Active Status
        if not user.isActive:
            log_audit_event(request, 'LOGIN_BLOCKED', 'Authentication', result='FAILURE', details=f'Disabled account login attempt: {user.email}', user_account=user)
            return Response({'success': False, 'message': 'Account disabled. Contact Administrator.'}, status=status.HTTP_403_FORBIDDEN)

        # Check Brute Force Lockout
        if user.is_locked_out():
            time_left = int((user.lockoutUntil - timezone.now()).total_seconds() / 60)
            log_audit_event(request, 'LOGIN_LOCKOUT', 'Authentication', result='FAILURE', details=f'Locked out account login attempt ({time_left} min left)', user_account=user)
            return Response({'success': False, 'message': f'Account locked due to failed login attempts. Try again in {time_left + 1} minutes.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Verify Password
        if not user.check_password(password):
            user.failedLoginAttempts += 1
            if user.failedLoginAttempts >= 5:
                user.lockoutUntil = timezone.now() + timedelta(minutes=15)
                log_audit_event(request, 'ACCOUNT_LOCKED', 'Security', result='FAILURE', details=f'Account locked after 5 failed attempts: {user.email}', user_account=user)
            user.save(update_fields=['failedLoginAttempts', 'lockoutUntil'])
            
            log_audit_event(request, 'LOGIN_FAILED', 'Authentication', result='FAILURE', details=f'Incorrect password attempt for {user.email}', user_account=user)
            return Response({'success': False, 'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Login Success: Reset lockout counters
        user.failedLoginAttempts = 0
        user.lockoutUntil = None
        user.lastLogin = timezone.now()
        user.lastActivity = timezone.now()
        user.save(update_fields=['failedLoginAttempts', 'lockoutUntil', 'lastLogin', 'lastActivity'])

        # Sync or get corresponding Django Auth User for Token Generation
        django_user, _ = User.objects.get_or_create(username=user.email, defaults={'email': user.email, 'first_name': user.fullName})
        token, _ = Token.objects.get_or_create(user=django_user)

        log_audit_event(request, 'LOGIN_SUCCESS', 'Authentication', result='SUCCESS', details=f'User logged in securely ({user.get_role_display()})', user_account=user)

        return Response({
            'success': True,
            'token': token.key,
            'user': UserAccountSerializer(user).data
        })

    except Exception as e:
        log_audit_event(request, 'LOGIN_ERROR', 'Authentication', result='ERROR', details=str(e))
        return Response({'success': False, 'message': 'Authentication error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint invalidating user session & token."""
    user_account = get_authenticated_user_account(request)
    if request.user:
        Token.objects.filter(user=request.user).delete()
    
    log_audit_event(request, 'LOGOUT', 'Authentication', result='SUCCESS', details='User logged out', user_account=user_account)
    return Response({'success': True, 'message': 'Signed out successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Allows authenticated user to securely change their password."""
    user_account = get_authenticated_user_account(request)
    if not user_account:
        return Response({'success': False, 'message': 'User not found'}, status=404)

    old_pass = request.data.get('old_password', '')
    new_pass = request.data.get('new_password', '')

    if not old_pass or not new_pass or len(new_pass) < 8:
        return Response({'success': False, 'message': 'New password must be at least 8 characters.'}, status=400)

    if not user_account.check_password(old_pass):
        log_audit_event(request, 'PASSWORD_CHANGE_FAILED', 'Security', result='FAILURE', details='Incorrect current password', user_account=user_account)
        return Response({'success': False, 'message': 'Current password is incorrect.'}, status=400)

    user_account.set_password(new_pass)
    user_account.save(update_fields=['password'])
    log_audit_event(request, 'PASSWORD_CHANGE', 'Security', result='SUCCESS', details='User changed their password', user_account=user_account)

    return Response({'success': True, 'message': 'Password updated successfully.'})


class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all().order_by('-id')
    serializer_class = MachineSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_event(self.request, 'CREATE_MACHINE', 'Machine Tracking', entity_type='Machine', entity_id=instance.serial, details=f'Created machine {instance.serial} ({instance.model})')

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_event(self.request, 'UPDATE_MACHINE', 'Machine Tracking', entity_type='Machine', entity_id=instance.serial, details=f'Updated machine {instance.serial}')

    def perform_destroy(self, instance):
        serial = instance.serial
        instance.delete()
        log_audit_event(self.request, 'DELETE_MACHINE', 'Machine Tracking', entity_type='Machine', entity_id=serial, details=f'Deleted machine record {serial}')


class UserAccountViewSet(viewsets.ModelViewSet):
    queryset = UserAccount.objects.all().order_by('-id')
    serializer_class = UserAccountSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]

    def perform_create(self, serializer):
        requesting_user = get_authenticated_user_account(self.request)
        is_super = serializer.validated_data.get('isSuperAdmin', False)
        role = serializer.validated_data.get('role', 'observer')

        # Prevent normal admins from creating Super Admin
        if is_super and not (requesting_user and requesting_user.isSuperAdmin):
            serializer.validated_data['isSuperAdmin'] = False
            serializer.validated_data['role'] = 'admin' if role == 'super_admin' else role

        instance = serializer.save()
        log_audit_event(self.request, 'CREATE_USER', 'User Management', entity_type='UserAccount', entity_id=str(instance.id), details=f'Created user {instance.email} ({instance.role})')

    def perform_update(self, serializer):
        requesting_user = get_authenticated_user_account(self.request)
        target = self.get_object()

        # Prevent non-superadmin from editing superadmin or elevating own privileges
        if target.isSuperAdmin and not (requesting_user and requesting_user.isSuperAdmin):
            return Response({'detail': 'Only Super Admin can modify Super Admin accounts.'}, status=status.HTTP_403_FORBIDDEN)

        if requesting_user and requesting_user.id == target.id and not requesting_user.isSuperAdmin:
            # User cannot elevate their own role
            serializer.validated_data.pop('role', None)
            serializer.validated_data.pop('isSuperAdmin', None)
            serializer.validated_data.pop('canManageUsers', None)

        instance = serializer.save()
        log_audit_event(self.request, 'UPDATE_USER', 'User Management', entity_type='UserAccount', entity_id=str(instance.id), details=f'Updated user account {instance.email}')

    def perform_destroy(self, instance):
        requesting_user = get_authenticated_user_account(self.request)

        # Prevent deletion of the primary / last Super Admin account
        if instance.isSuperAdmin:
            super_admin_count = UserAccount.objects.filter(isSuperAdmin=True).count()
            if super_admin_count <= 1:
                log_audit_event(self.request, 'SUPER_ADMIN_DELETE_BLOCKED', 'Security', result='FAILURE', details='Attempted deletion of last Super Admin account')
                raise Response({'detail': 'Cannot delete the last Super Admin account.'}, status=status.HTTP_400_BAD_REQUEST)

        email = instance.email
        instance.delete()
        log_audit_event(self.request, 'DELETE_USER', 'User Management', entity_type='UserAccount', entity_id=email, details=f'Deleted user account {email}')


class ComponentStockViewSet(viewsets.ModelViewSet):
    queryset = ComponentStock.objects.all().order_by('name')
    serializer_class = ComponentStockSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_event(self.request, 'CREATE_STOCK', 'Inventory', entity_type='ComponentStock', entity_id=instance.sku, details=f'Added component stock {instance.sku}')

    def perform_update(self, serializer):
        instance = serializer.save()
        log_audit_event(self.request, 'UPDATE_STOCK', 'Inventory', entity_type='ComponentStock', entity_id=instance.sku, details=f'Updated stock item {instance.sku}')

    def perform_destroy(self, instance):
        sku = instance.sku
        instance.delete()
        log_audit_event(self.request, 'DELETE_STOCK', 'Inventory', entity_type='ComponentStock', entity_id=sku, details=f'Deleted stock item {sku}')


class AuditLogViewSet(viewsets.ModelViewSet):
    """
    Searchable, Filterable, Append-Only Audit Log API ViewSet.
    """
    queryset = AuditLog.objects.all().order_by('-timestamp', '-id')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'action', 'module', 'details', 'ip_address', 'result']
    ordering_fields = ['timestamp', 'action', 'username', 'module']

    def get_queryset(self):
        qs = super().get_queryset()
        module = self.request.query_params.get('module')
        action = self.request.query_params.get('action')
        result_param = self.request.query_params.get('result')
        username = self.request.query_params.get('username')

        if module:
            qs = qs.filter(module__iexact=module)
        if action:
            qs = qs.filter(action__iexact=action)
        if result_param:
            qs = qs.filter(result__iexact=result_param)
        if username:
            qs = qs.filter(username__icontains=username)

        return qs

    def destroy(self, request, *args, **kwargs):
        user = get_authenticated_user_account(request)
        if not user or not user.isSuperAdmin:
            log_audit_event(request, 'AUDIT_DELETE_BLOCKED', 'Security', result='FAILURE', details='Non-superadmin attempted to delete audit logs')
            return Response({'detail': 'Audit logs are append-only and cannot be deleted.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class StatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = StatusHistoryLog.objects.all().order_by('-id')
    serializer_class = StatusHistoryLogSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]


class ServiceRecordViewSet(viewsets.ModelViewSet):
    queryset = ServiceRecord.objects.all().order_by('-id')
    serializer_class = ServiceRecordSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]


class ShipmentLegViewSet(viewsets.ModelViewSet):
    queryset = ShipmentLeg.objects.all().order_by('-id')
    serializer_class = ShipmentLegSerializer
    permission_classes = [IsAuthenticated, HasRolePermission]
