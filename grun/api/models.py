from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, FileExtensionValidator
from encrypted_model_fields.fields import EncryptedCharField
from ...legaapi.storage import SecureS3Storage
import uuid
from decimal import Decimal
from legaapi.models import YourLegaModel

class User(AbstractUser):
    ROLES = (
        ('BUYER', 'Buyer'),
        ('SELLER', 'Seller'),
        ('ADMIN', 'Admin'),
    )
    
    role = models.CharField(max_length=10, choices=ROLES)
    wallet_address = EncryptedCharField(max_length=255, blank=True, null=True)
    organization_name = models.CharField(max_length=255, blank=True)
    organization_type = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'

class CarbonCredit(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
        ('RETIRED', 'Retired'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_name = models.CharField(max_length=255)
    verifier = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    issuance_date = models.DateField()
    expiry_date = models.DateField()
    total_credits = models.DecimalField(max_digits=20, decimal_places=2)
    available_credits = models.DecimalField(max_digits=20, decimal_places=2)
    token_id = models.CharField(max_length=255, unique=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    price_per_credit = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carbon_credits'

class Transaction(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    buyer = models.ForeignKey(User, related_name='purchases', on_delete=models.PROTECT)
    seller = models.ForeignKey(User, related_name='sales', on_delete=models.PROTECT)
    carbon_credit = models.ForeignKey(CarbonCredit, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=20, decimal_places=2)
    price_per_credit = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    blockchain_tx_hash = models.CharField(max_length=255, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'

class Document(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    carbon_credit = models.ForeignKey('CarbonCredit', on_delete=models.CASCADE, related_name='documents')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()  # in bytes
    file_url = EncryptedCharField(max_length=512)  # Encrypted S3 URL
    upload_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_comments = models.TextField(blank=True)
    reviewed_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='reviewed_documents')
    review_date = models.DateTimeField(null=True, blank=True)
    virus_scanned = models.BooleanField(default=False)
    virus_scan_status = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.file_name} - {self.status}"

    def get_download_url(self, expires_in=3600):
        """Generate a signed URL for secure download"""
        if not self.file_url:
            return None
        return SecureS3Storage().generate_presigned_url(self.file_url, expires_in) 

class Payment(models.Model):
    PAYMENT_TYPES = (
        ('FIAT', 'Fiat Payment'),
        ('CRYPTO', 'Cryptocurrency Payment'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField('Transaction', on_delete=models.PROTECT, related_name='payment')
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=20, decimal_places=2)
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    stripe_payment_intent = models.CharField(max_length=255, null=True, blank=True)
    crypto_transaction_hash = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_fee(self):
        """Calculate platform fee (e.g., 2%)"""
        return self.amount * Decimal('0.02')

    def save(self, *args, **kwargs):
        if not self.fee_amount:
            self.fee_amount = self.calculate_fee()
        if not self.total_amount:
            self.total_amount = self.amount + self.fee_amount
        super().save(*args, **kwargs)

class Receipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True)
    pdf_url = models.URLField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_receipt_number(self):
        return f"RCP-{self.created_at.strftime('%Y%m%d')}-{str(self.id)[:8]}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            self.receipt_number = self.generate_receipt_number()
        super().save(*args, **kwargs) 