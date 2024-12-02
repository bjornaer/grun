from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CarbonCredit, Transaction

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'organization_name', 'is_verified', 'is_blocked')
    list_filter = ('role', 'is_verified', 'is_blocked')
    search_fields = ('username', 'email', 'organization_name')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Information', {
            'fields': ('role', 'wallet_address', 'organization_name', 
                      'organization_type', 'is_verified', 'is_blocked'),
        }),
    )

@admin.register(CarbonCredit)
class CarbonCreditAdmin(admin.ModelAdmin):
    list_display = ('id', 'project_name', 'owner', 'total_credits', 
                   'available_credits', 'status', 'price_per_credit')
    list_filter = ('status', 'verifier')
    search_fields = ('project_name', 'owner__username', 'token_id')
    readonly_fields = ('token_id',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'seller', 'carbon_credit', 
                   'quantity', 'total_amount', 'status')
    list_filter = ('status', 'created_at')
    search_fields = ('buyer__username', 'seller__username', 
                    'carbon_credit__project_name', 'blockchain_tx_hash')
    readonly_fields = ('blockchain_tx_hash',) 