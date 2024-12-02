import React from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    Chip,
} from '@mui/material';
import { CarbonCredit } from '../../types';

interface CreditCardProps {
    credit: CarbonCredit;
    onPurchase: (credit: CarbonCredit) => void;
}

const CreditCard: React.FC<CreditCardProps> = ({ credit, onPurchase }) => {
    return (
        <Card elevation={3}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {credit.project_name}
                </Typography>
                <Box sx={{ mb: 2 }}>
                    <Chip
                        label={credit.status}
                        color={credit.status === 'VERIFIED' ? 'success' : 'default'}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Verifier: {credit.verifier}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Available Credits: {credit.available_credits}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    ${credit.price_per_credit} per credit
                </Typography>
            </CardContent>
            <CardActions>
                <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => onPurchase(credit)}
                    disabled={credit.status !== 'VERIFIED'}
                >
                    Buy Now
                </Button>
            </CardActions>
        </Card>
    );
};

export default CreditCard; 