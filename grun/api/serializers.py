from rest_framework import serializers
from .models import User, CarbonCredit, Transaction, Document

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'organization_name', 
                 'organization_type', 'is_verified', 'wallet_address')
        read_only_fields = ('is_verified',)
        extra_kwargs = {
            'password': {'write_only': True},
            'wallet_address': {'write_only': True}
        }

class CarbonCreditSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    
    class Meta:
        model = CarbonCredit
        fields = '__all__'
        read_only_fields = ('token_id', 'status', 'available_credits')

class TransactionSerializer(serializers.ModelSerializer):
    buyer_details = UserSerializer(source='buyer', read_only=True)
    seller_details = UserSerializer(source='seller', read_only=True)
    carbon_credit_details = CarbonCreditSerializer(source='carbon_credit', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('blockchain_tx_hash', 'status', 'total_amount')

class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    
    class Meta:
        model = Document
        fields = ('file', 'carbon_credit')
        
    def validate_file(self, value):
        # Validate file size (e.g., max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size too large")
        
        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Invalid file type")
        
        return value

class DocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('file_url', 'virus_scanned', 'virus_scan_status')
        
    def get_download_url(self, obj):
        return obj.get_download_url() 