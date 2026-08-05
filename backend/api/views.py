from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserAccount, Machine, StatusHistoryLog, ComponentStock, ServiceRecord, AuditLog
from .serializers import (
    UserAccountSerializer, MachineSerializer, 
    StatusHistoryLogSerializer, ComponentStockSerializer, 
    AuditLogSerializer, ServiceRecordSerializer
)

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all().order_by('-id')
    serializer_class = MachineSerializer

class UserAccountViewSet(viewsets.ModelViewSet):
    queryset = UserAccount.objects.all().order_by('-id')
    serializer_class = UserAccountSerializer

class ComponentStockViewSet(viewsets.ModelViewSet):
    queryset = ComponentStock.objects.all().order_by('name')
    serializer_class = ComponentStockSerializer

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all().order_by('-id')
    serializer_class = AuditLogSerializer

class StatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = StatusHistoryLog.objects.all().order_by('-id')
    serializer_class = StatusHistoryLogSerializer

class ServiceRecordViewSet(viewsets.ModelViewSet):
    queryset = ServiceRecord.objects.all().order_by('-id')
    serializer_class = ServiceRecordSerializer

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()
    
    try:
        user = UserAccount.objects.get(email__iexact=email, password=password, isActive=True)
        return Response({
            'success': True,
            'user': UserAccountSerializer(user).data
        })
    except UserAccount.DoesNotExist:
        return Response({'success': False, 'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
