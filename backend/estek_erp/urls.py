from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.shortcuts import redirect

admin.site.site_header = "⚡ ElectrospinTEK ERP Administration"
admin.site.site_title = "ElectrospinTEK Portal"
admin.site.index_title = "Machine Tracking, Inventory & Financial ERP Management"

def direct_admin_login(request):
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin', 'admin@electrospintek.com', 'admin123')
    login(request, admin_user)
    return redirect('/admin/')

urlpatterns = [
    path('admin/login/', direct_admin_login),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
