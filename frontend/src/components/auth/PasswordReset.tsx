import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import Form from '../common/Form';
import FormField from '../common/FormField';
import { useAuth } from '../../hooks/useAuth';

const validationSchema = Yup.object({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
});

const PasswordReset: React.FC = () => {
    const navigate = useNavigate();
    const { requestPasswordReset } = useAuth();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (values: { email: string }) => {
        try {
            await requestPasswordReset(values.email);
            setSuccess(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
            setSuccess(false);
        }
    };

    return (
        <Box maxWidth="sm" mx="auto" mt={4}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Reset Password
                </Typography>

                {success ? (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Password reset instructions have been sent to your email.
                    </Alert>
                ) : (
                    <Form
                        initialValues={{ email: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        error={error}
                        submitLabel="Send Reset Link"
                    >
                        <FormField
                            name="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            gridProps={{ xs: 12 }}
                        />
                    </Form>
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

export default PasswordReset; 