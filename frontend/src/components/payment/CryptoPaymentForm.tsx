import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    TextField,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import { useWeb3 } from '../../contexts/Web3Context';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { verifyPayment } from '../../store/slices/paymentSlice';
import { web3Service } from '../../services/web3Service';
import { AppError, handleWeb3Error } from '../../utils/errorHandling';
import { CarbonCredit } from '../../types';

interface CryptoPaymentFormProps {
    paymentDetails: {
        transactionId: string;
        amount: number;
        tokenId: string;
    };
    selectedCredit: CarbonCredit;
    onSuccess: () => void;
    onError: (error: string) => void;
}

const steps = ['Connect Wallet', 'Confirm Transaction', 'Processing Payment'];

const CryptoPaymentForm: React.FC<CryptoPaymentFormProps> = ({
    paymentDetails,
    selectedCredit,
    onSuccess,
    onError
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [confirmations, setConfirmations] = useState(0);
    const { web3, account } = useWeb3();
    const dispatch = useDispatch<AppDispatch>();

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (web3 && txHash) {
                // Cleanup any subscription if component unmounts during transaction
                web3.eth.clearSubscriptions();
            }
        };
    }, [web3, txHash]);

    // Transaction confirmation monitoring
    useEffect(() => {
        if (web3 && txHash) {
            const checkConfirmation = async () => {
                try {
                    const receipt = await web3.eth.getTransactionReceipt(txHash);
                    if (receipt) {
                        setConfirmations(receipt.confirmations || 0);
                        if (receipt.status) {
                            await handleTransactionSuccess(txHash);
                        } else {
                            throw new Error('Transaction failed');
                        }
                    }
                } catch (error) {
                    handleTransactionError(error);
                }
            };

            const interval = setInterval(checkConfirmation, 3000);
            return () => clearInterval(interval);
        }
    }, [web3, txHash]);

    const validateTransaction = () => {
        if (paymentDetails.amount <= 0) {
            throw new AppError('Please enter a valid amount', 'INVALID_AMOUNT');
        }

        if (!selectedCredit?.available_credits || 
            paymentDetails.amount > selectedCredit.available_credits) {
            throw new AppError('Insufficient credits available', 'INSUFFICIENT_CREDITS');
        }
    };

    const handleTransactionSuccess = async (transactionHash: string) => {
        try {
            await dispatch(verifyPayment({
                transactionId: paymentDetails.transactionId,
                blockchainTxHash: transactionHash
            })).unwrap();
            onSuccess();
        } catch (error) {
            handleTransactionError(error);
        }
    };

    const handleTransactionError = (error: any) => {
        const appError = error instanceof AppError ? error : handleWeb3Error(error);
        setError(appError.message);
        onError(appError.message);
        setActiveStep(1);
    };

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (!web3 || !account) {
                throw new AppError('Wallet not connected', 'WALLET_NOT_CONNECTED');
            }

            validateTransaction();
            setActiveStep(2);

            // First approve the token spending
            const approvalHash = await web3Service.approveTokens(
                paymentDetails.tokenId,
                paymentDetails.amount
            );

            // Wait for approval confirmation
            await web3.eth.waitForTransactionReceipt(approvalHash);

            // Execute the purchase
            const purchaseHash = await web3Service.purchaseCredit(
                paymentDetails.tokenId,
                paymentDetails.amount,
                account
            );

            setTxHash(purchaseHash);
        } catch (error) {
            handleTransactionError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: '100%', mt: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && (
                <Alert 
                    severity="error" 
                    onClose={() => setError(null)}
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            <Box sx={{ mt: 2 }}>
                {activeStep === 0 && !account && (
                    <Typography color="error">
                        Please connect your wallet to continue
                    </Typography>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Connected Account: {account}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Amount to Pay: {paymentDetails.amount} Credits
                        </Typography>
                        <Button
                            onClick={handlePayment}
                            variant="contained"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography>Processing your payment...</Typography>
                        {txHash && (
                            <>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Transaction Hash: {txHash}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Confirmations: {confirmations}
                                </Typography>
                            </>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default CryptoPaymentForm; 