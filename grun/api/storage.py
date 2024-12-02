import boto3
from botocore.exceptions import ClientError
from django.conf import settings
import clamd
from django.core.files.storage import Storage
import logging

logger = logging.getLogger(__name__)

class SecureS3Storage(Storage):
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME
        self.clamav = clamd.ClamdUnixSocket()

    def _scan_file(self, file):
        """Scan file for viruses using ClamAV"""
        try:
            scan_result = self.clamav.instream(file)
            return scan_result['stream'][0] == 'OK'
        except Exception as e:
            logger.error(f"Virus scan failed: {str(e)}")
            return False

    def _save(self, name, content):
        """Save file to S3 with virus scanning"""
        # Scan file first
        if not self._scan_file(content):
            raise ValueError("File failed virus scan")

        try:
            self.s3.upload_fileobj(
                content,
                self.bucket,
                name,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'ContentType': content.content_type
                }
            )
            return name
        except ClientError as e:
            logger.error(f"S3 upload failed: {str(e)}")
            raise

    def generate_presigned_url(self, object_name, expiration=3600):
        """Generate a presigned URL for secure download"""
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket,
                    'Key': object_name
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {str(e)}")
            return None 