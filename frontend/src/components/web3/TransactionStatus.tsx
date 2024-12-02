import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    CircularProgress,
    Box,
    Link,
    Button,
} from '@mui/material';
import { config } from '../../config';

interface TransactionStatusProps {
    open: boolean;
    onClose: () => void;
    txHash?: string;
    error?: string;
    loading?: boolean;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
    open,
    onClose,
    txHash,
    error,
    loading,
}) => {
    const getExplorerUrl = () => {
        const baseUrl = config.networkId === 137
            ? 'https://polygonscan.com/tx/'
            : 'https://mumbai.polygonscan.com/tx/';
        return `${baseUrl}${txHash}`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Transaction Status</DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    {loading && (
                        <>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography>Processing Transaction...</Typography>
                        </>
                    )}

                    {error && (
                        <>
                            <Typography color="error" gutterBottom>
                                Transaction Failed
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {error}
                            </Typography>
                        </>
                    )}

                    {txHash && !loading && !error && (
                        <>
                            <Typography color="success.main" gutterBottom>
                                Transaction Successful!
                            </Typography>
                            <Link
                                href={getExplorerUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on Explorer
                            </Link>
                        </>
                    )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button onClick={onClose} variant="contained">
                        Close
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default TransactionStatus; 