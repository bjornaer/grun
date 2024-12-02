import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash/debounce';
import {
    Box,
    Grid,
    Typography,
    Paper,
    TextField,
    MenuItem,
    Dialog,
    Alert,
    CircularProgress,
    TablePagination,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { CreditCard } from './CreditCard';
import { CryptoPaymentForm } from '../payment/CryptoPaymentForm';
import { fetchCredits, filterCredits } from '../../store/slices/marketplaceSlice';
import { CarbonCredit } from '../../types';
import { AppDispatch, RootState } from '../../store';

const ITEMS_PER_PAGE = 9;
const SORT_OPTIONS = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
];

const MarketplacePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { credits, loading, error } = useSelector((state: RootState) => state.marketplace);
    const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(null);
    const [purchaseAmount, setPurchaseAmount] = useState<number>(0);
    const [page, setPage] = useState(0);
    const [sortBy, setSortBy] = useState('date_desc');
    const [filters, setFilters] = useState({
        status: 'VERIFIED',
        minPrice: '',
        maxPrice: '',
        search: '',
    });

    // Debounced filter function
    const debouncedFilter = useCallback(
        debounce((newFilters) => {
            dispatch(filterCredits(newFilters));
        }, 500),
        []
    );

    useEffect(() => {
        dispatch(fetchCredits());
    }, [dispatch]);

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        
        // Validate price inputs
        if ((name === 'minPrice' || name === 'maxPrice') && value !== '') {
            const numValue = Number(value);
            if (numValue < 0) return;
            if (name === 'minPrice' && filters.maxPrice && numValue > Number(filters.maxPrice)) return;
            if (name === 'maxPrice' && filters.minPrice && numValue < Number(filters.minPrice)) return;
        }

        const newFilters = {
            ...filters,
            [name]: value,
        };
        setFilters(newFilters);
        debouncedFilter(newFilters);
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSortBy(event.target.value);
        setPage(0); // Reset to first page when sorting changes
    };

    const handlePageChange = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handlePurchase = (credit: CarbonCredit) => {
        setPurchaseAmount(0);
        setSelectedCredit(credit);
    };

    const handlePaymentSuccess = () => {
        setSelectedCredit(null);
        dispatch(fetchCredits());
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment error:', error);
        // Additional error handling if needed
    };

    // Sort and paginate credits
    const sortedCredits = [...credits].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                return a.price_per_credit - b.price_per_credit;
            case 'price_desc':
                return b.price_per_credit - a.price_per_credit;
            case 'date_desc':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'date_asc':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            default:
                return 0;
        }
    });

    const paginatedCredits = sortedCredits.slice(
        page * ITEMS_PER_PAGE,
        (page + 1) * ITEMS_PER_PAGE
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Carbon Credit Marketplace
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            fullWidth
                            name="status"
                            label="Status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <MenuItem value="VERIFIED">Verified</MenuItem>
                            <MenuItem value="ALL">All</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            name="minPrice"
                            label="Min Price"
                            type="number"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            name="maxPrice"
                            label="Max Price"
                            type="number"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            name="search"
                            label="Search Projects"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                label="Sort By"
                                onChange={handleSortChange}
                            >
                                {SORT_OPTIONS.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            ) : paginatedCredits.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No carbon credits available
                </Alert>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {paginatedCredits.map((credit: CarbonCredit) => (
                            <Grid item xs={12} sm={6} md={4} key={credit.id}>
                                <CreditCard 
                                    credit={credit} 
                                    onPurchase={handlePurchase}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    
                    <TablePagination
                        component="div"
                        count={sortedCredits.length}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={ITEMS_PER_PAGE}
                        rowsPerPageOptions={[ITEMS_PER_PAGE]}
                        sx={{ mt: 3 }}
                    />
                </>
            )}

            <Dialog 
                open={!!selectedCredit} 
                onClose={() => setSelectedCredit(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedCredit && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Purchase Credits
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            label="Amount of Credits"
                            value={purchaseAmount}
                            onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                            inputProps={{ 
                                min: 1,
                                max: selectedCredit.available_credits 
                            }}
                            sx={{ mb: 3 }}
                            helperText={`Available: ${selectedCredit.available_credits} credits`}
                        />
                        <CryptoPaymentForm
                            paymentDetails={{
                                transactionId: `${selectedCredit.id}-${Date.now()}`,
                                amount: purchaseAmount,
                                tokenId: selectedCredit.token_id!
                            }}
                            selectedCredit={selectedCredit}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                        />
                    </Box>
                )}
            </Dialog>
        </Box>
    );
};

export default MarketplacePage; 