import React, { useState } from 'react';
import {
    Button,
    Typography,
    Box,
    CircularProgress,
    Menu,
    MenuItem,
    IconButton,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Paper,
} from '@mui/material';
import {
    AccountBalanceWallet,
    SwapHoriz,
    Warning,
    CheckCircle,
    ContentCopy,
} from '@mui/icons-material';
import { useWeb3 } from '../../contexts/Web3Context';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { formatCurrency } from '../../utils/formatters';

/**
 * WalletConnector Component
 * 
 * Handles Web3 wallet connection and management for the application.
 * Supports MetaMask and other Web3 providers.
 * 
 * @component
 * @example
 * ```tsx
 * <WalletConnector
 *   onConnect={(address) => console.log('Connected:', address)}
 *   onDisconnect={() => console.log('Disconnected')}
 * />
 * ```
 */
interface WalletConnectorProps {
    /** Callback function called when wallet is successfully connected */
    onConnect: (address: string) => void;
    /** Callback function called when wallet is disconnected */
    onDisconnect: () => void;
    /** Optional className for styling */
    className?: string;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({
    onConnect,
    onDisconnect,
    className,
}) => {
    const {
        account,
        chainId,
        connecting,
        connected,
        networkConfig,
        balance,
        connectWallet,
        disconnect,
        switchNetwork,
        error,
    } = useWeb3();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [networkMenuAnchor, setNetworkMenuAnchor] = useState<null | HTMLElement>(null);
    const [showNetworkError, setShowNetworkError] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleConnect = async () => {
        try {
            await connectWallet();
            if (account) {
                onConnect(account);
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            setShowNetworkError(true);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        onDisconnect();
        setAnchorEl(null);
    };

    const handleNetworkSwitch = async (targetChainId: number) => {
        try {
            await switchNetwork(targetChainId);
            setNetworkMenuAnchor(null);
        } catch (error) {
            console.error('Failed to switch network:', error);
            setShowNetworkError(true);
        }
    };

    const copyAddress = async () => {
        if (account) {
            await navigator.clipboard.writeText(account);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getNetworkStatusColor = () => {
        if (!chainId) return 'default';
        return SUPPORTED_NETWORKS[chainId] ? 'success' : 'error';
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <Box className={className}>
            {!connected ? (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConnect}
                    disabled={connecting}
                    startIcon={<AccountBalanceWallet />}
                    endIcon={connecting && <CircularProgress size={20} />}
                >
                    {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
            ) : (
                <Box display="flex" alignItems="center" gap={2}>
                    {/* Network Status */}
                    <Tooltip title={networkConfig?.name || 'Unknown Network'}>
                        <Chip
                            icon={networkConfig ? <CheckCircle /> : <Warning />}
                            label={networkConfig?.name || 'Unknown Network'}
                            color={getNetworkStatusColor()}
                            onClick={(e) => setNetworkMenuAnchor(e.currentTarget)}
                            sx={{ cursor: 'pointer' }}
                        />
                    </Tooltip>

                    {/* Balance */}
                    <Paper sx={{ px: 2, py: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            Balance: {formatCurrency(Number(balance))} {networkConfig?.nativeCurrency.symbol}
                        </Typography>
                    </Paper>

                    {/* Account */}
                    <Box>
                        <Button
                            variant="outlined"
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            endIcon={<SwapHoriz />}
                        >
                            {formatAddress(account)}
                        </Button>
                    </Box>

                    {/* Copy Address Button */}
                    <Tooltip title={copied ? 'Copied!' : 'Copy Address'}>
                        <IconButton onClick={copyAddress} size="small">
                            <ContentCopy fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Account Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={copyAddress}>
                    <ContentCopy fontSize="small" sx={{ mr: 1 }} />
                    Copy Address
                </MenuItem>
                <MenuItem onClick={handleDisconnect}>
                    <AccountBalanceWallet fontSize="small" sx={{ mr: 1 }} />
                    Disconnect
                </MenuItem>
            </Menu>

            {/* Network Menu */}
            <Menu
                anchorEl={networkMenuAnchor}
                open={Boolean(networkMenuAnchor)}
                onClose={() => setNetworkMenuAnchor(null)}
            >
                {Object.entries(SUPPORTED_NETWORKS).map(([id, network]) => (
                    <MenuItem
                        key={id}
                        onClick={() => handleNetworkSwitch(Number(id))}
                        selected={chainId === Number(id)}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            {chainId === Number(id) && <CheckCircle fontSize="small" color="success" />}
                            {network.name}
                        </Box>
                    </MenuItem>
                ))}
            </Menu>

            {/* Error Dialog */}
            <Dialog
                open={showNetworkError}
                onClose={() => setShowNetworkError(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Connection Error</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error || 'Failed to connect to the network. Please try again.'}
                    </Alert>
                    <Typography variant="body2">
                        Please make sure you have MetaMask installed and are connected to a supported network.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowNetworkError(false)}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setShowNetworkError(false);
                            handleConnect();
                        }}
                    >
                        Try Again
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WalletConnector; 