import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useTheme,
  Collapse,
  Avatar,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  Category as CategoryIcon,
  People as EmployeesIcon,
  Receipt as TransactionsIcon,
  Assessment as ReportsIcon,
  Settings,
  Article as BlogIcon,
  PostAdd as CreatePostIcon,
  List as PostListIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Products', icon: <ProductsIcon />, path: '/dashboard/products' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/dashboard/categories' },
  { text: 'Employees', icon: <EmployeesIcon />, path: '/dashboard/employees' },
  { text: 'Transactions', icon: <TransactionsIcon />, path: '/dashboard/transactions' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/dashboard/reports' },
  {
    text: 'Blog Management',
    icon: <BlogIcon />,
    subItems: [
      { text: 'Create Post', icon: <CreatePostIcon />, path: '/dashboard/create-post' },
      { text: 'All blog', icon: <PostListIcon />, path: '/dashboard/blog-manager' }
    ]
  },
  { text: 'Settings', icon: <Settings />, path: '/dashboard/settings' },
];

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      console.log('User data:', user);
      console.log('Avatar path:', user.avatar);
      setCurrentUser(user);
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleBlogClick = () => {
    setBlogOpen(!blogOpen);
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: '#ffffff',
        boxShadow: '0 0 20px rgba(0,0,0,0.05)',
      }}
    >
      <Toolbar sx={{ height: 80 }}>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196F3, #1976D2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          Marketing Platform
        </Typography>
      </Toolbar>
      <Divider sx={{ opacity: 0.1 }} />
      <Box sx={{ px: 2, py: 3 }}>
        <List sx={{ 
          '& .MuiListItem-root': {
            mb: 1.5,
            borderRadius: '12px',
            position: 'relative',
            transition: 'all 0.3s ease',
          }
        }}>
          {menuItems.map((item) => (
            item.subItems ? (
              <React.Fragment key={item.text}>
                <ListItem button onClick={() => setBlogOpen(!blogOpen)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {blogOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={blogOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItem
                        button
                        key={subItem.text}
                        component={Link}
                        to={subItem.path}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  minHeight: '56px',
                  backgroundColor: location.pathname === item.path ? '#f0f7ff' : 'transparent',
                  color: location.pathname === item.path ? '#2196F3' : '#637381',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    color: '#2196F3',
                    '& .MuiListItemIcon-root': {
                      color: '#2196F3',
                    },
                  },
                  '&.Mui-selected': {
                    '&:hover': {
                      backgroundColor: '#f0f7ff',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '32px',
                      width: '4px',
                      backgroundColor: '#2196F3',
                      borderRadius: '0 4px 4px 0',
                    }
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? '#2196F3' : '#637381',
                    minWidth: '45px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }
                  }}
                />
              </ListItem>
            )
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f4f6f8' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#637381' }}
          >
            <MenuIcon />
          </IconButton>

          {/* User Profile */}
          <Box sx={{ marginLeft: 'auto' }}>
            <Stack 
              component={Link}
              to="/dashboard/settings"
              direction="row" 
              spacing={2} 
              alignItems="center"
              sx={{
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: '#637381',
                  fontWeight: 500 
                }}
              >
                {currentUser?.username || 'User'}
              </Typography>
              <Avatar 
                src={currentUser?.avatar ? `data:image/jpeg;base64,${currentUser.avatar}` : undefined}
                alt={currentUser?.username || 'User'}
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: '#2196F3'
                }}
              >
                {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
              </Avatar>
            </Stack>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '80px',
          height: 'calc(100vh - 80px)',
          overflow: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;