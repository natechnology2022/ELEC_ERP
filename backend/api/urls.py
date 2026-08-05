from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MachineViewSet, UserAccountViewSet, ComponentStockViewSet, 
    AuditLogViewSet, StatusHistoryViewSet, ServiceRecordViewSet, login_view
)

router = DefaultRouter()
router.register(r'machines', MachineViewSet)
router.register(r'users', UserAccountViewSet)
router.register(r'stock', ComponentStockViewSet)
router.register(r'audit', AuditLogViewSet)
router.register(r'history', StatusHistoryViewSet)
router.register(r'service', ServiceRecordViewSet)

urlpatterns = [
    path('auth/login/', login_view, name='api-login'),
    path('', include(router.urls)),
]
