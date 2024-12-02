import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { config } from '../config';
import CarbonCreditABI from '../contracts/CarbonCredit.json';
import { AppError } from '../utils/errorHandling';

/**
 * Web3Service
 * 
 * Handles all blockchain interactions for the application.
 * Manages wallet connections, contract interactions, and transaction processing.
 * 
 * @class
 */
class Web3Service {
    private web3: Web3 | null = null;
    private contract: Contract | null = null;

    /**
     * Initializes the Web3 service with a provider
     * @param provider - Web3 provider instance
     * @throws {Error} If provider initialization fails
     */
    async initialize(provider: any): Promise<void> {
        try {
            this.web3 = new Web3(provider);
            
            // Verify network
            const networkId = await this.web3.eth.net.getId();
            const expectedNetwork = parseInt(process.env.REACT_APP_NETWORK_ID || '137'); // Polygon Mainnet
            
            if (networkId !== expectedNetwork) {
                throw new AppError(
                    'Wrong network selected',
                    'WRONG_NETWORK',
                    `Please switch to ${expectedNetwork === 137 ? 'Polygon Mainnet' : 'Mumbai Testnet'}`
                );
            }

            this.contract = new this.web3.eth.Contract(
                CarbonCreditABI as AbiItem[],
                config.contractAddress
            );
        } catch (error) {
            throw new AppError('Failed to initialize Web3', 'INITIALIZATION_ERROR', error);
        }
    }

    async approveTokens(tokenId: string, amount: number): Promise<string> {
        if (!this.contract || !this.web3) {
            throw new AppError('Web3 not initialized', 'NOT_INITIALIZED');
        }

        try {
            const accounts = await this.web3.eth.getAccounts();
            const from = accounts[0];

            const gasEstimate = await this.contract.methods
                .setApprovalForAll(config.marketplaceAddress, true)
                .estimateGas({ from });

            const tx = await this.contract.methods
                .setApprovalForAll(config.marketplaceAddress, true)
                .send({
                    from,
                    gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
                });

            return tx.transactionHash;
        } catch (error) {
            throw new AppError('Failed to approve tokens', 'APPROVAL_ERROR', error);
        }
    }

    async purchaseCredit(tokenId: string, amount: number, from: string): Promise<string> {
        if (!this.contract || !this.web3) {
            throw new AppError('Web3 not initialized', 'NOT_INITIALIZED');
        }

        try {
            const balance = await this.contract.methods
                .balanceOf(config.marketplaceAddress, tokenId)
                .call();

            if (balance < amount) {
                throw new AppError('Insufficient credits available', 'INSUFFICIENT_CREDITS');
            }

            const gasEstimate = await this.contract.methods
                .safeTransferFrom(config.marketplaceAddress, from, tokenId, amount, '0x')
                .estimateGas({ from });

            const tx = await this.contract.methods
                .safeTransferFrom(config.marketplaceAddress, from, tokenId, amount, '0x')
                .send({
                    from,
                    gas: Math.floor(gasEstimate * 1.2)
                });

            return tx.transactionHash;
        } catch (error) {
            throw new AppError('Failed to purchase credits', 'PURCHASE_ERROR', error);
        }
    }

    async getBalance(address: string, tokenId: string): Promise<number> {
        if (!this.contract) {
            throw new AppError('Web3 not initialized', 'NOT_INITIALIZED');
        }

        try {
            const balance = await this.contract.methods
                .balanceOf(address, tokenId)
                .call();
            return Number(balance);
        } catch (error) {
            throw new AppError('Failed to get balance', 'BALANCE_ERROR', error);
        }
    }

    async retireCredits(tokenId: string, amount: number): Promise<string> {
        if (!this.contract || !this.web3) {
            throw new AppError('Web3 not initialized', 'NOT_INITIALIZED');
        }

        try {
            const accounts = await this.web3.eth.getAccounts();
            const from = accounts[0];

            const gasEstimate = await this.contract.methods
                .retireCredits(tokenId, amount)
                .estimateGas({ from });

            const tx = await this.contract.methods
                .retireCredits(tokenId, amount)
                .send({
                    from,
                    gas: Math.floor(gasEstimate * 1.2)
                });

            return tx.transactionHash;
        } catch (error) {
            throw new AppError('Failed to retire credits', 'RETIRE_ERROR', error);
        }
    }
}

export const web3Service = new Web3Service(); 