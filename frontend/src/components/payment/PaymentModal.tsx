import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createPaymentSession, clearPaymentState } from '../../store/slices/paymentSlice';
import StripePaymentForm from './StripePaymentForm';
import CryptoPaymentForm from './CryptoPaymentForm';
import { Transaction } from '../../types';

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    transaction: Transaction;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, transaction }) => {
    const [paymentMethod, setPaymentMethod] = useState<'FIAT' | 'CRYPTO'>('FIAT');
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, stripeClientSecret, cryptoPaymentDetails } = useSelector(
        (state: RootState) => state.payment
    );

    useEffect(() => {
        if (open && transaction) {
            dispatch(createPaymentSession({
                transactionId: transaction.id,
                paymentType: paymentMethod,
            }));
        }
        return () => {
            dispatch(clearPaymentState());
        };
    }, [open, transaction, paymentMethod, dispatch]);

    const handlePaymentMethodChange = (_: React.SyntheticEvent, newValue: 'FIAT' | 'CRYPTO') => {
        setPaymentMethod(newValue);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Total Amount: ${transaction?.total_amount}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Credits: {transaction?.quantity}
                    </Typography>
                </Box>

                <Tabs
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                    sx={{ mb: 3 }}
                >
                    <Tab label="Credit Card" value="FIAT" />
                    <Tab label="Cryptocurrency" value="CRYPTO" />
                </Tabs>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                ) : paymentMethod === 'FIAT' && stripeClientSecret ? (
                    <StripePaymentForm clientSecret={stripeClientSecret} onSuccess={onClose} />
                ) : paymentMethod === 'CRYPTO' && cryptoPaymentDetails ? (
                    <CryptoPaymentForm
                        paymentDetails={cryptoPaymentDetails}
                        onSuccess={onClose}
                    />
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentModal; 