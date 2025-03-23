import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    CircularProgress,
    Alert,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import { AssessmentOutlined, ShoppingCart } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState('today');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const baseUrl = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchReportData();
    }, [dateRange, startDate, endDate, currentPage]);

    const handleDateRangeChange = (e) => {
        const value = e.target.value;
        setDateRange(value);
        setCurrentPage(1);

        if (value !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const getDateRangeParam = (selectedRange) => {
        const rangeMap = {
            'today': 'today',
            'yesterday': 'yesterday',
            'last_7_days': 'last_7_days',
            'this_month': 'this_month',
            'custom': 'custom',
            'all': 'all'
        };
        return rangeMap[selectedRange] || 'this_month';
    };

    const fetchReportData = async () => {
        if (dateRange === 'custom' && (!startDate || !endDate)) {
            setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(baseUrl + '/reports', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    dateRange: getDateRangeParam(dateRange),
                    startDate: dateRange === 'custom' ? startDate : '',
                    endDate: dateRange === 'custom' ? endDate : '',
                    page: currentPage,
                    limit: 10
                }
            });

            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError('Không thể tải dữ liệu báo cáo!');
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            setError(error.response?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const handleViewReport = () => {
        fetchReportData();
    };

    const renderStatistics = () => (
        <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Tổng doanh thu</Typography>
                    <Typography variant="h4">{formatCurrency(data.statistics.totalRevenue)}</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Số đơn hàng</Typography>
                    <Typography variant="h4">{data.statistics.totalOrders}</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Tổng sản phẩm</Typography>
                    <Typography variant="h4">{data.statistics.totalProducts}</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Lợi nhuận</Typography>
                    <Typography variant="h4">{formatCurrency(data.statistics.totalProfit)}</Typography>
                </Paper>
            </Grid>
        </Grid>
    );

    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await axios.get(`${baseUrl}/reports/order/${orderId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(response.data.order);
            if (response.data.success) {
                setSelectedOrderDetails(response.data.order);
            } else {
                setError('Không thể tải chi tiết hóa đơn!');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            setError(error.response?.data?.message || 'Đã xảy ra lỗi khi tải chi tiết hóa đơn!');
        }
    };

    const renderOrders = () => (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Mã đơn hàng</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        <TableCell>Khách hàng</TableCell>
                        <TableCell>Số điện thoại</TableCell>
                        <TableCell>Nhân viên</TableCell>
                        <TableCell>Tổng tiền</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Chi tiết</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.orders.map((order) => (
                        <TableRow key={order._id}>
                            <TableCell>{order._id}</TableCell>
                            <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                            <TableCell>{order.customer?.phone || 'N/A'}</TableCell>
                            <TableCell>{order.employee || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell>{order.status || 'Đã hoàn thành'}</TableCell>
                            <TableCell>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => fetchOrderDetails(order._id)}
                                >
                                    Xem chi tiết
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const dialogStyles = {
        dialogTitle: {
            padding: '20px',
            borderBottom: '1px solid #eee',
            fontSize: '1.5rem',
            fontWeight: 'bold',
        },
        dialogContent: {
            padding: '20px',
        },
        orderInfo: {
            marginBottom: '15px',
        },
        orderInfoLabel: {
            fontWeight: 'bold',
            marginRight: '5px',
        },
        productListTitle: {
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginTop: '20px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
        },
        productList: {
            listStyleType: 'none',
            padding: 0,
        },
        productListItem: {
            marginBottom: '8px',
        },
        dialogActions: {
            padding: '20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
        },
        closeButton: {
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '1rem',
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100px',
        },
        loadingText: {
            marginLeft: '10px',
        },
        errorText: {
            color: 'red',
        }
    };


    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Báo cáo và phân tích
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    Xem dữ liệu bán hàng theo khoảng thời gian
                </Typography>

                <Paper sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Bộ lọc dữ liệu bán hàng
                    </Typography>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Chọn thời gian"
                                value={dateRange}
                                onChange={handleDateRangeChange}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="today">Hôm nay</MenuItem>
                                <MenuItem value="yesterday">Hôm qua</MenuItem>
                                <MenuItem value="last_7_days">7 ngày qua</MenuItem>
                                <MenuItem value="this_month">Tháng này</MenuItem>
                                <MenuItem value="custom">Khoảng tùy chọn</MenuItem>
                            </TextField>
                        </Grid>
                        {dateRange === 'custom' && (
                            <>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        type="date"
                                        fullWidth
                                        label="Ngày bắt đầu"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        type="date"
                                        fullWidth
                                        label="Ngày kết thúc"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<AssessmentOutlined />}
                                onClick={handleViewReport}
                            >
                                Xem báo cáo
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {data && (
                            <>
                                {renderStatistics()}
                                {renderOrders()}
                                {data.pagination && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                                        <Pagination
                                            count={data.pagination.totalPages}
                                            page={currentPage}
                                            onChange={handlePageChange}
                                            color="primary"
                                            showFirstButton
                                            showLastButton
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}

                <Dialog
                    open={!!selectedOrderDetails}
                    onClose={() => setSelectedOrderDetails(null)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle style={dialogStyles.dialogTitle}>
                        Chi tiết hóa đơn
                    </DialogTitle>
                    <DialogContent style={dialogStyles.dialogContent}>
                        {selectedOrderDetails ? (
                            <Box>
                                <div style={dialogStyles.orderInfo}>
                                    <span style={dialogStyles.orderInfoLabel}>Mã đơn hàng:</span>
                                    {selectedOrderDetails._id}
                                </div>
                                <div style={dialogStyles.orderInfo}>
                                    <span style={dialogStyles.orderInfoLabel}>Khách hàng:</span>
                                    {selectedOrderDetails.customer?.name || 'N/A'}
                                </div>
                                <div style={dialogStyles.orderInfo}>
                                    <span style={dialogStyles.orderInfoLabel}>Tổng tiền:</span>
                                    {formatCurrency(selectedOrderDetails.total_price)}
                                </div>
                                <Divider />
                                <div style={dialogStyles.productListTitle}>
                                    <ShoppingCart style={{ marginRight: '5px' }} />
                                    Sản phẩm
                                </div>
                                <List style={dialogStyles.productList}>
                                    {selectedOrderDetails.products && selectedOrderDetails.products.length > 0 ? (
                                        selectedOrderDetails.products.map((product) => (
                                            <ListItem key={product._id} style={dialogStyles.productListItem}>
                                                <ListItemText
                                                    primary={product.name}
                                                    secondary={`Số lượng: ${product.quantity} - Giá: ${formatCurrency(product.price)}`}
                                                />
                                            </ListItem>
                                        ))
                                    ) : (
                                        <div style={dialogStyles.errorText}>Không có sản phẩm nào trong đơn hàng này.</div>
                                    )}
                                </List>
                            </Box>
                        ) : (
                            <div style={dialogStyles.loadingContainer}>
                                <CircularProgress />
                                <span style={dialogStyles.loadingText}>Đang tải thông tin...</span>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions style={dialogStyles.dialogActions}>
                        <button onClick={() => setSelectedOrderDetails(null)} style={dialogStyles.closeButton}>
                            Đóng
                        </button>
                    </DialogActions>
                </Dialog>

            </Box>
        </Container>
    );
};

export default Reports;