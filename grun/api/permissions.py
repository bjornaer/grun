from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ADMIN'

class IsBuyerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'BUYER'

class IsSellerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'SELLER' 