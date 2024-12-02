import axios from 'axios';
import { config } from '../config';

interface AuthTokens {
    access: string;
    refresh: string;
}

class AuthService {
    private refreshTokenTimeout?: NodeJS.Timeout;

    async login(email: string, password: string): Promise<AuthTokens> {
        const response = await axios.post(`${config.apiUrl}/auth/login/`, {
            email,
            password,
        });
        this.setTokens(response.data);
        this.startRefreshTokenTimer();
        return response.data;
    }

    async refreshToken(): Promise<string> {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('No refresh token available');

        const response = await axios.post(`${config.apiUrl}/auth/refresh/`, {
            refresh,
        });
        
        localStorage.setItem('token', response.data.access);
        return response.data.access;
    }

    private setTokens(tokens: AuthTokens) {
        localStorage.setItem('token', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
    }

    private startRefreshTokenTimer() {
        // Refresh token 5 minutes before expiry
        const jwtToken = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1]));
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (5 * 60 * 1000);
        
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken(), timeout);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
        }
    }
}

export const authService = new AuthService(); 