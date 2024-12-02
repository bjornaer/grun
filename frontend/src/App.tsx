import React, { Suspense, useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
    ThemeProvider,
    CssBaseline,
    CircularProgress,
    Box,
    Alert,
    Snackbar,
} from '@mui/material';
import { Web3Provider } from './contexts/Web3Context';
import { ErrorBoundary } from 'react-error-boundary';
import { store } from './store';
import { theme } from './theme';
import Layout from './components/layout/Layout';
import ErrorFallback from './components/common/ErrorFallback';
import LoadingScreen from './components/common/LoadingScreen';
import { useAuth } from './hooks/useAuth';

// Lazy load components for better performance
const LoginForm = React.lazy(() => import('./components/auth/LoginForm'));
const RegisterForm = React.lazy(() => import('./components/auth/RegisterForm'));
const BuyerDashboard = React.lazy(() => import('./components/dashboard/BuyerDashboard'));
const SellerDashboard = React.lazy(() => import('./components/dashboard/SellerDashboard'));
const AdminDashboard = React.lazy(() => import('./components/dashboard/AdminDashboard'));
const MarketplacePage = React.lazy(() => import('./components/marketplace/MarketplacePage'));
const NotFoundPage = React.lazy(() => import('./components/common/NotFoundPage'));

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error('Global error:', event.error);
            setError('An unexpected error occurred. Please try again later.');
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    const handleErrorBoundaryError = (error: Error) => {
        console.error('Error boundary caught error:', error);
        setError('An unexpected error occurred. Please try again later.');
    };

    const handleCloseError = () => {
        setError(null);
    };

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleErrorBoundaryError}
            onReset={() => window.location.reload()}
        >
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Web3Provider>
                        <Router>
                            <Layout>
                                <Suspense fallback={<LoadingScreen />}>
                                    <Routes>
                                        <Route 
                                            path="/login" 
                                            element={<LoginForm />} 
                                        />
                                        <Route 
                                            path="/register" 
                                            element={<RegisterForm />} 
                                        />
                                        <Route 
                                            path="/dashboard/buyer" 
                                            element={
                                                <ProtectedRoute requiredRole="BUYER">
                                                    <BuyerDashboard />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route 
                                            path="/dashboard/seller" 
                                            element={
                                                <ProtectedRoute requiredRole="SELLER">
                                                    <SellerDashboard />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route 
                                            path="/dashboard/admin" 
                                            element={
                                                <ProtectedRoute requiredRole="ADMIN">
                                                    <AdminDashboard />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route 
                                            path="/marketplace" 
                                            element={
                                                <ProtectedRoute>
                                                    <MarketplacePage />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route 
                                            path="/" 
                                            element={<Navigate to="/marketplace" replace />} 
                                        />
                                        <Route 
                                            path="*" 
                                            element={<NotFoundPage />} 
                                        />
                                    </Routes>
                                </Suspense>

                                <Snackbar
                                    open={!!error}
                                    autoHideDuration={6000}
                                    onClose={handleCloseError}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                >
                                    <Alert 
                                        onClose={handleCloseError} 
                                        severity="error" 
                                        variant="filled"
                                    >
                                        {error}
                                    </Alert>
                                </Snackbar>
                            </Layout>
                        </Router>
                    </Web3Provider>
                </ThemeProvider>
            </Provider>
        </ErrorBoundary>
    );
};

export default App; 