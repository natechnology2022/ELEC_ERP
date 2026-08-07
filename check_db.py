import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from api.models import AuditLog, UserAccount

print("=== RECENT AUDIT LOGS ===")
for a in AuditLog.objects.order_by('-id')[:10]:
    print(f"{a.timestamp} | Action: {a.action} | User: {a.username} | Result: {a.result} | Details: {a.details}")

print("=== USER ACCOUNTS ===")
for u in UserAccount.objects.all():
    print(f"Email: {u.email} | Active: {u.isActive} | Password: {u.password[:20]}...")
