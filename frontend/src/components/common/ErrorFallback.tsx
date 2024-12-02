import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Error } from '@mui/icons-material';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                textAlign="center"
            >
                <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                    Something went wrong
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    {error.message}
                </Typography>
                <Button
                    variant="contained"
                    onClick={resetErrorBoundary}
                >
                    Try again
                </Button>
            </Box>
        </Container>
    );
};

export default ErrorFallback; 