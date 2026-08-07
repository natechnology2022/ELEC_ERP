from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MachineViewSet, UserAccountViewSet, ComponentStockViewSet, 
    AuditLogViewSet, StatusHistoryViewSet, ServiceRecordViewSet, 
    ShipmentLegViewSet, login_view, logout_view, change_password_view
)

router = DefaultRouter()
router.register(r'machines', MachineViewSet, basename='machines')
router.register(r'users', UserAccountViewSet, basename='users')
router.register(r'stock', ComponentStockViewSet, basename='stock')
router.register(r'audit', AuditLogViewSet, basename='audit')
router.register(r'history', StatusHistoryViewSet, basename='history')
router.register(r'service', ServiceRecordViewSet, basename='service')
router.register(r'shipment-legs', ShipmentLegViewSet, basename='shipment-leg')

urlpatterns = [
    path('auth/login/', login_view, name='api-login'),
    path('auth/logout/', logout_view, name='api-logout'),
    path('auth/change-password/', change_password_view, name='api-change-password'),
    path('', include(router.urls)),
]
