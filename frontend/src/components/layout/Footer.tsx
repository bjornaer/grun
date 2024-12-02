import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                px: 2,
                mt: 'auto',
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.grey[800],
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} Carbon Credits Platform. All rights reserved.
                    </Typography>
                    <Box>
                        <Link
                            href="/privacy"
                            color="inherit"
                            sx={{ mx: 1.5 }}
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            color="inherit"
                            sx={{ mx: 1.5 }}
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/contact"
                            color="inherit"
                            sx={{ mx: 1.5 }}
                        >
                            Contact Us
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer; 