import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import transactionReducer from './slices/transactionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        marketplace: marketplaceReducer,
        transaction: transactionReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 