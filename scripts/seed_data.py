import os
import django
import sys
from datetime import datetime, timedelta
from decimal import Decimal

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from grun.api.models import User, CarbonCredit, Transaction, Document
from django.utils import timezone

def create_users():
    # Create admin user
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123',
        role='ADMIN'
    )

    # Create seller users
    seller1 = User.objects.create_user(
        username='seller1',
        email='seller1@example.com',
        password='seller123',
        role='SELLER',
        organization_name='Green Energy Corp',
        organization_type='Corporation',
        wallet_address='0x1234567890123456789012345678901234567890',
        is_verified=True
    )

    seller2 = User.objects.create_user(
        username='seller2',
        email='seller2@example.com',
        password='seller123',
        role='SELLER',
        organization_name='Eco Solutions Ltd',
        organization_type='Corporation',
        wallet_address='0x2345678901234567890123456789012345678901',
        is_verified=True
    )

    # Create buyer users
    buyer1 = User.objects.create_user(
        username='buyer1',
        email='buyer1@example.com',
        password='buyer123',
        role='BUYER',
        wallet_address='0x3456789012345678901234567890123456789012'
    )

    buyer2 = User.objects.create_user(
        username='buyer2',
        email='buyer2@example.com',
        password='buyer123',
        role='BUYER',
        wallet_address='0x4567890123456789012345678901234567890123'
    )

    return {
        'admin': admin,
        'seller1': seller1,
        'seller2': seller2,
        'buyer1': buyer1,
        'buyer2': buyer2
    }

def create_carbon_credits(users):
    # Create verified carbon credits
    credit1 = CarbonCredit.objects.create(
        project_name='Solar Farm Project',
        verifier='Verra',
        owner=users['seller1'],
        issuance_date=timezone.now().date(),
        expiry_date=(timezone.now() + timedelta(days=365)).date(),
        total_credits=Decimal('1000.00'),
        available_credits=Decimal('1000.00'),
        token_id='1',
        status='VERIFIED',
        price_per_credit=Decimal('25.00')
    )

    credit2 = CarbonCredit.objects.create(
        project_name='Wind Energy Project',
        verifier='Gold Standard',
        owner=users['seller1'],
        issuance_date=timezone.now().date(),
        expiry_date=(timezone.now() + timedelta(days=365)).date(),
        total_credits=Decimal('500.00'),
        available_credits=Decimal('500.00'),
        token_id='2',
        status='VERIFIED',
        price_per_credit=Decimal('30.00')
    )

    # Create pending carbon credit
    credit3 = CarbonCredit.objects.create(
        project_name='Reforestation Project',
        verifier='Verra',
        owner=users['seller2'],
        issuance_date=timezone.now().date(),
        expiry_date=(timezone.now() + timedelta(days=365)).date(),
        total_credits=Decimal('2000.00'),
        available_credits=Decimal('2000.00'),
        status='PENDING',
        price_per_credit=Decimal('20.00')
    )

    return [credit1, credit2, credit3]

def create_transactions(users, credits):
    # Create completed transaction
    transaction1 = Transaction.objects.create(
        buyer=users['buyer1'],
        seller=users['seller1'],
        carbon_credit=credits[0],
        quantity=Decimal('100.00'),
        price_per_credit=credits[0].price_per_credit,
        total_amount=Decimal('100.00') * credits[0].price_per_credit,
        blockchain_tx_hash='0x1234567890',
        status='COMPLETED'
    )

    # Update available credits
    credits[0].available_credits -= Decimal('100.00')
    credits[0].save()

    # Create pending transaction
    transaction2 = Transaction.objects.create(
        buyer=users['buyer2'],
        seller=users['seller1'],
        carbon_credit=credits[1],
        quantity=Decimal('50.00'),
        price_per_credit=credits[1].price_per_credit,
        total_amount=Decimal('50.00') * credits[1].price_per_credit,
        status='PENDING'
    )

def create_documents(credits):
    # Create approved document
    doc1 = Document.objects.create(
        carbon_credit=credits[0],
        file_name='solar_project_verification.pdf',
        file_type='application/pdf',
        file_size=1024 * 1024,  # 1MB
        file_url='documents/solar_project/verification.pdf',
        status='APPROVED',
        virus_scanned=True,
        virus_scan_status='CLEAN'
    )

    # Create pending document
    doc2 = Document.objects.create(
        carbon_credit=credits[2],
        file_name='reforestation_verification.pdf',
        file_type='application/pdf',
        file_size=1024 * 1024,  # 1MB
        file_url='documents/reforestation/verification.pdf',
        status='PENDING',
        virus_scanned=True,
        virus_scan_status='CLEAN'
    )

def main():
    try:
        print("Creating test users...")
        users = create_users()
        
        print("Creating carbon credits...")
        credits = create_carbon_credits(users)
        
        print("Creating transactions...")
        create_transactions(users, credits)
        
        print("Creating documents...")
        create_documents(credits)
        
        print("\nTest data created successfully!")
        print("\nTest Accounts:")
        print("Admin - username: admin, password: admin123")
        print("Seller 1 - username: seller1, password: seller123")
        print("Seller 2 - username: seller2, password: seller123")
        print("Buyer 1 - username: buyer1, password: buyer123")
        print("Buyer 2 - username: buyer2, password: buyer123")
        
    except Exception as e:
        print(f"Error creating test data: {str(e)}")
        raise

if __name__ == '__main__':
    main() 