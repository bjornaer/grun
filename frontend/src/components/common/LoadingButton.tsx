import React from 'react';
import {
    Button,
    ButtonProps,
    CircularProgress,
    Tooltip,
    Box,
} from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
    loading?: boolean;
    loadingText?: string;
    tooltipTitle?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
    loading = false,
    loadingText = 'Loading...',
    tooltipTitle,
    disabled,
    children,
    startIcon,
    endIcon,
    ...props
}) => {
    const button = (
        <Button
            {...props}
            disabled={loading || disabled}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
            endIcon={loading ? undefined : endIcon}
        >
            {loading ? loadingText : children}
        </Button>
    );

    return tooltipTitle ? (
        <Tooltip title={disabled ? tooltipTitle : ''}>
            <Box component="span" sx={{ display: 'inline-block' }}>
                {button}
            </Box>
        </Tooltip>
    ) : (
        button
    );
};

export default LoadingButton; 