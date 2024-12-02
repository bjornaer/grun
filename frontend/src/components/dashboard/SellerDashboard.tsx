import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { Edit, Delete, Download, Refresh } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { 
    fetchSellerCredits, 
    createCredit, 
    updateCredit, 
    deleteCredit,
    exportTransactionHistory 
} from '../../store/slices/sellerSlice';
import { CarbonCredit, Transaction } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { saveAs } from 'file-saver';

const validationSchema = Yup.object({
    project_name: Yup.string()
        .required('Project name is required')
        .min(3, 'Project name must be at least 3 characters'),
    verifier: Yup.string()
        .required('Verifier is required')
        .min(3, 'Verifier name must be at least 3 characters'),
    total_credits: Yup.number()
        .min(1, 'Must be at least 1')
        .required('Total credits is required'),
    price_per_credit: Yup.number()
        .min(0, 'Price must be positive')
        .required('Price is required'),
    expiry_date: Yup.date()
        .min(new Date(), 'Expiry date must be in the future')
        .required('Expiry date is required'),
    description: Yup.string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters'),
});

const SellerDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { credits, transactions, loading, error } = useSelector(
        (state: RootState) => state.seller
    );
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchSellerCredits());
    }, [dispatch]);

    const formik = useFormik({
        initialValues: {
            project_name: '',
            verifier: '',
            total_credits: 0,
            price_per_credit: 0,
            expiry_date: '',
            description: '',
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                if (selectedCredit) {
                    await dispatch(updateCredit({ id: selectedCredit.id, ...values })).unwrap();
                } else {
                    await dispatch(createCredit(values)).unwrap();
                }
                resetForm();
                setOpenDialog(false);
                setSelectedCredit(null);
            } catch (error) {
                console.error('Failed to save credit:', error);
            }
        },
    });

    const handleEditCredit = (credit: CarbonCredit) => {
        setSelectedCredit(credit);
        formik.setValues({
            project_name: credit.project_name,
            verifier: credit.verifier,
            total_credits: credit.total_credits,
            price_per_credit: credit.price_per_credit,
            expiry_date: credit.expiry_date.split('T')[0],
            description: credit.description,
        });
        setOpenDialog(true);
    };

    const handleDeleteCredit = async (creditId: string) => {
        if (window.confirm('Are you sure you want to delete this credit?')) {
            try {
                await dispatch(deleteCredit(creditId)).unwrap();
            } catch (error) {
                console.error('Failed to delete credit:', error);
            }
        }
    };

    const handleExportHistory = async () => {
        setExportLoading(true);
        try {
            const data = await dispatch(exportTransactionHistory()).unwrap();
            const blob = new Blob([data], { type: 'text/csv' });
            saveAs(blob, `transaction-history-${new Date().toISOString()}.csv`);
        } catch (error) {
            console.error('Failed to export history:', error);
        } finally {
            setExportLoading(false);
        }
    };

    const handleRefresh = () => {
        dispatch(fetchSellerCredits());
    };

    const calculateStats = () => {
        const totalSold = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
        const activeCredits = credits.filter(c => new Date(c.expiry_date) > new Date()).length;

        return { totalSold, totalRevenue, activeCredits };
    };

    const stats = calculateStats();

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Seller Dashboard</Typography>
                <Box>
                    <Tooltip title="Refresh data">
                        <IconButton onClick={handleRefresh} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSelectedCredit(null);
                            formik.resetForm();
                            setOpenDialog(true);
                        }}
                        sx={{ ml: 2 }}
                    >
                        Create New Credit
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total Credits Sold</Typography>
                            <Typography variant="h4">{stats.totalSold}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total Revenue</Typography>
                            <Typography variant="h4">{formatCurrency(stats.totalRevenue)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Active Credits</Typography>
                            <Typography variant="h4">{stats.activeCredits}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ mb: 4 }}>
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Your Carbon Credits</Typography>
                    {loading && <CircularProgress size={24} />}
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Project Name</TableCell>
                                <TableCell>Verifier</TableCell>
                                <TableCell align="right">Total Credits</TableCell>
                                <TableCell align="right">Available</TableCell>
                                <TableCell align="right">Price/Credit</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Expiry Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {credits.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((credit) => (
                                <TableRow key={credit.id}>
                                    <TableCell>{credit.project_name}</TableCell>
                                    <TableCell>{credit.verifier}</TableCell>
                                    <TableCell align="right">{credit.total_credits}</TableCell>
                                    <TableCell align="right">{credit.available_credits}</TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(credit.price_per_credit)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={credit.status}
                                            color={credit.status === 'VERIFIED' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(credit.expiry_date)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditCredit(credit)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteCredit(credit.id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={credits.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

            <Paper>
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Transaction History</Typography>
                    <Button
                        startIcon={<Download />}
                        onClick={handleExportHistory}
                        disabled={exportLoading}
                    >
                        {exportLoading ? 'Exporting...' : 'Export History'}
                    </Button>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Buyer</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Total Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Transaction Hash</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                                    <TableCell>{transaction.buyer_email}</TableCell>
                                    <TableCell>{transaction.carbon_credit.project_name}</TableCell>
                                    <TableCell align="right">{transaction.quantity}</TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(transaction.total_amount)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={transaction.status}
                                            color={transaction.status === 'COMPLETED' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {transaction.blockchain_tx_hash ? (
                                            <Tooltip title="View on block explorer">
                                                <Button
                                                    size="small"
                                                    href={`https://polygonscan.com/tx/${transaction.blockchain_tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    View
                                                </Button>
                                            </Tooltip>
                                        ) : (
                                            'N/A'
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog 
                open={openDialog} 
                onClose={() => {
                    setOpenDialog(false);
                    setSelectedCredit(null);
                    formik.resetForm();
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {selectedCredit ? 'Edit Carbon Credit' : 'Create New Carbon Credit'}
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    name="project_name"
                                    label="Project Name"
                                    value={formik.values.project_name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.project_name && Boolean(formik.errors.project_name)}
                                    helperText={formik.touched.project_name && formik.errors.project_name}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    name="verifier"
                                    label="Verifier"
                                    value={formik.values.verifier}
                                    onChange={formik.handleChange}
                                    error={formik.touched.verifier && Boolean(formik.errors.verifier)}
                                    helperText={formik.touched.verifier && formik.errors.verifier}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="total_credits"
                                    label="Total Credits"
                                    value={formik.values.total_credits}
                                    onChange={formik.handleChange}
                                    error={formik.touched.total_credits && Boolean(formik.errors.total_credits)}
                                    helperText={formik.touched.total_credits && formik.errors.total_credits}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    name="price_per_credit"
                                    label="Price per Credit"
                                    value={formik.values.price_per_credit}
                                    onChange={formik.handleChange}
                                    error={formik.touched.price_per_credit && Boolean(formik.errors.price_per_credit)}
                                    helperText={formik.touched.price_per_credit && formik.errors.price_per_credit}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    name="expiry_date"
                                    label="Expiry Date"
                                    value={formik.values.expiry_date}
                                    onChange={formik.handleChange}
                                    error={formik.touched.expiry_date && Boolean(formik.errors.expiry_date)}
                                    helperText={formik.touched.expiry_date && formik.errors.expiry_date}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    name="description"
                                    label="Description"
                                    value={formik.values.description}
                                    onChange={formik.handleChange}
                                    error={formik.touched.description && Boolean(formik.errors.description)}
                                    helperText={formik.touched.description && formik.errors.description}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => {
                                setOpenDialog(false);
                                setSelectedCredit(null);
                                formik.resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant="contained"
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default SellerDashboard; 