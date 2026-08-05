from rest_framework import serializers
from .models import UserAccount, Machine, StatusHistoryLog, ComponentStock, ServiceRecord, AuditLog

class UserAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = '__all__'

class StatusHistoryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistoryLog
        fields = '__all__'

class ServiceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRecord
        fields = '__all__'

class MachineSerializer(serializers.ModelSerializer):
    status_history = StatusHistoryLogSerializer(many=True, read_only=True)
    service_records = ServiceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Machine
        fields = '__all__'

class ComponentStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponentStock
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
