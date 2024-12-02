from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from django.conf import settings
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class Web3Handler:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URL))
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Load contract ABI and address
        with open('contracts/CarbonCredit.json') as f:
            contract_data = json.load(f)
        
        self.contract = self.w3.eth.contract(
            address=settings.CONTRACT_ADDRESS,
            abi=contract_data['abi']
        )
        
        # Load admin account
        self.admin_account = Account.from_key(settings.ADMIN_PRIVATE_KEY)

    def _build_transaction(self, function):
        """Helper method to build transaction with proper gas estimation"""
        nonce = self.w3.eth.get_transaction_count(self.admin_account.address)
        
        transaction = function.build_transaction({
            'from': self.admin_account.address,
            'nonce': nonce,
            'gas': 2000000,  # Estimate gas limit
            'gasPrice': self.w3.eth.gas_price,
        })
        
        signed_txn = self.w3.eth.account.sign_transaction(
            transaction, settings.ADMIN_PRIVATE_KEY
        )
        
        return signed_txn

    async def create_token(self, project_name: str, verifier: str, expiry_date: datetime,
                         total_credits: int, owner_address: str, metadata_uri: str):
        """Mint new carbon credits"""
        try:
            expiry_timestamp = int(expiry_date.timestamp())
            
            function = self.contract.functions.mintCredit(
                project_name,
                verifier,
                expiry_timestamp,
                total_credits,
                metadata_uri
            )
            
            signed_txn = self._build_transaction(function)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get token ID from event logs
            event = self.contract.events.CreditMinted().process_receipt(receipt)[0]
            return event['args']['tokenId'], self.w3.to_hex(tx_hash)
            
        except Exception as e:
            logger.error(f"Error creating token: {str(e)}")
            raise

    async def get_token_details(self, token_id: int):
        """Fetch token metadata from blockchain"""
        try:
            metadata = await self.contract.functions.getCreditMetadata(token_id).call()
            return {
                'project_name': metadata[0],
                'verifier': metadata[1],
                'issuance_date': datetime.fromtimestamp(metadata[2]),
                'expiry_date': datetime.fromtimestamp(metadata[3]),
                'total_credits': metadata[4],
                'owner': metadata[5],
                'is_retired': metadata[6],
                'metadata_uri': metadata[7]
            }
        except Exception as e:
            logger.error(f"Error fetching token details: {str(e)}")
            raise

    async def transfer_token(self, token_id: int, from_address: str,
                           to_address: str, amount: int):
        """Transfer tokens between addresses"""
        try:
            function = self.contract.functions.safeTransferFrom(
                from_address,
                to_address,
                token_id,
                amount,
                b''  # No data
            )
            
            signed_txn = self._build_transaction(function)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            await self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return self.w3.to_hex(tx_hash)
            
        except Exception as e:
            logger.error(f"Error transferring token: {str(e)}")
            raise

    async def retire_token(self, token_id: int, amount: int):
        """Retire (burn) tokens"""
        try:
            function = self.contract.functions.retireCredits(token_id, amount)
            
            signed_txn = self._build_transaction(function)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            await self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return self.w3.to_hex(tx_hash)
            
        except Exception as e:
            logger.error(f"Error retiring token: {str(e)}")
            raise

    async def verify_seller(self, seller_address: str):
        """Verify a seller address"""
        try:
            function = self.contract.functions.verifyOrUnverifySeller(
                seller_address,
                True
            )
            
            signed_txn = self._build_transaction(function)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            await self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return self.w3.to_hex(tx_hash)
            
        except Exception as e:
            logger.error(f"Error verifying seller: {str(e)}")
            raise 