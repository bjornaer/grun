import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Grid,
    Divider,
    Alert,
} from '@mui/material';
import { Form as FormikForm, Formik, FormikHelpers, FormikValues } from 'formik';
import * as Yup from 'yup';

interface FormProps<T extends FormikValues> {
    initialValues: T;
    validationSchema: Yup.Schema<any>;
    onSubmit: (values: T, helpers: FormikHelpers<T>) => void | Promise<void>;
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    error?: string;
    children: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function Form<T extends FormikValues>({
    initialValues,
    validationSchema,
    onSubmit,
    title,
    subtitle,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    onCancel,
    error,
    children,
    maxWidth = 'sm',
}: FormProps<T>) {
    return (
        <Box maxWidth={maxWidth} mx="auto">
            <Paper sx={{ p: 3 }}>
                {title && (
                    <Typography variant="h5" gutterBottom>
                        {title}
                    </Typography>
                )}
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {subtitle}
                    </Typography>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={onSubmit}
                >
                    {({ isSubmitting, dirty, isValid }) => (
                        <FormikForm>
                            <Grid container spacing={3}>
                                {children}
                            </Grid>
                            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                {onCancel && (
                                    <Button
                                        onClick={onCancel}
                                        disabled={isSubmitting}
                                    >
                                        {cancelLabel}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isSubmitting || !dirty || !isValid}
                                    startIcon={isSubmitting && <CircularProgress size={20} />}
                                >
                                    {isSubmitting ? 'Submitting...' : submitLabel}
                                </Button>
                            </Box>
                        </FormikForm>
                    )}
                </Formik>
            </Paper>
        </Box>
    );
}

export default Form; 