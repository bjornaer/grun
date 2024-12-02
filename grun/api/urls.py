from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .views import payment_views

router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet, basename='document')

urlpatterns = [
    # Authentication endpoints
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    
    # User management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Carbon Credit endpoints
    path('credits/', views.CarbonCreditListCreateView.as_view(), name='carbon-credits'),
    path('credits/<uuid:pk>/', views.CarbonCreditDetailView.as_view(), name='carbon-credit-detail'),
    path('listings/', views.CarbonCreditListingsView.as_view(), name='listings'),
    
    # Transaction endpoints
    path('purchase/', views.TransactionCreateView.as_view(), name='purchase'),
    path('transactions/', views.TransactionListView.as_view(), name='transactions'),
    
    # Admin endpoints
    path('admin/verify-credit/<uuid:pk>/', views.AdminVerifyCreditView.as_view(), name='verify-credit'),
    path('admin/block-user/<int:pk>/', views.AdminBlockUserView.as_view(), name='block-user'),
    
    # Document endpoints (using router)
    path('', include(router.urls)),
    
    # Additional document endpoints
    path('documents/<uuid:pk>/download/', 
         views.DocumentViewSet.as_view({'get': 'download'}), 
         name='document-download'),
] 