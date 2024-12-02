export class AppError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number,
        public originalError?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const handleApiError = (error: any) => {
    if (error.response) {
        // Server responded with error
        return new AppError(
            error.response.data.message || 'Server error occurred',
            error.response.data.code,
            error.response.status,
            error
        );
    } else if (error.request) {
        // Request made but no response
        return new AppError('No response from server', 'NETWORK_ERROR', 503, error);
    } else {
        // Error in request setup
        return new AppError(error.message || 'Request failed', 'REQUEST_ERROR', 400, error);
    }
};

export const handleWeb3Error = (error: any) => {
    const message = error.message || 'Blockchain transaction failed';
    
    if (message.includes('insufficient funds')) {
        return new AppError('Insufficient funds for transaction', 'INSUFFICIENT_FUNDS', 400, error);
    } else if (message.includes('user rejected')) {
        return new AppError('Transaction was rejected by user', 'USER_REJECTED', 400, error);
    } else if (message.includes('nonce too low')) {
        return new AppError('Transaction nonce error - please try again', 'NONCE_ERROR', 400, error);
    }
    
    return new AppError(message, 'WEB3_ERROR', 500, error);
}; 