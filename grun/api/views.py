from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.db import transaction
from django.core.cache import cache
from django.utils import timezone
from .models import User, CarbonCredit, Transaction, Document
from .serializers import UserSerializer, CarbonCreditSerializer, TransactionSerializer, DocumentSerializer, DocumentUploadSerializer
from .permissions import IsAdminUser, IsBuyerUser, IsSellerUser
from .blockchain.web3_handler import Web3Handler
from .tasks import process_document_approval
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError
from .exceptions import DocumentProcessingError, BlockchainError
import logging
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

logger = logging.getLogger(__name__)

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(self.request.data['password'])
        user.save()

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class CarbonCreditListCreateView(generics.ListCreateAPIView):
    serializer_class = CarbonCreditSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return CarbonCredit.objects.all()
        return CarbonCredit.objects.filter(owner=self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        credit = serializer.save(owner=self.request.user)
        try:
            # Initialize blockchain handler
            web3_handler = Web3Handler()
            # Create token on blockchain
            token_id = web3_handler.create_token(
                credit.id,
                credit.total_credits,
                credit.owner.wallet_address
            )
            credit.token_id = token_id
            credit.save()
        except Exception as e:
            logger.error(f"Blockchain error: {str(e)}")
            raise

class CarbonCreditListingsView(generics.ListAPIView):
    serializer_class = CarbonCreditSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = CarbonCredit.objects.filter(
            status='VERIFIED',
            available_credits__gt=0
        )
        
        # Cache the results for 5 minutes
        cache_key = f'listings_page_{self.request.query_params.get("page", 1)}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        cache.set(cache_key, queryset, 300)
        return queryset

class TransactionCreateView(generics.CreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (permissions.IsAuthenticated, IsBuyerUser)

    @transaction.atomic
    def perform_create(self, serializer):
        credit = serializer.validated_data['carbon_credit']
        quantity = serializer.validated_data['quantity']
        
        if quantity > credit.available_credits:
            raise serializers.ValidationError("Insufficient credits available")
        
        transaction = serializer.save(
            buyer=self.request.user,
            seller=credit.owner,
            total_amount=quantity * credit.price_per_credit
        )
        
        try:
            web3_handler = Web3Handler()
            tx_hash = web3_handler.transfer_token(
                credit.token_id,
                credit.owner.wallet_address,
                self.request.user.wallet_address,
                quantity
            )
            transaction.blockchain_tx_hash = tx_hash
            transaction.status = 'COMPLETED'
            transaction.save()
            
            # Update available credits
            credit.available_credits -= quantity
            credit.save()
            
        except Exception as e:
            transaction.status = 'FAILED'
            transaction.save()
            logger.error(f"Transaction failed: {str(e)}")
            raise

class AdminVerifyCreditView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminUser)
    queryset = CarbonCredit.objects.all()
    serializer_class = CarbonCreditSerializer

    def perform_update(self, serializer):
        action = self.request.data.get('action')
        if action not in ['verify', 'reject']:
            raise serializers.ValidationError("Invalid action")
        
        credit = serializer.save(
            status='VERIFIED' if action == 'verify' else 'REJECTED'
        )

class AdminBlockUserView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminUser)
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_update(self, serializer):
        user = serializer.save(is_blocked=True)

class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing carbon credit documents.
    Handles document upload, review, and verification processes.
    """
    
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Document.objects.all()
        return Document.objects.filter(carbon_credit__owner=self.request.user)

    def get_serializer_class(self):
        if self.action == 'upload':
            return DocumentUploadSerializer
        return DocumentSerializer

    @action(detail=False, methods=['post'])
    def upload(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                # Create document record
                document = serializer.save(
                    file_name=request.FILES['file'].name,
                    file_type=request.FILES['file'].content_type,
                    file_size=request.FILES['file'].size
                )
                
                # Upload file to S3
                file_key = f"documents/{document.id}/{request.FILES['file'].name}"
                document.file_url = self.storage.save(file_key, request.FILES['file'])
                document.save()
                
                # Send notification
                self.send_upload_notification(document)
                
                return Response(
                    self.get_serializer(document).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                logger.error(f"Document upload failed: {str(e)}")
                return Response(
                    {'error': 'Upload failed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Review a submitted document",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['action'],
            properties={
                'action': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=['approve', 'reject'],
                    description="Action to take on the document"
                ),
                'comments': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Optional review comments"
                ),
            }
        ),
        responses={
            200: "Document successfully reviewed",
            400: "Invalid action specified",
            403: "Insufficient permissions",
            404: "Document not found"
        }
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def review(self, request, pk=None):
        try:
            document = self.get_object()
            action = request.data.get('action')
            comments = request.data.get('comments', '')

            if action not in ['approve', 'reject']:
                raise ValidationError('Invalid action. Must be either "approve" or "reject".')

            document.status = 'APPROVED' if action == 'approve' else 'REJECTED'
            document.admin_comments = comments
            document.reviewed_by = request.user
            document.review_date = timezone.now()
            
            try:
                document.save()
            except Exception as e:
                logger.error(f"Database error while saving document: {str(e)}")
                raise APIException("Failed to save document status")

            if action == 'approve':
                try:
                    # Trigger token minting process
                    process_document_approval.delay(document.id)
                except Exception as e:
                    logger.error(f"Failed to queue document approval task: {str(e)}")
                    document.status = 'PENDING'
                    document.save()
                    raise DocumentProcessingError("Failed to process document approval")

            # Send notification
            try:
                self.send_review_notification(document)
            except Exception as e:
                logger.error(f"Failed to send review notification: {str(e)}")
                # Continue execution as this is non-critical

            return Response(self.get_serializer(document).data)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DocumentProcessingError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.error(f"Unexpected error in document review: {str(e)}")
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def send_upload_notification(self, document):
        # Implementation for upload notification
        pass

    def send_review_notification(self, document):
        # Implementation for review notification
        pass 