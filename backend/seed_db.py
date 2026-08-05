import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
django.setup()

from api.models import UserAccount, Machine, ComponentStock, AuditLog, StatusHistoryLog
from django.contrib.auth.models import User

def seed_database():
    print("Seeding ElectrospinTEK ERP Database...")

    # 1. Create Django Superuser for Django Admin
    admin_user, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@electrospintek.com', 'is_staff': True, 'is_superuser': True})
    admin_user.set_password('admin123')
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    print("Created/Updated Django Admin Superuser: admin / admin123")

    # 2. Create ERP User Accounts
    users_data = [
        {'fullName': 'Super Admin', 'email': 'admin@electrospintek.com', 'password': 'admin123', 'role': 'admin'},
        {'fullName': 'Eng. Caner Yilmaz', 'email': 'engineer@electrospintek.com', 'password': 'eng123', 'role': 'engineer'},
        {'fullName': 'Sarah Jenkins (Sales)', 'email': 'sales@electrospintek.com', 'password': 'sales123', 'role': 'sales'},
        {'fullName': 'Guest Observer', 'email': 'observer@electrospintek.com', 'password': 'obs123', 'role': 'observer'},
    ]

    for u in users_data:
        UserAccount.objects.get_or_create(email=u['email'], defaults=u)

    print("Created 4 User Accounts")

    # 3. Create Seed Machines with Strict 8-Char Serials
    machines_data = [
        {
            'serial': 'LS325044',
            'model': 'LS-325',
            'customer': 'Stanford Nanofiber Lab',
            'stage': 'Delivered to Customer',
            'targetLocation': 'Customer Facility - California, USA',
            'invoiceNo': 'INV-2026-9011',
            'orderNo': 'ORD-2026-440',
            'poNo': 'PO-STANFORD-88',
            'quoteNo': 'QT-ESTEK-102',
            'quoteAmount': 85000.00,
            'amountPaid': 85000.00,
            'paymentStatus': 'Fully Paid (100%)',
            'cadVersion': 'v4.2-REV-B',
            'plcVersion': 'v2.1.0-STABLE',
            'bomRef': 'BOM-LS325-2026-A',
            'prodStartDate': '2026-01-10',
            'prodEstFinishDate': '2026-02-15',
            'prodActualFinishDate': '2026-02-14',
            'shipDate': '2026-02-18',
            'deliveryDate': '2026-02-25',
            'installationDate': '2026-03-01',
            'installationEngineer': 'Eng. Caner Yilmaz',
            'installationSigned': True,
            'qcPassed': True,
            'qcDate': '2026-02-14',
            'isStockOrder': False,
            'salesYear': '2026'
        },
        {
            'serial': 'TK801045',
            'model': 'LS-200 PLUS',
            'customer': 'Stock Warehouse (Turkey)',
            'stage': 'Stock - Turkey',
            'targetLocation': 'Stock - Turkey Warehouse',
            'invoiceNo': '',
            'orderNo': 'ORD-2026-441',
            'poNo': '',
            'quoteNo': '',
            'quoteAmount': 0.00,
            'amountPaid': 0.00,
            'paymentStatus': 'Stock Listing',
            'cadVersion': 'v3.8-REV-A',
            'plcVersion': 'v1.9.4',
            'bomRef': 'BOM-LS200P-2026',
            'prodStartDate': '2026-02-01',
            'prodEstFinishDate': '2026-03-10',
            'prodActualFinishDate': '2026-03-08',
            'shipDate': 'Pending',
            'deliveryDate': 'Pending',
            'installationDate': 'Pending',
            'installationEngineer': 'Not Assigned',
            'installationSigned': False,
            'qcPassed': True,
            'qcDate': '2026-03-08',
            'isStockOrder': True,
            'salesYear': 'UNSOLD_STOCK'
        },
        {
            'serial': 'M5000046',
            'model': 'ES400H3',
            'customer': 'BioLab Technologies Inc.',
            'stage': 'In Production / Fabrication',
            'targetLocation': 'In Production / Fabrication',
            'invoiceNo': 'INV-2026-9012',
            'orderNo': 'ORD-2026-442',
            'poNo': 'PO-BIOLAB-2026',
            'quoteNo': 'QT-ESTEK-104',
            'quoteAmount': 112000.00,
            'amountPaid': 56000.00,
            'paymentStatus': 'Deposit Received',
            'cadVersion': 'v5.0-BETA',
            'plcVersion': 'v3.0.1-RC1',
            'bomRef': 'BOM-ES400-2026-X',
            'prodStartDate': '2026-03-01',
            'prodEstFinishDate': '2026-04-20',
            'prodActualFinishDate': 'Pending',
            'shipDate': 'Pending',
            'deliveryDate': 'Pending',
            'installationDate': 'Pending',
            'installationEngineer': 'Eng. Caner Yilmaz',
            'installationSigned': False,
            'qcPassed': False,
            'qcDate': 'Pending',
            'isStockOrder': False,
            'salesYear': '2026'
        }
    ]

    for m_data in machines_data:
        m, _ = Machine.objects.get_or_create(serial=m_data['serial'], defaults=m_data)
        StatusHistoryLog.objects.get_or_create(
            machine=m,
            stage=m.stage,
            defaults={'date': m.prodStartDate or '2026-01-01', 'note': 'Initial production launch', 'user': 'Admin'}
        )

    print("Created 3 Seed Machines (LS325044, TK801045, M5000046)")

    # 4. Create Stock Components
    stock_data = [
        {'sku': 'HV-50KV-GEN', 'name': '50kV High Voltage Generator Module', 'category': 'Power Supplies', 'binLocation': 'Bin A-1', 'qty': 12, 'minThreshold': 3, 'unitCost': 3200.00},
        {'sku': 'SYR-DRIVER-M2', 'name': 'Precision Dual Syringe Pump Driver', 'category': 'Fluidics', 'binLocation': 'Bin B-4', 'qty': 18, 'minThreshold': 4, 'unitCost': 1450.00},
        {'sku': 'NOZZLE-ARRAY-32', 'name': '32-Needle Coaxial Emitter Multihead', 'category': 'Emitters', 'binLocation': 'Bin C-2', 'qty': 8, 'minThreshold': 2, 'unitCost': 2100.00},
        {'sku': 'PLC-CPU-S71200', 'name': 'Siemens S7-1200 Industrial PLC CPU', 'category': 'Automation', 'binLocation': 'Bin D-5', 'qty': 5, 'minThreshold': 2, 'unitCost': 1850.00},
    ]

    for s in stock_data:
        ComponentStock.objects.get_or_create(sku=s['sku'], defaults=s)

    print("Created 4 Component Stock Items")

    # 5. Log Seed Event
    AuditLog.objects.create(action="Database initialized and populated with seed data.", user="System")
    print("Seed Process Completed Successfully!")

if __name__ == '__main__':
    seed_database()
