export const config = {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    web3Provider: process.env.REACT_APP_WEB3_PROVIDER || 'http://localhost:8545',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '',
    stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || '',
};

export const routes = {
    home: '/',
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    admin: '/admin',
    marketplace: '/marketplace',
}; 