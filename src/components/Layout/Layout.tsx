import React, { useMemo, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  School,
  CheckCircle,
  Grade,
  Group,
  Settings,
  AccountCircle,
  Logout,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../../services/auth';
import { useColorMode } from '../../lib/ColorModeContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const allMenuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Students', icon: <People />, path: '/students' },
  { text: 'Enrollment', icon: <School />, path: '/enrollment' },
  { text: 'Attendance', icon: <CheckCircle />, path: '/attendance' },
  { text: 'Grading', icon: <Grade />, path: '/grading' },
  { text: 'Staff', icon: <Group />, path: '/staff' },
  { text: 'Sections', icon: <School />, path: '/admin/sections' },
  { text: 'Profile', icon: <Settings />, path: '/settings' },
];

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useColorMode();

  // Build role-based menu
  const menuItems = useMemo(() => {
    if (user.role === 'Admin') {
      return allMenuItems;
    }
    // Staff/Teacher restricted menu
    return [
      // Staff/Teacher dashboard leads to a focused view
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Students', icon: <People />, path: '/students' },
      { text: 'Attendance', icon: <CheckCircle />, path: '/attendance' },
      { text: 'Grading', icon: <Grade />, path: '/grading' },
    ];
  }, [user.role]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    onLogout();
    handleClose();
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Box
          component="img"
          src={process.env.PUBLIC_URL + '/logo.png'}
          alt="Jolly Children Academic Center logo"
          sx={{ width: 64, height: 64, objectFit: 'contain', display: 'block', mx: 'auto', mb: 1, borderRadius: 2 }}
        />
        <Typography variant="h6" color="primary" fontWeight="bold">
          Jolly Children Academic Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          School Management System
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {item.icon}
              {item.text}
            </Box>
          </MenuItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {
              // Try exact match, then startsWith (for nested routes like /students/:id)
              menuItems.find(item => item.path === location.pathname)?.text 
              || menuItems.find(item => location.pathname.startsWith(item.path))?.text 
              || 'Dashboard'
            }
            <Box component="span">
              {/* Role badge */}
              <Typography
                variant="caption"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.2)'
                }}
              >
                {user.role}
              </Typography>
            </Box>
          </Typography>
          {/* Theme toggle */}
          <IconButton sx={{ mr: 1 }} color="inherit" onClick={toggleMode} aria-label="Toggle theme">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {/* Academic year selector removed per request */}

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircle />
            </Avatar>
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
            onClose={handleClose}
          >
            <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
