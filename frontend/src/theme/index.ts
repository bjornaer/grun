import { createTheme } from '@mui/material';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2E7D32', // Green for environmental theme
        },
        secondary: {
            main: '#00796B',
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF',
        },
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#4CAF50',
        },
        secondary: {
            main: '#009688',
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
    },
}); 