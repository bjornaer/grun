import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createTransaction } from '../../store/slices/transactionSlice';
import { CarbonCredit } from '../../types';

interface PurchaseModalProps {
    open: boolean;
    onClose: () => void;
    credit: CarbonCredit;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onClose, credit }) => {
    const [quantity, setQuantity] = useState('1');
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.transaction);

    const handlePurchase = async () => {
        try {
            await dispatch(
                createTransaction({
                    creditId: credit.id,
                    quantity: Number(quantity),
                })
            ).unwrap();
            onClose();
        } catch (err) {
            console.error('Purchase failed:', err);
        }
    };

    const totalAmount = Number(quantity) * credit.price_per_credit;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Purchase Carbon Credits</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Project: {credit.project_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Available Credits: {credit.available_credits}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Price per Credit: ${credit.price_per_credit}
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputProps={{
                        min: 1,
                        max: credit.available_credits,
                    }}
                    error={Number(quantity) > credit.available_credits}
                    helperText={
                        Number(quantity) > credit.available_credits
                            ? 'Quantity exceeds available credits'
                            : ''
                    }
                />

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6">
                        Total Amount: ${totalAmount.toFixed(2)}
                    </Typography>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handlePurchase}
                    variant="contained"
                    color="primary"
                    disabled={
                        loading ||
                        Number(quantity) > credit.available_credits ||
                        Number(quantity) < 1
                    }
                >
                    {loading ? (
                        <CircularProgress size={24} />
                    ) : (
                        'Confirm Purchase'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PurchaseModal; 