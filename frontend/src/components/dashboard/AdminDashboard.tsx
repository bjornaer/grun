import React, { useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { CarbonCredit, User } from '../../types';
import { verifyCreditAction, blockUserAction } from '../../store/slices/adminSlice';
import { toast } from 'react-toastify';

const AdminDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { credits, loading: creditsLoading } = useSelector(
        (state: RootState) => state.marketplace
    );
    const { loading: adminLoading, error } = useSelector(
        (state: RootState) => state.admin
    );
    const pendingCredits = credits.filter(
        (credit) => credit.status === 'PENDING'
    );

    const handleVerifyCredit = async (creditId: string, action: 'verify' | 'reject') => {
        try {
            await dispatch(verifyCreditAction({ creditId, action })).unwrap();
            toast.success(`Credit ${action}ed successfully`);
        } catch (error) {
            console.error(`Failed to ${action} credit:`, error);
            toast.error(`Failed to ${action} credit`);
        }
    };

    const handleBlockUser = async (userId: string) => {
        try {
            await dispatch(blockUserAction(userId)).unwrap();
            toast.success('User blocked successfully');
        } catch (error) {
            console.error('Failed to block user:', error);
            toast.error('Failed to block user');
        }
    };

    if (creditsLoading || adminLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Pending Verifications */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Pending Verifications
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Project Name</TableCell>
                                        <TableCell>Seller</TableCell>
                                        <TableCell>Credits</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingCredits.map((credit) => (
                                        <TableRow key={credit.id}>
                                            <TableCell>{credit.project_name}</TableCell>
                                            <TableCell>
                                                {credit.owner.organization_name}
                                            </TableCell>
                                            <TableCell>{credit.total_credits}</TableCell>
                                            <TableCell>
                                                ${credit.price_per_credit}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() =>
                                                            handleVerifyCredit(
                                                                credit.id,
                                                                'verify'
                                                            )
                                                        }
                                                    >
                                                        Verify
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="error"
                                                        onClick={() =>
                                                            handleVerifyCredit(
                                                                credit.id,
                                                                'reject'
                                                            )
                                                        }
                                                    >
                                                        Reject
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Platform Statistics */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Platform Statistics
                        </Typography>
                        <Typography variant="body1">
                            Total Credits Listed: {credits.reduce(
                                (total, credit) => total + credit.total_credits,
                                0
                            )}
                        </Typography>
                        <Typography variant="body1">
                            Pending Verifications: {pendingCredits.length}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard; 