export interface User {
    id: string;
    username: string;
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    organization_name?: string;
    wallet_address?: string;
    is_verified: boolean;
}

export interface CarbonCredit {
    id: string;
    project_name: string;
    verifier: string;
    owner: User;
    issuance_date: string;
    expiry_date: string;
    total_credits: number;
    available_credits: number;
    token_id?: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RETIRED';
    price_per_credit: number;
}

export interface Transaction {
    id: string;
    buyer: User;
    seller: User;
    carbon_credit: CarbonCredit;
    quantity: number;
    total_amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    blockchain_tx_hash?: string;
} 