import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    MenuItem,
    Chip,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import {
    Download,
    Refresh,
    FilterList,
    LocalAtm,
    Co2,
    Park,
    Timeline,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    fetchTransactions,
    exportTransactions,
    retireCredits,
} from '../../store/slices/buyerSlice';
import { Transaction, TransactionStatus } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver';

interface FilterState {
    dateFrom: string;
    dateTo: string;
    status: TransactionStatus | 'ALL';
    minAmount: string;
    maxAmount: string;
}

const BuyerDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { transactions, loading, error } = useSelector(
        (state: RootState) => state.buyer
    );
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [retireAmount, setRetireAmount] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        dateFrom: '',
        dateTo: '',
        status: 'ALL',
        minAmount: '',
        maxAmount: '',
    });
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchTransactions(filters));
    }, [dispatch, filters]);

    const handlePageChange = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const data = await dispatch(exportTransactions(filters)).unwrap();
            const blob = new Blob([data], { type: 'text/csv' });
            saveAs(blob, `transactions-${new Date().toISOString()}.csv`);
        } catch (error) {
            console.error('Failed to export transactions:', error);
        } finally {
            setExportLoading(false);
        }
    };

    const handleRetireCredits = async () => {
        if (!selectedTransaction) return;

        try {
            await dispatch(retireCredits({
                transactionId: selectedTransaction.id,
                amount: retireAmount
            })).unwrap();
            setSelectedTransaction(null);
            setRetireAmount(0);
            dispatch(fetchTransactions(filters));
        } catch (error) {
            console.error('Failed to retire credits:', error);
        }
    };

    const calculateStats = () => {
        const totalCredits = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
        const totalSpent = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
        const retiredCredits = transactions.reduce((sum, tx) => 
            sum + (tx.retired_amount || 0), 0);
        
        return { totalCredits, totalSpent, retiredCredits };
    };

    const prepareChartData = () => {
        const monthlyData: { [key: string]: number } = {};
        transactions.forEach(tx => {
            const month = new Date(tx.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyData[month] = (monthlyData[month] || 0) + tx.quantity;
        });

        return Object.entries(monthlyData).map(([month, quantity]) => ({
            month,
            quantity
        }));
    };

    const stats = calculateStats();
    const chartData = prepareChartData();

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Buyer Dashboard</Typography>
                <Box>
                    <Tooltip title="Toggle filters">
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterList />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh data">
                        <IconButton 
                            onClick={() => dispatch(fetchTransactions(filters))}
                            disabled={loading}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        startIcon={<Download />}
                        onClick={handleExport}
                        disabled={exportLoading}
                        sx={{ ml: 2 }}
                    >
                        {exportLoading ? 'Exporting...' : 'Export'}
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <LocalAtm color="primary" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography variant="h6">Total Spent</Typography>
                                    <Typography variant="h4">
                                        {formatCurrency(stats.totalSpent)}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Co2 color="primary" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography variant="h6">Total Credits</Typography>
                                    <Typography variant="h4">
                                        {stats.totalCredits}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Park color="primary" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography variant="h6">Retired Credits</Typography>
                                    <Typography variant="h4">
                                        {stats.retiredCredits}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Credits Purchase Trend Chart */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Credits Purchase Trend
                </Typography>
                <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip />
                            <Line 
                                type="monotone" 
                                dataKey="quantity" 
                                stroke="#2196f3" 
                                strokeWidth={2} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* Filters */}
            {showFilters && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                type="date"
                                name="dateFrom"
                                label="Date From"
                                value={filters.dateFrom}
                                onChange={handleFilterChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                type="date"
                                name="dateTo"
                                label="Date To"
                                value={filters.dateTo}
                                onChange={handleFilterChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                select
                                name="status"
                                label="Status"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="ALL">All</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="FAILED">Failed</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                type="number"
                                name="minAmount"
                                label="Min Amount"
                                value={filters.minAmount}
                                onChange={handleFilterChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                type="number"
                                name="maxAmount"
                                label="Max Amount"
                                value={filters.maxAmount}
                                onChange={handleFilterChange}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Transactions Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Retired</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : transactions
                                .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                                .map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                                        <TableCell>{transaction.carbon_credit.project_name}</TableCell>
                                        <TableCell align="right">{transaction.quantity}</TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(transaction.total_amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={transaction.status}
                                                color={
                                                    transaction.status === 'COMPLETED'
                                                        ? 'success'
                                                        : transaction.status === 'PENDING'
                                                        ? 'warning'
                                                        : 'error'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {transaction.retired_amount || 0} / {transaction.quantity}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                disabled={
                                                    transaction.status !== 'COMPLETED' ||
                                                    transaction.retired_amount === transaction.quantity
                                                }
                                                onClick={() => setSelectedTransaction(transaction)}
                                            >
                                                Retire
                                            </Button>
                                            {transaction.blockchain_tx_hash && (
                                                <Tooltip title="View on block explorer">
                                                    <IconButton
                                                        size="small"
                                                        href={`https://polygonscan.com/tx/${transaction.blockchain_tx_hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Timeline fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={transactions.length}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Paper>

            {/* Retire Credits Dialog */}
            <Dialog
                open={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Retire Carbon Credits</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        Available credits: {selectedTransaction
                            ? selectedTransaction.quantity - (selectedTransaction.retired_amount || 0)
                            : 0}
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        label="Amount to Retire"
                        value={retireAmount}
                        onChange={(e) => setRetireAmount(Number(e.target.value))}
                        inputProps={{
                            min: 1,
                            max: selectedTransaction
                                ? selectedTransaction.quantity - (selectedTransaction.retired_amount || 0)
                                : 0,
                        }}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedTransaction(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleRetireCredits}
                        disabled={!retireAmount || retireAmount <= 0}
                    >
                        Retire Credits
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BuyerDashboard; 