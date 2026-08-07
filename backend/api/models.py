from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password as django_check_password

class UserAccount(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrator'),
        ('admin', 'Operations Admin'),
        ('manager', 'Manager'),
        ('accountant', 'Accountant'),
        ('sales', 'Sales & Finance Manager'),
        ('warehouse', 'Warehouse Manager'),
        ('production', 'Production Lead'),
        ('engineer', 'Field Engineer'),
        ('observer', 'Guest Observer'),
    ]

    fullName = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, help_text="PBKDF2/Argon2/Bcrypt Hashed Password")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='observer')
    isActive = models.BooleanField(default=True)
    isSuperAdmin = models.BooleanField(default=False)
    twoFactorEnabled = models.BooleanField(default=False)
    
    # RBAC Permission Flags
    canManageUsers = models.BooleanField(default=False)
    canEditMachines = models.BooleanField(default=False)
    canManageFinance = models.BooleanField(default=False)
    canManageEngineering = models.BooleanField(default=False)
    canExportReports = models.BooleanField(default=False)
    canClearDb = models.BooleanField(default=False)

    failedLoginAttempts = models.IntegerField(default=0)
    lockoutUntil = models.DateTimeField(null=True, blank=True)
    lastLogin = models.DateTimeField(null=True, blank=True)
    lastActivity = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        """Hashes and sets user password safely."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Checks raw password against hash or legacy plaintext."""
        if not self.password:
            return False
        # If stored as Django hash string
        if self.password.startswith('pbkdf2_') or self.password.startswith('argon2') or self.password.startswith('bcrypt'):
            return django_check_password(raw_password, self.password)
        # Fallback check for legacy plaintext, auto-upgrading to hash
        if self.password == raw_password:
            self.set_password(raw_password)
            self.save(update_fields=['password'])
            return True
        return False

    def is_locked_out(self):
        """Returns True if user is currently locked out due to failed attempts."""
        if self.lockoutUntil and timezone.now() < self.lockoutUntil:
            return True
        return False

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


class ShipmentLeg(models.Model):
    machine = models.ForeignKey(Machine, related_name='shipment_legs', on_delete=models.CASCADE)
    origin = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    shipDate = models.CharField(max_length=20)
    carrier = models.CharField(max_length=100)
    trackingNo = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=50, default='In Transit')
    notes = models.TextField(blank=True, default='')
    docFileName = models.CharField(max_length=255, blank=True, default='')
    docFileData = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.machine.serial}: {self.origin} -> {self.destination} ({self.status})"


class AuditLog(models.Model):
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    user_id = models.IntegerField(null=True, blank=True)
    username = models.CharField(max_length=150, default='System', db_index=True)
    action = models.CharField(max_length=100, default='ACTION', db_index=True)
    module = models.CharField(max_length=100, default='General', db_index=True)
    entity_type = models.CharField(max_length=100, blank=True, default='')
    entity_id = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    result = models.CharField(max_length=20, default='SUCCESS')
    details = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-timestamp', '-id']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] [{self.result}] {self.username} -> {self.action} ({self.module})"
