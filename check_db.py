import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from api.models import UserAccount

print("=== TESTING PASSWORDS FOR ADMIN ===")
admin = UserAccount.objects.filter(email='admin@electrospintek.com').first()
if admin:
    print("Testing 'admin123':", admin.check_password('admin123'))
    print("Testing 'electrospin123':", admin.check_password('electrospin123'))
    print("Testing 'Admin123!':", admin.check_password('Admin123!'))
    print("Failed attempts:", admin.failedLoginAttempts)
    print("Lockout until:", admin.lockoutUntil)
    print("Is locked out:", admin.is_locked_out())
else:
    print("Admin user not found!")
