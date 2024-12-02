import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Alert,
    Grid,
    CircularProgress,
} from '@mui/material';
import QRCode from 'qrcode.react';
import * as Yup from 'yup';
import Form from '../common/Form';
import FormField from '../common/FormField';
import { useAuth } from '../../hooks/useAuth';
import { LoadingButton } from '../common/LoadingButton';

const validationSchema = Yup.object({
    code: Yup.string()
        .matches(/^\d{6}$/, 'Code must be exactly 6 digits')
        .required('Verification code is required'),
});

const TwoFactorSetup: React.FC = () => {
    const { generate2FASecret, verify2FASetup } = useAuth();
    const [secret, setSecret] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const setupSecret = async () => {
            try {
                const { secret, qrCode } = await generate2FASecret();
                setSecret(secret);
                setQrCode(qrCode);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to generate 2FA secret');
            } finally {
                setLoading(false);
            }
        };

        setupSecret();
    }, []);

    const handleVerify = async (values: { code: string }) => {
        if (!secret) return;

        try {
            await verify2FASetup(secret, values.code);
            setSuccess(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code');
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
                    Set Up Two-Factor Authentication
                </Typography>

                {success ? (
                    <Alert severity="success">
                        Two-factor authentication has been successfully enabled for your account.
                    </Alert>
                ) : (
                    <>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Scan the QR code below with your authenticator app to set up two-factor authentication.
                        </Alert>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Grid container spacing={3} justifyContent="center" sx={{ mb: 3 }}>
                            <Grid item>
                                {qrCode && (
                                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
                                        <QRCode value={qrCode} size={200} />
                                    </Box>
                                )}
                            </Grid>
                        </Grid>

                        {secret && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Manual Entry Code:
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontFamily: 'monospace',
                                        bgcolor: 'grey.100',
                                        p: 1,
                                        borderRadius: 1
                                    }}
                                >
                                    {secret}
                                </Typography>
                            </Box>
                        )}

                        <Form
                            initialValues={{ code: '' }}
                            validationSchema={validationSchema}
                            onSubmit={handleVerify}
                            submitLabel="Verify and Enable 2FA"
                        >
                            <FormField
                                name="code"
                                label="Verification Code"
                                type="text"
                                autoComplete="one-time-code"
                                inputProps={{ maxLength: 6 }}
                                gridProps={{ xs: 12 }}
                            />
                        </Form>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default TwoFactorSetup; 