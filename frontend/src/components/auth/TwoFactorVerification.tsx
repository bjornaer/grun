import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Alert,
} from '@mui/material';
import * as Yup from 'yup';
import Form from '../common/Form';
import FormField from '../common/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const validationSchema = Yup.object({
    code: Yup.string()
        .matches(/^\d{6}$/, 'Code must be exactly 6 digits')
        .required('Verification code is required'),
});

interface TwoFactorVerificationProps {
    tempToken: string;
    onSuccess: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
    tempToken,
    onSuccess,
}) => {
    const { verify2FALogin } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleVerify = async (values: { code: string }) => {
        try {
            await verify2FALogin(tempToken, values.code);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code');
        }
    };

    return (
        <Box maxWidth="sm" mx="auto" mt={4}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Two-Factor Verification
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Enter the verification code from your authenticator app to continue.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Form
                    initialValues={{ code: '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleVerify}
                    submitLabel="Verify"
                >
                    <FormField
                        name="code"
                        label="Verification Code"
                        type="text"
                        autoComplete="one-time-code"
                        inputProps={{ maxLength: 6 }}
                        gridProps={{ xs: 12 }}
                        autoFocus
                    />
                </Form>

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

export default TwoFactorVerification; 