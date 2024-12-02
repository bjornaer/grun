import React, { useState } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Drawer,
    IconButton,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useTheme,
    useMediaQuery,
    Badge,
    Container,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft,
    Dashboard,
    Store,
    Person,
    Settings,
    Notifications,
    ExitToApp,
    AccountCircle,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { WalletConnector } from '../web3/WalletConnector';
import Footer from './Footer';

const DRAWER_WIDTH = 240;

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
    
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    
    const { user } = useSelector((state: RootState) => state.auth);
    const { notifications } = useSelector((state: RootState) => state.notifications);

    const unreadNotifications = notifications.filter(n => !n.read).length;

    const menuItems = [
        {
            text: 'Marketplace',
            icon: <Store />,
            path: '/marketplace',
            roles: ['BUYER', 'SELLER', 'ADMIN'],
        },
        {
            text: 'Buyer Dashboard',
            icon: <Dashboard />,
            path: '/dashboard/buyer',
            roles: ['BUYER'],
        },
        {
            text: 'Seller Dashboard',
            icon: <Dashboard />,
            path: '/dashboard/seller',
            roles: ['SELLER'],
        },
        {
            text: 'Admin Dashboard',
            icon: <Dashboard />,
            path: '/dashboard/admin',
            roles: ['ADMIN'],
        },
        {
            text: 'Profile',
            icon: <Person />,
            path: '/profile',
            roles: ['BUYER', 'SELLER', 'ADMIN'],
        },
        {
            text: 'Settings',
            icon: <Settings />,
            path: '/settings',
            roles: ['BUYER', 'SELLER', 'ADMIN'],
        },
    ];

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const handleLogout = async () => {
        try {
            await dispatch(logout()).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const filteredMenuItems = menuItems.filter(item => 
        item.roles.includes(user?.role || '')
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <AppBar position="fixed" open={drawerOpen}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2, ...(drawerOpen && { display: 'none' }) }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {user?.username}
                    </Typography>
                    <div>
                        <IconButton
                            color="inherit"
                            aria-label="show 4 new mails"
                            color="inherit"
                            onClick={handleNotificationClick}
                        >
                            <Badge badgeContent={unreadNotifications} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                        <IconButton
                            color="inherit"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenuClick}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
                open={drawerOpen}
            >
                <Toolbar>
                    <IconButton onClick={handleDrawerToggle}>
                        {isMobile ? <MenuIcon /> : <ChevronLeft />}
                    </IconButton>
                </Toolbar>
                <Divider />
                <List>
                    {filteredMenuItems.map((item, index) => (
                        <ListItem key={index} button component="a" href={item.path}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                {children}
            </Container>
            <Footer />
        </Box>
    );
};

export default Layout; 