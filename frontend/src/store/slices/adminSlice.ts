import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CarbonCredit, User } from '../../types';

interface AdminState {
    loading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    loading: false,
    error: null,
};

export const verifyCreditAction = createAsyncThunk(
    'admin/verifyCredit',
    async ({ creditId, action }: { creditId: string; action: 'verify' | 'reject' }) => {
        const response = await axios.post(`/api/credits/${creditId}/review/`, {
            action,
        });
        return response.data;
    }
);

export const blockUserAction = createAsyncThunk(
    'admin/blockUser',
    async (userId: string) => {
        const response = await axios.post(`/api/users/${userId}/block/`);
        return response.data;
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(verifyCreditAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyCreditAction.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(verifyCreditAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Verification failed';
            })
            .addCase(blockUserAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(blockUserAction.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(blockUserAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Block user failed';
            });
    },
});

export default adminSlice.reducer; 