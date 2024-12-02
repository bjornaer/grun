import stripe
from django.conf import settings
from django.core.mail import send_mail
from ..models import Payment, Receipt, Transaction
from ..blockchain.web3_handler import Web3Handler
import logging

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

class PaymentService:
    @staticmethod
    async def create_fiat_payment_session(transaction: Transaction) -> dict:
        try:
            # Create Stripe payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=int(transaction.total_amount * 100),  # Convert to cents
                currency='usd',
                metadata={
                    'transaction_id': str(transaction.id),
                    'credit_id': str(transaction.carbon_credit.id),
                },
                payment_method_types=['card'],
            )

            # Create payment record
            payment = Payment.objects.create(
                transaction=transaction,
                payment_type='FIAT',
                amount=transaction.total_amount,
                stripe_payment_intent=payment_intent.id
            )

            return {
                'payment_id': str(payment.id),
                'client_secret': payment_intent.client_secret,
            }
        except Exception as e:
            logger.error(f"Error creating payment session: {str(e)}")
            raise

    @staticmethod
    async def process_crypto_payment(transaction: Transaction, tx_hash: str) -> bool:
        try:
            web3_handler = Web3Handler()
            # Verify the transaction on blockchain
            tx_verified = await web3_handler.verify_payment_transaction(
                tx_hash,
                transaction.total_amount,
                transaction.carbon_credit.token_id
            )

            if tx_verified:
                payment = Payment.objects.create(
                    transaction=transaction,
                    payment_type='CRYPTO',
                    amount=transaction.total_amount,
                    crypto_transaction_hash=tx_hash,
                    status='COMPLETED'
                )
                
                # Update transaction status
                transaction.status = 'COMPLETED'
                transaction.save()

                # Generate receipt
                await PaymentService.generate_receipt(payment)
                return True
            return False
        except Exception as e:
            logger.error(f"Error processing crypto payment: {str(e)}")
            raise

    @staticmethod
    async def handle_stripe_webhook(event_type: str, event_data: dict) -> None:
        try:
            if event_type == 'payment_intent.succeeded':
                payment_intent = event_data['object']
                payment = Payment.objects.get(
                    stripe_payment_intent=payment_intent['id']
                )
                
                payment.status = 'COMPLETED'
                payment.save()

                # Update transaction status
                payment.transaction.status = 'COMPLETED'
                payment.transaction.save()

                # Generate receipt
                await PaymentService.generate_receipt(payment)

                # Send confirmation email
                PaymentService.send_payment_confirmation(payment)

        except Exception as e:
            logger.error(f"Error handling Stripe webhook: {str(e)}")
            raise

    @staticmethod
    async def generate_receipt(payment: Payment) -> Receipt:
        try:
            receipt = Receipt.objects.create(payment=payment)
            # Generate PDF receipt and upload to S3
            pdf_url = await PaymentService._generate_pdf_receipt(receipt)
            receipt.pdf_url = pdf_url
            receipt.save()
            return receipt
        except Exception as e:
            logger.error(f"Error generating receipt: {str(e)}")
            raise

    @staticmethod
    def send_payment_confirmation(payment: Payment) -> None:
        try:
            send_mail(
                'Payment Confirmation - Carbon Credit Exchange',
                f'''Thank you for your purchase!
                Transaction ID: {payment.transaction.id}
                Amount: ${payment.amount}
                Status: {payment.status}
                Receipt Number: {payment.receipt.receipt_number}
                ''',
                settings.DEFAULT_FROM_EMAIL,
                [payment.transaction.buyer.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Error sending payment confirmation: {str(e)}")
            raise

    @staticmethod
    async def _generate_pdf_receipt(receipt: Receipt) -> str:
        # Implementation for PDF generation and S3 upload
        pass 