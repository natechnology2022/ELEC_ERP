from django.contrib import admin
from django.urls import path, include

admin.site.site_header = "⚡ ElectrospinTEK ERP Administration"
admin.site.site_title = "ElectrospinTEK Portal"
admin.site.index_title = "Machine Tracking, Inventory & Financial ERP Management"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
