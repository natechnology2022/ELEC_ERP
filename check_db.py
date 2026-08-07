import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from api.models import Machine, UserAccount

print("=== LIVE DJANGO DB CHECK ===")
print("Machine count:", Machine.objects.count())
for m in Machine.objects.all():
    print(f"  - ID: {m.id} | Serial: {m.serial} | Model: {m.model} | Customer: {m.customer}")

print("User count:", UserAccount.objects.count())
for u in UserAccount.objects.all():
    print(f"  - User: {u.email} | Role: {u.role} | Active: {u.isActive}")
