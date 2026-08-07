from rest_framework import serializers
from .models import UserAccount, Machine, StatusHistoryLog, ComponentStock, ServiceRecord, AuditLog, ShipmentLeg

class UserAccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = UserAccount
        fields = [
            'id', 'fullName', 'email', 'password', 'role', 'isActive', 'isSuperAdmin',
            'twoFactorEnabled', 'canManageUsers', 'canEditMachines', 'canManageFinance',
            'canManageEngineering', 'canExportReports', 'canClearDb',
            'failedLoginAttempts', 'lockoutUntil', 'lastLogin', 'lastActivity', 'created_at'
        ]
        read_only_fields = ['id', 'failedLoginAttempts', 'lockoutUntil', 'lastLogin', 'created_at']

    def create(self, validated_data):
        raw_password = validated_data.pop('password', None)
        user = UserAccount(**validated_data)
        if raw_password:
            user.set_password(raw_password)
        else:
            user.set_password('electrospin123')
        user.save()
        return user

    def update(self, instance, validated_data):
        raw_password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if raw_password:
            instance.set_password(raw_password)
        instance.save()
        return instance


class StatusHistoryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistoryLog
        fields = '__all__'


class ServiceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRecord
        fields = '__all__'


class ShipmentLegSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentLeg
        fields = '__all__'


class MachineSerializer(serializers.ModelSerializer):
    status_history = StatusHistoryLogSerializer(many=True, read_only=True)
    service_records = ServiceRecordSerializer(many=True, read_only=True)
    shipment_legs = ShipmentLegSerializer(many=True, read_only=True)

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
        fields = [
            'id', 'timestamp', 'user_id', 'username', 'action', 
            'module', 'entity_type', 'entity_id', 'ip_address', 'result', 'details'
        ]
        read_only_fields = ['id', 'timestamp']
