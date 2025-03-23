import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Box, 
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Paper,
    IconButton,
    Avatar,
    Menu,
    MenuItem
} from '@mui/material';
import { toast } from 'react-toastify'; 


const Landing = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const baseUrl = process.env.REACT_APP_API_URL;
    
    useEffect(() => {
        setIsVisible(true);
        fetchLatestProducts();
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    const fetchLatestProducts = async () => {
        try {
            const response = await axios.get(`${baseUrl}/products?page=1&limit=8&sortField=createdAt&sortOrder=desc`);
            if (response.data && response.data.success) {
                setProducts(response.data.products);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]); // Set empty array if error
            setLoading(false);
        }
    };

    const handleStartNow = () => {
        navigate('/dashboard');
    };

    const handleNews = () => {
        navigate('/news');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Search query:', searchQuery);
    };

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProduct(null);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleUserMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        navigate('/login');
    };

    const handlePublic_Products = () => {
        navigate('/public-products');
    };

    return (
        <div style={styles.landingContainer}>
            {/* Header Section */}
            <div style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.logo}>Nền Tảng Marketing</div>

                    <div style={styles.headerActions}>
                        <div style={styles.navigationButtons}>
                            <button onClick={handleNews} style={styles.headerButton}>
                                Tin tức
                            </button>
                            <button onClick={handlePublic_Products} style={styles.startButton}>
                                Sản Phẩm
                            </button>
                            {currentUser && currentUser.role !== 'User' && (
                                <button onClick={handleStartNow} style={styles.startButton}>
                                    Dashboard
                                </button>
                            )}
                        </div>
                        <div style={styles.userSection}>
                            {currentUser ? (
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    border: '2px solid #4CAF50',
                                    borderRadius: '25px',
                                    padding: '4px 12px',
                                    '&:hover': {
                                        borderColor: '#45a049',
                                    }
                                }}>
                                    <Typography variant="body1" sx={{ 
                                        mr: 1, 
                                        fontSize: '16px',
                                        color: '#000'
                                    }}>
                                        {currentUser.username}
                                    </Typography>
                                    <IconButton onClick={handleUserMenuClick} sx={{ p: 0 }}>
                                        <Avatar
                                            src={currentUser.avatar !== 'user_default.png' ? `data:image/png;base64,${currentUser.avatar}` : '/default-avatar.png'}
                                            alt={currentUser.username}
                                            sx={{ width: 40, height: 40 }}
                                        />
                                    </IconButton>
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
                                        <MenuItem onClick={handleLogout}>
                                            Đăng xuất
                                        </MenuItem>
                                    </Menu>
                                </Box>
                            ) : (
                                <IconButton 
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        bgcolor: '#4CAF50',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: '#45a049',
                                        },
                                        px: 2,
                                        py: 1,
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Typography variant="button">
                                        Đăng nhập
                                    </Typography>
                                    <Avatar sx={{ width: 32, height: 32 }} />
                                </IconButton>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Product Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                {selectedProduct && (
                    <>
                        <DialogTitle>
                            Chi tiết sản phẩm
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <img
                                        src={selectedProduct.images && selectedProduct.images.length > 0 
                                            ? selectedProduct.images[0].data
                                            : '/placeholder.jpg'}
                                        alt={selectedProduct.name}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '400px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TableContainer component={Paper} elevation={0}>
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell component="th" scope="row">Tên sản phẩm</TableCell>
                                                    <TableCell>{selectedProduct.name}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell component="th" scope="row">Giá bán</TableCell>
                                                    <TableCell>{formatPrice(selectedProduct.retailPrice)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell component="th" scope="row">Danh mục</TableCell>
                                                    <TableCell>{selectedProduct.category?.name}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell component="th" scope="row">Số lượng còn</TableCell>
                                                    <TableCell>{selectedProduct.quantity}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell component="th" scope="row">Mô tả</TableCell>
                                                    <TableCell>{selectedProduct.description}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog} color="primary">
                                Đóng
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <div style={styles.backgroundImage}></div>
            <div style={styles.gradientOverlay}></div>
            <div style={{...styles.content, opacity: isVisible ? 1 : 0}}>
                {/* Hero Section */}
                <div style={styles.heroSection}>
                    <h1 style={styles.title}>Nền Tảng Marketing</h1>
                    <p style={styles.subtitle}>
                        Trang web marketing của chúng tôi cung cấp giải pháp toàn diện để tối ưu hóa hiệu quả kinh doanh. Với hệ thống chatbox tự động trả lời tin nhắn 24/7, chúng tôi đảm bảo hỗ trợ khách hàng mọi lúc, mọi nơi. Đồng thầm, hệ thống tiếp nhận và xử lý đánh giá giúp cải thiện chất lượng dịch vụ liên tục. 
                    </p>
                </div>

                {/* Features Section */}
                <div style={styles.featuresContainer}>
                    <div style={styles.featureBox}>
                        <div style={styles.iconCircle}>🚀</div>
                        <h3 style={styles.featureTitle}>Phản hồi yêu cầu bán hàng</h3>
                        <p style={styles.featureText}>Trả lời tin nhắn với khách hàng với AI</p>
                    </div>
                    <div style={styles.featureBox}>
                        <div style={styles.iconCircle}>💡</div>
                        <h3 style={styles.featureTitle}>Tối ưu marketing</h3>
                        <p style={styles.featureText}>Phân tích và tối ưu chiến dịch thông minh</p>
                    </div>
                    <div style={styles.featureBox}>
                        <div style={styles.iconCircle}>🎯</div>
                        <h3 style={styles.featureTitle}>Đề xuất sản phẩm</h3>
                        <p style={styles.featureText}>Nắm bắt hành vi khách hàng</p>
                    </div>
                </div>

                {/* Latest Products Section */}
                <div style={styles.productsSection}>
                    <h2 style={styles.sectionTitle}>Sản Phẩm Mới Nhất</h2>
                    {loading ? (
                        <Box display="flex" justifyContent="center" my={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {products.map((product) => (
                                <Grid item xs={12} sm={6} md={3} key={product._id}>
                                    <Card style={styles.productCard}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={product.images && product.images.length > 0 
                                                ? product.images[0].data
                                                : '/placeholder.jpg'}
                                            alt={product.name}
                                            style={styles.productImage}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/placeholder.jpg';
                                            }}
                                        />
                                        <CardContent>
                                            <Typography gutterBottom variant="h6" component="div" style={styles.productName}>
                                                {product.name}
                                            </Typography>
                                            <Typography variant="body1" color="text.primary" style={styles.productPrice}>
                                                {formatPrice(product.retailPrice)}
                                            </Typography>
                                            <Button 
                                                variant="contained" 
                                                fullWidth 
                                                style={styles.viewButton}
                                                onClick={() => handleViewProduct(product)}
                                            >
                                                Xem chi tiết
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    landingContainer: {
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(http://localhost:8080/img/landing.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        zIndex: 1,
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #4834d4 0%, #8b5cf6 100%)',
        opacity: 0.95,
        zIndex: 2,
    },
    content: {
        position: 'relative',
        zIndex: 3,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        transition: 'opacity 1s ease-in-out',
    },
    heroSection: {
        textAlign: 'center',
        marginBottom: '4rem',
    },
    title: {
        fontSize: '4.5rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '1.5rem',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
        letterSpacing: '-1px',
    },
    subtitle: {
        fontSize: '1.5rem',
        color: 'rgba(255, 255, 255, 0.9)',
        maxWidth: '800px',
        margin: '0 auto 3rem',
        lineHeight: '1.6',
        fontWeight: '300',
    },
    buttonGroup: {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        marginBottom: '2rem',
    },
    startNowButton: {
        padding: '1.2rem 3rem',
        fontSize: '1.1rem',
        backgroundColor: '#ffffff',
        color: '#4834d4',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
        },
    },
    demoButton: {
        padding: '1.2rem 3rem',
        fontSize: '1.1rem',
        backgroundColor: 'transparent',
        color: 'white',
        border: '2px solid white',
        borderRadius: '30px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontWeight: '600',
        '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
        },
    },
    featuresContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap',
        marginTop: '4rem',
    },
    featureBox: {
        width: '300px',
        padding: '2rem',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        transition: 'transform 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
            transform: 'translateY(-10px)',
        },
    },
    iconCircle: {
        width: '60px',
        height: '60px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
        fontSize: '2rem',
    },
    featureTitle: {
        color: 'white',
        fontSize: '1.5rem',
        marginBottom: '1rem',
        fontWeight: '600',
    },
    featureText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: '1rem',
        lineHeight: '1.5',
    },
    // New header styles
    header: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '1rem 0',
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#4834d4',
        cursor: 'pointer',
    },
    searchContainer: {
        flex: '1',
        maxWidth: '600px',
        margin: '0 2rem',
    },
    searchForm: {
        display: 'flex',
        position: 'relative',
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: '25px',
        border: '1px solid #e2e8f0',
    },
    searchInput: {
        width: '100%',
        padding: '0.9rem 1.2rem',
        paddingRight: '3.5rem',
        borderRadius: '25px',
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        backgroundColor: 'transparent',
        transition: 'all 0.3s ease',
    },
    searchButton: {
        position: 'absolute',
        right: '1.2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.3rem',
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '40px', // Tăng khoảng cách giữa navigationButtons và userSection
    },
    navigationButtons: {
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
    },
    headerButton: {
        padding: '0.8rem 1.8rem',
        backgroundColor: '#4834d4',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontSize: '1rem',
        fontWeight: '500',
        '&:hover': {
            backgroundColor: '#3c2ba3',
        },
    },
    startButton: {
        padding: '0.8rem 1.8rem',
        backgroundColor: '#4834d4',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontSize: '1rem',
        fontWeight: '500',
        '&:hover': {
            backgroundColor: '#3c2ba3',
        },
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    // New styles for products section
    productsSection: {
        marginTop: '4rem',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '20px',
    },
    sectionTitle: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#4834d4',
        marginBottom: '2rem',
        textAlign: 'center',
    },
    productCard: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease',
        backgroundColor: 'white',
        '&:hover': {
            transform: 'translateY(-5px)',
        },
    },
    productImage: {
        objectFit: 'contain',
        width: '100%',
        height: '200px',
        backgroundColor: '#f5f5f5',
        padding: '1rem',
    },
    productName: {
        fontSize: '1.1rem',
        fontWeight: '500',
        marginBottom: '0.5rem',
        height: '2.5em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        '-webkit-line-clamp': '2',
        '-webkit-box-orient': 'vertical',
    },
    productPrice: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#4834d4',
        marginBottom: '1rem',
    },
    viewButton: {
        backgroundColor: '#4834d4',
        color: 'white',
        '&:hover': {
            backgroundColor: '#3c2ba3',
        },
    },
};

export default Landing;
