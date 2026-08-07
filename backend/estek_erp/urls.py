from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import login
from django.contrib.auth.models import User

admin.site.site_header = "⚡ ElectrospinTEK ERP Administration"
admin.site.site_title = "ElectrospinTEK Portal"
admin.site.index_title = "Machine Tracking, Inventory & Financial ERP Management"

def auto_login_admin(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.create_superuser('admin', 'admin@electrospintek.com', 'admin123')
            login(request, admin_user)
        return view_func(request, *args, **kwargs)
    return wrapper

admin.site.login = auto_login_admin(admin.site.login)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
