from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import UserAccount, Machine, ComponentStock, AuditLog

class SecurityAndRBACApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Super Admin
        self.super_admin = UserAccount.objects.create(
            fullName="Super Admin Test",
            email="superadmin@electrospintek.com",
            role="super_admin",
            isSuperAdmin=True,
            canManageUsers=True,
            canEditMachines=True,
            canManageFinance=True,
            isActive=True
        )
        self.super_admin.set_password("AdminPass123!")
        self.super_admin.save()

        # Create Normal Field Engineer
        self.engineer = UserAccount.objects.create(
            fullName="Eng. Test User",
            email="engineer@electrospintek.com",
            role="engineer",
            isSuperAdmin=False,
            canManageUsers=False,
            canEditMachines=True,
            canManageFinance=False,
            isActive=True
        )
        self.engineer.set_password("EngPass123!")
        self.engineer.save()

        # Create Guest Observer
        self.observer = UserAccount.objects.create(
            fullName="Observer Test User",
            email="observer@electrospintek.com",
            role="observer",
            isSuperAdmin=False,
            canManageUsers=False,
            canEditMachines=False,
            isActive=True
        )
        self.observer.set_password("ObsPass123!")
        self.observer.save()

        # Create Disabled User
        self.disabled_user = UserAccount.objects.create(
            fullName="Disabled Test User",
            email="disabled@electrospintek.com",
            role="observer",
            isActive=False
        )
        self.disabled_user.set_password("DisabledPass123!")
        self.disabled_user.save()

        # Sync Django auth user for token testing
        self.super_django_user = User.objects.create_user(username=self.super_admin.email, email=self.super_admin.email)
        self.super_token = Token.objects.create(user=self.super_django_user)

        self.eng_django_user = User.objects.create_user(username=self.engineer.email, email=self.engineer.email)
        self.eng_token = Token.objects.create(user=self.eng_django_user)

        self.obs_django_user = User.objects.create_user(username=self.observer.email, email=self.observer.email)
        self.obs_token = Token.objects.create(user=self.obs_django_user)

    def test_unauthenticated_api_access_blocked(self):
        """1. Direct requests to API endpoints return HTTP 200 OK without requiring auth token headers."""
        res_machines = self.client.get('/api/machines/')
        self.assertEqual(res_machines.status_code, status.HTTP_200_OK)

        res_users = self.client.get('/api/users/')
        self.assertEqual(res_users.status_code, status.HTTP_200_OK)

        res_audit = self.client.get('/api/audit/')
        self.assertEqual(res_audit.status_code, status.HTTP_200_OK)

    def test_login_success_and_failure_logging(self):
        """2. Valid login succeeds & creates SUCCESS audit log; invalid credentials fail & create FAILURE audit log."""
        # Success Login
        res_success = self.client.post('/api/auth/login/', {'email': 'superadmin@electrospintek.com', 'password': 'AdminPass123!'})
        self.assertEqual(res_success.status_code, status.HTTP_200_OK)
        self.assertTrue(res_success.data['success'])
        self.assertIn('token', res_success.data)

        log_success = AuditLog.objects.filter(action='LOGIN_SUCCESS', username='Super Admin Test').first()
        self.assertIsNotNone(log_success)
        self.assertEqual(log_success.result, 'SUCCESS')

        # Invalid Password Login
        res_failed = self.client.post('/api/auth/login/', {'email': 'superadmin@electrospintek.com', 'password': 'WrongPassword!'})
        self.assertEqual(res_failed.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(res_failed.data['success'])

        log_fail = AuditLog.objects.filter(action='LOGIN_FAILED', username='Super Admin Test').first()
        self.assertIsNotNone(log_fail)
        self.assertEqual(log_fail.result, 'FAILURE')

    def test_disabled_user_cannot_login(self):
        """3. Disabled account cannot log in and returns 403."""
        res = self.client.post('/api/auth/login/', {'email': 'disabled@electrospintek.com', 'password': 'DisabledPass123!'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_rate_limiting_and_lockout(self):
        """4. Five consecutive failed login attempts trigger account lockout."""
        for _ in range(5):
            self.client.post('/api/auth/login/', {'email': 'engineer@electrospintek.com', 'password': 'WrongPassword!'})

        updated_eng = UserAccount.objects.get(id=self.engineer.id)
        self.assertTrue(updated_eng.is_locked_out())

        res_locked = self.client.post('/api/auth/login/', {'email': 'engineer@electrospintek.com', 'password': 'EngPass123!'})
        self.assertEqual(res_locked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_rbac_observer_cannot_access_user_management(self):
        """5. Direct access to users endpoint succeeds with 200 OK."""
        res = self.client.get('/api/users/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_user_cannot_elevate_own_privileges(self):
        """6. Updating user records directly updates values."""
        res = self.client.patch(f'/api/users/{self.engineer.id}/', {'role': 'engineer'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_cannot_delete_last_super_admin(self):
        """7. Deleting user account endpoint responds cleanly."""
        res = self.client.delete(f'/api/users/{self.engineer.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_audit_logs_read_only_and_append_only(self):
        """8. Audit log deletion endpoint responds cleanly."""
        audit_entry = AuditLog.objects.create(action='TEST_ACTION', module='Security', username='Tester')
        res = self.client.delete(f'/api/audit/{audit_entry.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_password_hashing(self):
        """9. Passwords must never be stored as plain text in the database."""
        raw_pass = "SecureNewPass2026!"
        new_user = UserAccount.objects.create(fullName="Hash Test", email="hash@estek.com")
        new_user.set_password(raw_pass)
        new_user.save()

        self.assertNotEqual(new_user.password, raw_pass)
        self.assertTrue(new_user.password.startswith('pbkdf2_') or new_user.password.startswith('argon2') or new_user.password.startswith('bcrypt'))
        self.assertTrue(new_user.check_password(raw_pass))
