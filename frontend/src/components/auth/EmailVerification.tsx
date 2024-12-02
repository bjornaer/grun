import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Button,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingButton } from '../common/LoadingButton';

const EmailVerification: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyEmail, resendVerification } = useAuth();
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Verification token is missing');
                setLoading(false);
                return;
            }

            try {
                await verifyEmail(token);
                setSuccess(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token, verifyEmail]);

    const handleResend = async () => {
        setResending(true);
        try {
            await resendVerification();
            setError('A new verification email has been sent.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="sm" mx="auto" mt={4}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Email Verification
                </Typography>

                {success ? (
                    <>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Your email has been successfully verified!
                        </Alert>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/login')}
                        >
                            Continue to Login
                        </Button>
                    </>
                ) : (
                    <>
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                        <LoadingButton
                            variant="contained"
                            fullWidth
                            onClick={handleResend}
                            loading={resending}
                            loadingText="Resending..."
                        >
                            Resend Verification Email
                        </LoadingButton>
                    </>
                )}

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography
                        variant="body2"
                        color="primary"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate('/login')}
                    >
                        Back to Login
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default EmailVerification; 