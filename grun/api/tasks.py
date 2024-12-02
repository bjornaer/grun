from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Document
from .blockchain.web3_handler import Web3Handler
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_document_approval(document_id):
    try:
        document = Document.objects.get(id=document_id)
        carbon_credit = document.carbon_credit

        # Initialize blockchain handler
        web3_handler = Web3Handler()

        # Create token on blockchain synchronously
        token_id, tx_hash = web3_handler.create_token(
            carbon_credit.project_name,
            carbon_credit.verifier,
            carbon_credit.expiry_date,
            carbon_credit.total_credits,
            carbon_credit.owner.wallet_address,
            document.file_url
        )

        # Update carbon credit with token details
        carbon_credit.token_id = token_id
        carbon_credit.status = 'VERIFIED'
        carbon_credit.save()

        # Send email notification
        send_mail(
            'Carbon Credit Token Created',
            f'''Your carbon credit has been verified and tokenized.
            Token ID: {token_id}
            Transaction Hash: {tx_hash}
            Project: {carbon_credit.project_name}
            Credits: {carbon_credit.total_credits}
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [carbon_credit.owner.email],
            fail_silently=False,
        )

        # Update document status
        document.status = 'APPROVED'
        document.save()

        return {
            'success': True,
            'token_id': token_id,
            'tx_hash': tx_hash
        }

    except Exception as e:
        logger.error(f"Document approval processing failed: {str(e)}")
        document.status = 'REJECTED'
        document.admin_comments = f"Token creation failed: {str(e)}"
        document.save()
        
        # Send failure notification
        send_mail(
            'Carbon Credit Verification Failed',
            f'''There was an error verifying your carbon credit.
            Project: {carbon_credit.project_name}
            Error: {str(e)}
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [carbon_credit.owner.email],
            fail_silently=False,
        )
        
        raise 