import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
django.setup()

from api.models import UserAccount, Machine, ComponentStock, AuditLog, StatusHistoryLog
from django.contrib.auth.models import User

def seed_database():
    print("🌱 Seeding ElectrospinTEK ERP Database...")

    # 1. Create Django Superuser for Django Admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@electrospintek.com', 'admin123')
        print("✓ Created Django Admin Superuser: admin / admin123")

    # 2. Create ERP User Accounts
    users_data = [
        {'fullName': 'Super Admin', 'email': 'admin@electrospintek.com', 'password': 'admin123', 'role': 'admin'},
        {'fullName': 'Eng. Caner Yilmaz', 'email': 'engineer@electrospintek.com', 'password': 'eng123', 'role': 'engineer'},
        {'fullName': 'Sarah Jenkins (Sales)', 'email': 'sales@electrospintek.com', 'password': 'sales123', 'role': 'sales'},
        {'fullName': 'Guest Observer', 'email': 'observer@electrospintek.com', 'password': 'obs123', 'role': 'observer'},
    ]

    for u in users_data:
        UserAccount.objects.get_or_create(email=u['email'], defaults=u)

    print("✓ Created 4 User Accounts")

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
            'plcVersion': 'v2.10-STABLE',
            'bomRef': 'BOM-LS325-2026',
            'prodStartDate': '2026-01-10',
            'prodEstFinishDate': '2026-02-15',
            'prodActualFinishDate': '2026-02-14',
            'shipDate': '2026-02-18',
            'deliveryDate': '2026-02-22',
            'installationDate': '2026-02-25',
            'installationEngineer': 'Eng. Caner Yilmaz',
            'installationSigned': True,
            'qcPassed': True,
            'qcDate': '2026-02-14',
            'salesYear': '2026'
        },
        {
            'serial': 'TK801045',
            'model': 'ES800H4',
            'customer': 'Stock Warehouse (Turkey)',
            'stage': 'Stock - Turkey',
            'targetLocation': 'Gebze Free Zone Hub, Turkey',
            'invoiceNo': '',
            'orderNo': '',
            'poNo': '',
            'quoteNo': '',
            'quoteAmount': 0,
            'amountPaid': 0,
            'paymentStatus': 'Stock Listing',
            'cadVersion': 'v5.0-PROD',
            'plcVersion': 'v3.01-BETA',
            'bomRef': 'BOM-ES800-2026',
            'prodStartDate': '2026-02-01',
            'prodEstFinishDate': '2026-03-05',
            'prodActualFinishDate': '2026-03-01',
            'shipDate': 'Pending',
            'deliveryDate': 'Pending',
            'installationDate': 'Pending',
            'qcPassed': True,
            'qcDate': '2026-03-01',
            'isStockOrder': True,
            'salesYear': 'UNSOLD_STOCK'
        },
        {
            'serial': 'M5000046',
            'model': 'ES400H3',
            'customer': 'BioMed Nanotech Corp',
            'stage': 'In Production / Fabrication',
            'targetLocation': 'Gebze Factory, Turkey',
            'invoiceNo': 'INV-2026-9042',
            'orderNo': 'ORD-2026-489',
            'poNo': 'PO-BIOMED-99',
            'quoteNo': 'QT-ESTEK-115',
            'quoteAmount': 62000.00,
            'amountPaid': 31000.00,
            'paymentStatus': 'Deposit Received',
            'cadVersion': 'v3.8-MED',
            'plcVersion': 'v2.08',
            'bomRef': 'BOM-ES400-MED',
            'prodStartDate': '2026-02-20',
            'prodEstFinishDate': '2026-03-25',
            'prodActualFinishDate': 'Pending',
            'shipDate': 'Pending',
            'deliveryDate': 'Pending',
            'installationDate': 'Pending',
            'qcPassed': False,
            'qcDate': 'Pending',
            'salesYear': '2026'
        }
    ]

    for m_data in machines_data:
        m, created = Machine.objects.get_or_create(serial=m_data['serial'], defaults=m_data)
        if created:
            StatusHistoryLog.objects.create(
                machine=m,
                stage=m.stage,
                date=m.prodStartDate or '2026-02-01',
                note=f"Initial seed entry created for serial {m.serial}",
                user="System Seed"
            )

    print("✓ Created 3 Seed Machines (LS325044, TK801045, M5000046)")

    # 4. Create Stock Components
    stock_data = [
        {'sku': 'HV-50KV-GEN', 'name': '50kV High Voltage Generator Module', 'category': 'Power Supplies', 'binLocation': 'Bin A-1', 'qty': 12, 'minThreshold': 3, 'unitCost': 3200.00},
        {'sku': 'SYR-DRIVER-M2', 'name': 'Precision Dual Syringe Pump Driver', 'category': 'Fluidics', 'binLocation': 'Bin B-4', 'qty': 18, 'minThreshold': 4, 'unitCost': 1450.00},
        {'sku': 'NOZZLE-ARRAY-32', 'name': '32-Needle Coaxial Emitter Multihead', 'category': 'Emitters', 'binLocation': 'Bin C-2', 'qty': 8, 'minThreshold': 2, 'unitCost': 2100.00},
        {'sku': 'PLC-CPU-S71200', 'name': 'Siemens S7-1200 Industrial PLC CPU', 'category': 'Automation', 'binLocation': 'Bin D-5', 'qty': 5, 'minThreshold': 2, 'unitCost': 1850.00},
    ]

    for s in stock_data:
        ComponentStock.objects.get_or_create(sku=s['sku'], defaults=s)

    print("✓ Created 4 Component Stock Items")

    # 5. Log Seed Event
    AuditLog.objects.create(action="Database initialized and populated with seed data.", user="System")
    print("✨ Seed Process Completed Successfully!")

if __name__ == '__main__':
    seed_database()
