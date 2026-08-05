from django.contrib import admin
from .models import UserAccount, Machine, StatusHistoryLog, ComponentStock, ServiceRecord, AuditLog, ShipmentLeg

admin.site.site_header = "ElectrospinTEK ERP Administration Portal"
admin.site.site_title = "ElectrospinTEK ERP Admin"
admin.site.index_title = "System Management & Database Control Center"

class StatusHistoryLogInline(admin.TabularInline):
    model = StatusHistoryLog
    extra = 1

class ServiceRecordInline(admin.TabularInline):
    model = ServiceRecord
    extra = 1

class ShipmentLegInline(admin.TabularInline):
    model = ShipmentLeg
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
    inlines = [StatusHistoryLogInline, ServiceRecordInline, ShipmentLegInline]
    ordering = ('-id',)


@admin.register(ShipmentLeg)
class ShipmentLegAdmin(admin.ModelAdmin):
    list_display = ('machine', 'origin', 'destination', 'shipDate', 'carrier', 'trackingNo', 'status')
    list_filter = ('status', 'carrier')
    search_fields = ('machine__serial', 'origin', 'destination', 'trackingNo', 'notes')


@admin.register(UserAccount)
class UserAccountAdmin(admin.ModelAdmin):
    list_display = (
        'fullName', 'email', 'role', 'isActive', 
        'twoFactorEnabled', 'canManageUsers', 'canEditMachines', 
        'canManageFinance', 'created_at'
    )
    list_filter = ('role', 'isActive', 'twoFactorEnabled', 'canManageUsers', 'canEditMachines')
    search_fields = ('fullName', 'email')
    fieldsets = (
        ('Account Credentials', {
            'fields': ('fullName', 'email', 'password', 'role', 'isActive')
        }),
        ('Security & 2FA', {
            'fields': ('twoFactorEnabled', 'lastLogin')
        }),
        ('Module RBAC Permissions', {
            'fields': (
                'canManageUsers', 'canEditMachines', 'canManageFinance',
                'canManageEngineering', 'canExportReports', 'canClearDb'
            )
        }),
    )


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
