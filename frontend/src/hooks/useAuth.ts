import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user, loading, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        // Check for token in localStorage and validate it
        const token = localStorage.getItem('token');
        if (token && !user) {
            // Implement token validation logic here
        }
    }, [dispatch, user]);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN';
    const isSeller = user?.role === 'SELLER';
    const isBuyer = user?.role === 'BUYER';

    return {
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isSeller,
        isBuyer,
    };
}; 