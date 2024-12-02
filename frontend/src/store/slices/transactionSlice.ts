import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Transaction } from '../../types';

interface TransactionState {
    transactions: Transaction[];
    currentTransaction: Transaction | null;
    loading: boolean;
    error: string | null;
}

const initialState: TransactionState = {
    transactions: [],
    currentTransaction: null,
    loading: false,
    error: null,
};

export const createTransaction = createAsyncThunk(
    'transaction/create',
    async (data: { creditId: string; quantity: number }) => {
        const response = await axios.post('/api/purchase/', data);
        return response.data;
    }
);

const transactionSlice = createSlice({
    name: 'transaction',
    initialState,
    reducers: {
        clearCurrentTransaction: (state) => {
            state.currentTransaction = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createTransaction.pending, (state) => {
                state.loading = true;
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTransaction = action.payload;
            })
            .addCase(createTransaction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Transaction failed';
            });
    },
});

export const { clearCurrentTransaction } = transactionSlice.actions;
export default transactionSlice.reducer; 