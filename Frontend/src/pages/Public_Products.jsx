import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    TextField,
    Pagination,
    CircularProgress,
    InputAdornment,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    AppBar,
    Toolbar,
    Avatar,
    Menu,
    IconButton,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    Snackbar
} from '@mui/material';
import {
    Search as SearchIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 9;
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080/api";  // Added Default
    const [categories, setCategories] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [openSettings, setOpenSettings] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [userSettings, setUserSettings] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [userProfile, setUserProfile] = useState({
        fullName: '',
        phoneNumber: '',
        birthDate: ''
    });
    const [settingsError, setSettingsError] = useState('');
    const [profileError, setProfileError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const token = localStorage.getItem('token');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openProductDetails, setOpenProductDetails] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('');
    const [openOrderDetails, setOpenOrderDetails] = useState(false);
    const [orderDetails, setOrderDetails] = useState([]);
    const [orderError, setOrderError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setCurrentUser(user);
            console.log("currentUser:", user);
        }
        fetchProducts();
        fetchCategories();
    }, [page, debouncedSearchQuery, selectedCategory, sortField, sortOrder, priceRange, sortBy]);

    const handleUserMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleOpenProfile = () => {
        if (currentUser) {
            setUserProfile({
                fullName: currentUser.fullname || '',
                phoneNumber: currentUser.phone || '',
                birthDate: currentUser.birthday || ''
            });
        } else {
            setUserProfile({ fullName: '', phoneNumber: '', birthDate: '' });
        }
        setOpenProfile(true);
        handleUserMenuClose();
    };

    const handleCloseProfile = () => {
        setOpenProfile(false);
        setProfileError('');
    };

    const handleProfileChange = (event) => {
        const { name, value } = event.target;
        setUserProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        if (!userProfile.fullName) {
            setProfileError('Vui lòng nhập họ và tên.');
            return;
        }

        if (!userProfile.phoneNumber) {
            setProfileError('Vui lòng nhập số điện thoại.');
            return;
        }
        try {
            const updateData = {
                fullname: userProfile.fullName,
                phone: userProfile.phoneNumber,
                birthday: userProfile.birthDate
            };

            const response = await axios.put(
                `/auth/profile`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const updatedUser = { ...currentUser, ...updateData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
                setSuccessMessage('Cập nhật thông tin thành công!');
                toast.success('Cập nhật thông tin thành công!');
                setOpenSnackbar(true);
                handleCloseProfile();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileError(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        }
    };

    const handleSettings = () => {
        setUserSettings({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setOpenSettings(true);
        handleUserMenuClose();
    };

    const handleCloseSettings = () => {
        setOpenSettings(false);
        setSettingsError('');
    };

    const handleSettingsChange = (event) => {
        const { name, value } = event.target;
        setUserSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveSettings = async () => {
        try {
            if (userSettings.newPassword !== userSettings.confirmPassword) {
                setSettingsError('Mật khẩu xác nhận không khớp');
                return;
            }

            if (!userSettings.oldPassword) {
                setSettingsError('Vui lòng nhập mật khẩu hiện tại');
                return;
            }

            const response = await axios.put(
                `/auth/changePassword`,
                {
                    currentPassword: userSettings.oldPassword,
                    newPassword: userSettings.newPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setSuccessMessage('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
                toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
                setOpenSnackbar(true);
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating password:', error);
            setSettingsError(error.response?.data?.message || 'Lỗi khi cập nhật mật khẩu');
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let url = `/products?page=${page}&limit=${itemsPerPage}`;

            if (debouncedSearchQuery) {
                url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
            }

            if (selectedCategory) {
                url += `&category=${selectedCategory}`;
            }

            if (priceRange.min) {
                url += `&minPrice=${priceRange.min}`;
            }
            if (priceRange.max) {
                url += `&maxPrice=${priceRange.max}`;
            }

            if (sortBy === 'name-asc') {
                url += `&sortField=name&sortOrder=asc`;
            } else if (sortBy === 'name-desc') {
                url += `&sortField=name&sortOrder=desc`;
            } else if (sortBy === 'price-asc') {
                url += `&sortField=retailPrice&sortOrder=asc`;
            } else if (sortBy === 'price-desc') {
                url += `&sortField=retailPrice&sortOrder=desc`;
            } else {
                url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
            }

            const response = await axios.get(url);

            if (response.data && response.data.success) {
                setProducts(response.data.products);
                setTotalPages(response.data.totalPages);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setLoading(false);
            setError(error.response?.data?.message || 'Error loading products');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/categories');
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handlePageChange = (event) => {
        setPage(value);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setPage(1);
    };

    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
        setPage(1);
    };

    const handleOpenProductDetails = (product) => {
        setSelectedProduct(product);
        setOpenProductDetails(true);
    };

    const handleCloseProductDetails = () => {
        setOpenProductDetails(false);
    };

    const handlePriceRangeChange = (event) => {
        const { name, value } = event.target;
        setPriceRange(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1);
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
        setPage(1);
    };

    const handleOpenOrderDetails = () => {
        fetchOrderDetails();
        setOpenOrderDetails(true);
        handleUserMenuClose();
    };

    const handleCloseOrderDetails = () => {
        setOpenOrderDetails(false);
        setOrderDetails([]);
        setOrderError('');
    };

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.phone) {
                setOrderError('Không tìm thấy thông tin số điện thoại người dùng.');
                setLoading(false);
                return;
            }
            //IMPORTANT: Double Check the baseUrl and path here!
            const response = await axios.get(`${baseUrl}/reports/user`, {
                params: { phone: user.phone }, // Phone number in the query parameters
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(response.data);
            if (response.data.success) {
                setOrderDetails(response.data.orders);
            } else {
                setOrderError(response.data.message || 'Không tìm thấy đơn hàng nào.');
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setOrderError(error.response?.data?.message || 'Lỗi khi tải thông tin đơn hàng.');
            setLoading(false);
        }
    };
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenSnackbar(false);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!process.env.REACT_APP_API_URL) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">REACT_APP_API_URL environment variable is not set!</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <AppBar position="fixed" color="default" elevation={1}>
                <Toolbar sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    minHeight: '72px',
                    py: 1,
                }}>
                    <Typography
                        variant="h5"
                        noWrap
                        sx={{
                            fontWeight: 700,
                            color: 'primary.main',
                            cursor: 'pointer',
                            fontSize: '24px',
                        }}
                        onClick={() => navigate('/')}
                    >
                        Marketing Platform
                    </Typography>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '600px',
                        mx: 4,
                    }}>
                        <TextField
                            placeholder="Tìm kiếm sản phẩm..."
                            variant="outlined"
                            size="medium"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'background.paper',
                                    borderRadius: '20px',
                                    height: '44px',
                                },
                                '& .MuiOutlinedInput-input': {
                                    fontSize: '16px',
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: '20px' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{
                            display: 'flex',
                            gap: 1,
                            mt: 1,
                            flexWrap: 'nowrap',
                            justifyContent: 'center',
                            overflowX: 'auto',
                            '&::-webkit-scrollbar': {
                                display: 'none'
                            },
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none'
                        }}>
                            <MenuItem
                                onClick={() => handleCategoryChange({ target: { value: '' } })}
                                selected={selectedCategory === ''}
                                sx={{
                                    borderRadius: '15px',
                                    minWidth: 'auto',
                                    py: 0.5,
                                    whiteSpace: 'nowrap',
                                    px: 2
                                }}
                            >
                                Tất cả
                            </MenuItem>
                            {categories.map((category) => (
                                <MenuItem
                                    key={category._id}
                                    onClick={() => handleCategoryChange({ target: { value: category._id } })}
                                    selected={selectedCategory === category._id}
                                    sx={{
                                        borderRadius: '15px',
                                        minWidth: 'auto',
                                        py: 0.5,
                                        whiteSpace: 'nowrap',
                                        px: 2
                                    }}
                                >
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>

                        <TextField
                            label="Giá tối thiểu"
                            name="min"
                            type="number"
                            value={priceRange.min}
                            onChange={handlePriceRangeChange}
                            size="small"
                            sx={{ width: '120px' }}
                            InputProps={{ inputProps: { min: 0 } }}  // prevent negative values
                        />
                        <TextField
                            label="Giá tối đa"
                            name="max"
                            type="number"
                            value={priceRange.max}
                            onChange={handlePriceRangeChange}
                            size="small"
                            sx={{ width: '120px' }}
                            InputProps={{ inputProps: { min: 0 } }}  // prevent negative values
                        />

                        <FormControl size="small" sx={{ width: '150px' }}>
                            <InputLabel id="sort-by-label">Sắp xếp theo</InputLabel>
                            <Select
                                labelId="sort-by-label"
                                id="sort-by"
                                value={sortBy}
                                label="Sắp xếp theo"
                                onChange={handleSortChange}
                            >
                                <MenuItem value="">Mặc định</MenuItem>
                                <MenuItem value="name-asc">Tên (A-Z)</MenuItem>
                                <MenuItem value="name-desc">Tên (Z-A)</MenuItem>
                                <MenuItem value="price-asc">Giá (Thấp đến cao)</MenuItem>
                                <MenuItem value="price-desc">Giá (Cao đến thấp)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ mr: 1, fontSize: '16px' }}>
                            {currentUser?.username}
                        </Typography>
                        <IconButton onClick={handleUserMenuClick}>
                            <Avatar
                                src={currentUser?.avatar}
                                alt={currentUser?.username}
                                sx={{ width: 40, height: 40 }}
                            />
                        </IconButton>

                        {currentUser && currentUser.role == 'User' && (
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleUserMenuClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                        mt: 1.5,
                                    },
                                }}
                            >
                                <MenuItem onClick={handleOpenProfile}>
                                    <SettingsIcon fontSize="small" />
                                    <ListItemText>Cài đặt thông tin</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleSettings}>
                                    <SettingsIcon fontSize="small" />
                                    <ListItemText>Cài đặt tài khoản</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleOpenOrderDetails}>
                                    <ShoppingCartIcon fontSize="small" />
                                    <ListItemText>Thông tin đơn hàng</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon fontSize="small" />
                                    <ListItemText>Đăng xuất</ListItemText>
                                </MenuItem>
                            </Menu>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ pt: 12 }}>
                <Container maxWidth="lg">
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={3}>
                        {products.map((product) => (
                            <Grid item xs={12} sm={6} md={4} key={product._id}>
                                <Card onClick={() => handleOpenProductDetails(product)} style={{ cursor: 'pointer' }}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={product.images && product.images[0] ? product.images[0].data : '/images/placeholder.png'}
                                        alt={product.name}
                                        sx={{ objectFit: 'contain' }}
                                    />
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="div">
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {product.description}
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.retailPrice)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Danh mục: {product.category?.name || 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </Container>
            </Box>

            {/* Profile Settings Dialog */}
            <Dialog open={openProfile} onClose={handleCloseProfile} maxWidth="sm" fullWidth>
                <DialogTitle>Cài đặt thông tin</DialogTitle>
                <DialogContent>
                    {profileError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {profileError}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Họ và tên"
                            name="fullName"
                            value={userProfile.fullName}
                            onChange={handleProfileChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Số điện thoại"
                            name="phoneNumber"
                            value={userProfile.phoneNumber}
                            onChange={handleProfileChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Ngày sinh"
                            name="birthDate"
                            type="date"
                            value={userProfile.birthDate}
                            onChange={handleProfileChange}
                            fullWidth
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProfile}>Hủy</Button>
                    <Button onClick={handleSaveProfile} variant="contained" color="primary">
                        Lưu thay đổi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Account Settings Dialog */}
            <Dialog open={openSettings} onClose={handleCloseSettings} maxWidth="sm" fullWidth>
                <DialogTitle>Cài đặt tài khoản</DialogTitle>
                <DialogContent>
                    {settingsError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {settingsError}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Đổi mật khẩu
                        </Typography>
                        <TextField
                            label="Mật khẩu hiện tại"
                            name="oldPassword"
                            type="password"
                            value={userSettings.oldPassword}
                            onChange={handleSettingsChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Mật khẩu mới"
                            name="newPassword"
                            type="password"
                            value={userSettings.newPassword}
                            onChange={handleSettingsChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Xác nhận mật khẩu mới"
                            name="confirmPassword"
                            type="password"
                            value={userSettings.confirmPassword}
                            onChange={handleSettingsChange}
                            fullWidth
                            required
                            error={userSettings.newPassword !== userSettings.confirmPassword}
                            helperText={userSettings.newPassword !== userSettings.confirmPassword ? 'Mật khẩu không khớp' : ''}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSettings}>Hủy</Button>
                    <Button onClick={handleSaveSettings} variant="contained" color="primary">
                        Lưu thay đổi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Product Details Dialog */}
            <Dialog
                open={openProductDetails}
                onClose={handleCloseProductDetails}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{selectedProduct?.name}</DialogTitle>
                <DialogContent>
                    {selectedProduct && (
                        <Box>
                            <img
                                src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].data : '/images/placeholder.png'}
                                alt={selectedProduct.name}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                {selectedProduct.description}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                                Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedProduct.retailPrice)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Danh mục: {selectedProduct.category?.name || 'N/A'}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProductDetails}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Order Details Dialog */}
            <Dialog open={openOrderDetails} onClose={handleCloseOrderDetails} maxWidth="md" fullWidth>
                <DialogTitle>Thông tin đơn hàng</DialogTitle>
                <DialogContent>
                    {orderError && (
                        <Alert severity="error">{orderError}</Alert>
                    )}
                    {orderDetails.length > 0 ? (
                        <List>
                            {orderDetails.map((order) => (
                                <ListItem key={order._id} divider>
                                    <ListItemText
                                        primary={`Đơn hàng #${order._id}`}
                                        secondary={
                                            <>
                                                <Typography variant="body2">{`Ngày đặt hàng: ${new Date(order.createdAt).toLocaleDateString()}`}</Typography>
                                                <Typography variant="body2">{`Tổng tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}`}</Typography>
                                                {/* Display Product Quantities */}
                                                <Typography variant="body2">
                                                    Sản phẩm: {order.products.map(p => `${p.name} (SL: ${p.quantity})`).join(', ')}
                                                </Typography>

                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : !orderError ? (
                        <Typography>Không có đơn hàng nào.</Typography>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseOrderDetails}>Đóng</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue];
}

export default Products;