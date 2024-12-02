import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { provider } from 'web3-core';
import detectEthereumProvider from '@metamask/detect-provider';
import { web3Service } from '../services/web3Service';
import { AppError } from '../utils/errorHandling';

interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    blockExplorer: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}

interface Web3ContextType {
    web3: Web3 | null;
    account: string | null;
    chainId: number | null;
    connecting: boolean;
    connected: boolean;
    networkConfig: NetworkConfig | null;
    balance: string;
    connectWallet: () => Promise<void>;
    disconnect: () => void;
    switchNetwork: (chainId: number) => Promise<void>;
    error: string | null;
}

const SUPPORTED_NETWORKS: { [key: number]: NetworkConfig } = {
    137: {
        chainId: 137,
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-rpc.com',
        blockExplorer: 'https://polygonscan.com',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
    },
    80001: {
        chainId: 80001,
        name: 'Mumbai Testnet',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        blockExplorer: 'https://mumbai.polygonscan.com',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
    },
};

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(null);
    const [balance, setBalance] = useState<string>('0');

    // Persist connection
    useEffect(() => {
        const savedAccount = localStorage.getItem('walletAccount');
        if (savedAccount) {
            connectWallet();
        }
    }, []);

    const updateBalance = useCallback(async () => {
        if (web3 && account) {
            try {
                const balance = await web3.eth.getBalance(account);
                setBalance(web3.utils.fromWei(balance, 'ether'));
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        }
    }, [web3, account]);

    // Update balance periodically
    useEffect(() => {
        if (account) {
            updateBalance();
            const interval = setInterval(updateBalance, 10000); // Every 10 seconds
            return () => clearInterval(interval);
        }
    }, [account, updateBalance]);

    const handleAccountsChanged = useCallback((accounts: string[]) => {
        if (accounts.length === 0) {
            disconnect();
        } else {
            setAccount(accounts[0]);
            localStorage.setItem('walletAccount', accounts[0]);
            updateBalance();
        }
    }, [updateBalance]);

    const handleChainChanged = useCallback((chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setNetworkConfig(SUPPORTED_NETWORKS[newChainId] || null);
        
        if (!SUPPORTED_NETWORKS[newChainId]) {
            setError('Unsupported network. Please switch to Polygon Mainnet or Mumbai Testnet.');
        } else {
            setError(null);
        }
    }, []);

    const setupProviderEvents = useCallback((provider: any) => {
        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', handleChainChanged);
        provider.on('disconnect', disconnect);

        return () => {
            provider.removeListener('accountsChanged', handleAccountsChanged);
            provider.removeListener('chainChanged', handleChainChanged);
            provider.removeListener('disconnect', disconnect);
        };
    }, [handleAccountsChanged, handleChainChanged]);

    const switchNetwork = async (targetChainId: number) => {
        if (!web3 || !window.ethereum) {
            throw new AppError('Web3 not initialized', 'NOT_INITIALIZED');
        }

        const network = SUPPORTED_NETWORKS[targetChainId];
        if (!network) {
            throw new AppError('Unsupported network', 'UNSUPPORTED_NETWORK');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${targetChainId.toString(16)}`,
                            chainName: network.name,
                            nativeCurrency: network.nativeCurrency,
                            rpcUrls: [network.rpcUrl],
                            blockExplorerUrls: [network.blockExplorer],
                        }],
                    });
                } catch (addError) {
                    throw new AppError('Failed to add network', 'ADD_NETWORK_ERROR', addError);
                }
            } else {
                throw new AppError('Failed to switch network', 'SWITCH_NETWORK_ERROR', switchError);
            }
        }
    };

    const connectWallet = async () => {
        try {
            setConnecting(true);
            setError(null);

            const provider = await detectEthereumProvider();
            if (!provider) {
                throw new AppError('Please install MetaMask', 'NO_PROVIDER');
            }

            await provider.request({ method: 'eth_requestAccounts' });
            const web3Instance = new Web3(provider as provider);
            
            const accounts = await web3Instance.eth.getAccounts();
            const chainId = await web3Instance.eth.getChainId();

            if (!SUPPORTED_NETWORKS[chainId]) {
                await switchNetwork(137); // Default to Polygon Mainnet
            }

            await web3Service.initialize(provider);

            setWeb3(web3Instance);
            setAccount(accounts[0]);
            setChainId(chainId);
            setNetworkConfig(SUPPORTED_NETWORKS[chainId] || null);
            setConnected(true);
            localStorage.setItem('walletAccount', accounts[0]);

            const cleanup = setupProviderEvents(provider);
            return () => cleanup();
        } catch (error) {
            const appError = error instanceof AppError ? error : new AppError('Failed to connect wallet', 'CONNECTION_ERROR');
            setError(appError.message);
            throw appError;
        } finally {
            setConnecting(false);
        }
    };

    const disconnect = useCallback(() => {
        setWeb3(null);
        setAccount(null);
        setChainId(null);
        setConnected(false);
        setNetworkConfig(null);
        setBalance('0');
        localStorage.removeItem('walletAccount');
    }, []);

    return (
        <Web3Context.Provider 
            value={{
                web3,
                account,
                chainId,
                connecting,
                connected,
                networkConfig,
                balance,
                connectWallet,
                disconnect,
                switchNetwork,
                error
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
}; 