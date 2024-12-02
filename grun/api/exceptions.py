from rest_framework.exceptions import APIException

class DocumentProcessingError(APIException):
    status_code = 500
    default_detail = 'Failed to process document'
    default_code = 'document_processing_error'

class BlockchainError(APIException):
    status_code = 503
    default_detail = 'Blockchain transaction failed'
    default_code = 'blockchain_error'

class StorageError(APIException):
    status_code = 503
    default_detail = 'Storage operation failed'
    default_code = 'storage_error'

class SecurityError(APIException):
    status_code = 403
    default_detail = 'Security check failed'
    default_code = 'security_error' 