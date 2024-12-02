import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CarbonCredit } from '../../types';

interface MarketplaceState {
    credits: CarbonCredit[];
    loading: boolean;
    error: string | null;
    filters: {
        minPrice?: number;
        maxPrice?: number;
        verifier?: string;
        status?: string;
    };
}

const initialState: MarketplaceState = {
    credits: [],
    loading: false,
    error: null,
    filters: {},
};

export const fetchCredits = createAsyncThunk(
    'marketplace/fetchCredits',
    async (filters: MarketplaceState['filters']) => {
        const response = await axios.get('/api/listings/', { params: filters });
        return response.data;
    }
);

const marketplaceSlice = createSlice({
    name: 'marketplace',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCredits.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCredits.fulfilled, (state, action) => {
                state.loading = false;
                state.credits = action.payload;
            })
            .addCase(fetchCredits.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch credits';
            });
    },
});

export const { setFilters } = marketplaceSlice.actions;
export default marketplaceSlice.reducer; 