from django.contrib import admin
from .models import UserAccount, Machine, StatusHistoryLog, ComponentStock, ServiceRecord, AuditLog

class StatusHistoryLogInline(admin.TabularInline):
    model = StatusHistoryLog
    extra = 1

class ServiceRecordInline(admin.TabularInline):
    model = ServiceRecord
    extra = 1

@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = (
        'serial', 'model', 'customer', 'stage', 
        'invoiceNo', 'quoteAmount', 'amountPaid', 
        'paymentStatus', 'prodEstFinishDate'
    )
    list_filter = ('stage', 'paymentStatus', 'salesYear', 'isStockOrder', 'qcPassed')
    search_fields = ('serial', 'model', 'customer', 'invoiceNo', 'orderNo', 'poNo', 'quoteNo')
    inlines = [StatusHistoryLogInline, ServiceRecordInline]
    ordering = ('-id',)


@admin.register(UserAccount)
class UserAccountAdmin(admin.ModelAdmin):
    list_display = ('fullName', 'email', 'role', 'isActive', 'created_at')
    list_filter = ('role', 'isActive')
    search_fields = ('fullName', 'email')


@admin.register(ComponentStock)
class ComponentStockAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'binLocation', 'qty', 'minThreshold', 'unitCost')
    list_filter = ('category', 'binLocation')
    search_fields = ('sku', 'name')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action')
    search_fields = ('action', 'user')
    readonly_fields = ('timestamp', 'user', 'action')


@admin.register(ServiceRecord)
class ServiceRecordAdmin(admin.ModelAdmin):
    list_display = ('machine', 'serviceType', 'date', 'engineer')
    list_filter = ('serviceType', 'engineer')
    search_fields = ('machine__serial', 'engineer', 'notes')
