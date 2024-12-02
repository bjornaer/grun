import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    severity?: 'warning' | 'error' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    loading = false,
    severity = 'warning',
}) => {
    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onCancel}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color={severity} />
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onCancel}
                    disabled={loading}
                >
                    {cancelLabel}
                </Button>
                <Button
                    variant="contained"
                    color={severity}
                    onClick={handleConfirm}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {loading ? 'Processing...' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog; 