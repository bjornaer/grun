import React from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { register } from '../../store/slices/authSlice';

const validationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    role: Yup.string().required('Role is required'),
    organization_name: Yup.string().when('role', {
        is: (role: string) => role !== 'BUYER',
        then: Yup.string().required('Organization name is required'),
    }),
    wallet_address: Yup.string()
        .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
        .required('Wallet address is required'),
});

const RegisterForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            role: '',
            organization_name: '',
            wallet_address: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await dispatch(register(values)).unwrap();
                navigate('/login');
            } catch (err) {
                // Error handling is managed by Redux
            }
        },
    });

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
                py: 4,
            }}
        >
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Register
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <form onSubmit={formik.handleSubmit}>
                    <TextField
                        fullWidth
                        id="username"
                        name="username"
                        label="Username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        error={formik.touched.username && Boolean(formik.errors.username)}
                        helperText={formik.touched.username && formik.errors.username}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        id="password"
                        name="password"
                        label="Password"
                        type="password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        error={formik.touched.password && Boolean(formik.errors.password)}
                        helperText={formik.touched.password && formik.errors.password}
                        margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="role-label">Role</InputLabel>
                        <Select
                            labelId="role-label"
                            id="role"
                            name="role"
                            value={formik.values.role}
                            onChange={formik.handleChange}
                            error={formik.touched.role && Boolean(formik.errors.role)}
                            label="Role"
                        >
                            <MenuItem value="BUYER">Buyer</MenuItem>
                            <MenuItem value="SELLER">Seller</MenuItem>
                        </Select>
                    </FormControl>
                    {formik.values.role !== 'BUYER' && (
                        <TextField
                            fullWidth
                            id="organization_name"
                            name="organization_name"
                            label="Organization Name"
                            value={formik.values.organization_name}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.organization_name &&
                                Boolean(formik.errors.organization_name)
                            }
                            helperText={
                                formik.touched.organization_name &&
                                formik.errors.organization_name
                            }
                            margin="normal"
                        />
                    )}
                    <TextField
                        fullWidth
                        id="wallet_address"
                        name="wallet_address"
                        label="Wallet Address"
                        value={formik.values.wallet_address}
                        onChange={formik.handleChange}
                        error={
                            formik.touched.wallet_address &&
                            Boolean(formik.errors.wallet_address)
                        }
                        helperText={
                            formik.touched.wallet_address &&
                            formik.errors.wallet_address
                        }
                        margin="normal"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3 }}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default RegisterForm; 