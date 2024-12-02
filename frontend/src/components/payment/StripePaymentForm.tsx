import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { config } from '../../config';

const stripePromise = loadStripe(config.stripePublicKey);

interface StripePaymentFormProps {
    clientSecret: string;
    onSuccess: () => void;
}

const PaymentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = React.useState<string | null>(null);
    const [processing, setProcessing] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);

        const { error: submitError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment/complete`,
            },
            redirect: 'if_required',
        });

        if (submitError) {
            setError(submitError.message || 'Payment failed');
            setProcessing(false);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                {processing ? (
                    <CircularProgress />
                ) : (
                    <button type="submit" disabled={!stripe}>
                        Pay Now
                    </button>
                )}
            </Box>
        </form>
    );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
    clientSecret,
    onSuccess,
}) => {
    const options = {
        clientSecret,
        appearance: {
            theme: 'stripe',
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm onSuccess={onSuccess} />
        </Elements>
    );
};

export default StripePaymentForm; 