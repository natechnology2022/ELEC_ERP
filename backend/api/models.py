from django.db import models
from django.utils import timezone

class UserAccount(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrator'),
        ('admin', 'Operations Admin'),
        ('engineer', 'Field Engineer'),
        ('sales', 'Sales & Finance Manager'),
        ('observer', 'Guest Observer'),
    ]

    fullName = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, help_text="PBKDF2/Argon2/Bcrypt Hashed Password")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='observer')
    isActive = models.BooleanField(default=True)
    twoFactorEnabled = models.BooleanField(default=False)
    
    # RBAC Permission Flags
    canManageUsers = models.BooleanField(default=False)
    canEditMachines = models.BooleanField(default=False)
    canManageFinance = models.BooleanField(default=False)
    canManageEngineering = models.BooleanField(default=False)
    canExportReports = models.BooleanField(default=False)
    canClearDb = models.BooleanField(default=False)

    lastLogin = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.fullName} ({self.get_role_display()}) - {self.email}"


class Machine(models.Model):
    STAGE_CHOICES = [
        ('In Production / Fabrication', 'In Production / Fabrication'),
        ('Stock - Turkey', 'Stock - Turkey Warehouse'),
        ('Stock - USA', 'Stock - USA Warehouse'),
        ('Shipping to Customer (from Turkey)', 'Shipping to Customer (from Turkey)'),
        ('Shipping to Customer (from USA)', 'Shipping to Customer (from USA)'),
        ('Delivered to Customer', 'Delivered to Customer'),
    ]

    PAYMENT_CHOICES = [
        ('Unpaid', 'Unpaid / Invoice Sent'),
        ('Deposit Received', 'Deposit Received (50%)'),
        ('Fully Paid (100%)', 'Fully Paid (100%)'),
        ('Stock Listing', 'Stock Listing'),
    ]

    serial = models.CharField(max_length=8, unique=True, help_text="Strict 8-character serial number (e.g. LS325044)")
    model = models.CharField(max_length=100)
    customer = models.CharField(max_length=150, blank=True, default='')
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default='In Production / Fabrication')
    targetLocation = models.CharField(max_length=100, blank=True, default='Stock - Turkey')
    
    invoiceNo = models.CharField(max_length=50, blank=True, default='')
    orderNo = models.CharField(max_length=50, blank=True, default='')
    poNo = models.CharField(max_length=50, blank=True, default='')
    quoteNo = models.CharField(max_length=50, blank=True, default='')
    quoteAmount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amountPaid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paymentStatus = models.CharField(max_length=30, choices=PAYMENT_CHOICES, default='Unpaid')
    
    cadVersion = models.CharField(max_length=50, blank=True, default='')
    plcVersion = models.CharField(max_length=50, blank=True, default='')
    bomRef = models.CharField(max_length=50, blank=True, default='')
    
    prodStartDate = models.CharField(max_length=20, blank=True, default='')
    prodEstFinishDate = models.CharField(max_length=20, blank=True, default='')
    prodActualFinishDate = models.CharField(max_length=20, blank=True, default='Pending')
    shipDate = models.CharField(max_length=20, blank=True, default='Pending')
    deliveryDate = models.CharField(max_length=20, blank=True, default='Pending')
    installationDate = models.CharField(max_length=20, blank=True, default='Pending')
    installationEngineer = models.CharField(max_length=100, blank=True, default='Not Assigned')
    installationSigned = models.BooleanField(default=False)
    
    senderName = models.CharField(max_length=100, blank=True, default='ElectrospinTEK Logistics')
    recipientName = models.CharField(max_length=100, blank=True, default='')
    carrier = models.CharField(max_length=100, blank=True, default='ElectrospinTEK Freight')
    trackingNo = models.CharField(max_length=50, blank=True, default='')
    destination = models.CharField(max_length=150, blank=True, default='')
    
    qcPassed = models.BooleanField(default=False)
    qcDate = models.CharField(max_length=20, blank=True, default='Pending')

    isStockOrder = models.BooleanField(default=False)
    salesYear = models.CharField(max_length=20, default='2026')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.serial} | {self.model} ({self.stage})"


class StatusHistoryLog(models.Model):
    machine = models.ForeignKey(Machine, related_name='status_history', on_delete=models.CASCADE)
    stage = models.CharField(max_length=50)
    date = models.CharField(max_length=20)
    note = models.TextField(blank=True, default='')
    user = models.CharField(max_length=100, default='Admin')

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"{self.machine.serial} -> {self.stage} ({self.date})"


class ComponentStock(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100, default='General')
    binLocation = models.CharField(max_length=50, default='Bin A-1')
    qty = models.IntegerField(default=0)
    minThreshold = models.IntegerField(default=5)
    unitCost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.sku} - {self.name} (Qty: {self.qty})"


class ServiceRecord(models.Model):
    machine = models.ForeignKey(Machine, related_name='service_records', on_delete=models.CASCADE)
    serviceType = models.CharField(max_length=100)
    date = models.CharField(max_length=20)
    engineer = models.CharField(max_length=100)
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.machine.serial} - {self.serviceType} on {self.date}"


class AuditLog(models.Model):
    action = models.TextField()
    user = models.CharField(max_length=100, default='System')
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user}: {self.action}"
