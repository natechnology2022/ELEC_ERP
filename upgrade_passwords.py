import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'estek_erp.settings')
django.setup()

from api.models import UserAccount

def run():
    users = UserAccount.objects.all()
    count = 0
    for u in users:
        if u.email == 'admin@electrospintek.com':
            u.isSuperAdmin = True
            u.canManageUsers = True
            u.canEditMachines = True
            u.canManageFinance = True
            u.canManageEngineering = True
            u.canExportReports = True
            u.canClearDb = True
        
        if not u.password.startswith('pbkdf2_') and not u.password.startswith('argon2') and not u.password.startswith('bcrypt'):
            u.set_password(u.password)
            u.save()
            count += 1
            print(f"Hashed password for user: {u.email}")
        else:
            u.save()
            print(f"Password already hashed for user: {u.email}")

    print(f"Successfully processed {len(users)} users, hashed {count} plaintext passwords!")

if __name__ == '__main__':
    run()
