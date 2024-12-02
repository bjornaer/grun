import React from 'react';
import { Box } from '@mui/material';
import Toast from './Toast';
import { useToastState } from '../../hooks/useToast';

const ToastContainer: React.FC = () => {
    const { toasts } = useToastState();

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </Box>
    );
};

export default ToastContainer; 