import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from api.models import UserAccount

print("=== DETAILED USER ACCOUNTS CHECK ===")
for u in UserAccount.objects.all():
    print(f"Email: {u.email} | Active: {u.isActive} | FailedAttempts: {u.failedLoginAttempts} | LockoutUntil: {u.lockoutUntil} | IsLockedOut: {u.is_locked_out()}")
