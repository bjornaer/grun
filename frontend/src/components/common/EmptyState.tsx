import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
} from '@mui/material';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    action,
}) => {
    return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
            {icon && (
                <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {icon}
                </Box>
            )}

            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>

            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {description}
                </Typography>
            )}

            {action && (
                <Button
                    variant="contained"
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </Paper>
    );
};

export default EmptyState; 