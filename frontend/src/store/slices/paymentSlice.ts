import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface PaymentState {
    stripeClientSecret: string | null;
    cryptoPaymentDetails: {
        transactionId: string;
        amount: number;
        tokenId: string;
    } | null;
    loading: boolean;
    error: string | null;
}

const initialState: PaymentState = {
    stripeClientSecret: null,
    cryptoPaymentDetails: null,
    loading: false,
    error: null,
};

export const createPaymentSession = createAsyncThunk(
    'payment/createSession',
    async ({ transactionId, paymentType }: { transactionId: string; paymentType: 'FIAT' | 'CRYPTO' }) => {
        const response = await axios.post('/api/create_payment/', {
            transaction_id: transactionId,
            payment_type: paymentType,
        });
        return response.data;
    }
);

export const verifyPayment = createAsyncThunk(
    'payment/verify',
    async ({ transactionId, transactionHash }: { transactionId: string; transactionHash: string }) => {
        const response = await axios.post('/api/verify_payment/', {
            transaction_id: transactionId,
            transaction_hash: transactionHash,
        });
        return response.data;
    }
);

const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        clearPaymentState: (state) => {
            state.stripeClientSecret = null;
            state.cryptoPaymentDetails = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createPaymentSession.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPaymentSession.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.client_secret) {
                    state.stripeClientSecret = action.payload.client_secret;
                } else {
                    state.cryptoPaymentDetails = {
                        transactionId: action.payload.transaction_id,
                        amount: action.payload.amount,
                        tokenId: action.payload.token_id,
                    };
                }
            })
            .addCase(createPaymentSession.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Payment session creation failed';
            })
            .addCase(verifyPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyPayment.fulfilled, (state) => {
                state.loading = false;
                state.cryptoPaymentDetails = null;
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Payment verification failed';
            });
    },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer; 