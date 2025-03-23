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
  CircularProgress,
  Autocomplete,
  IconButton,
  Avatar
} from '@mui/material';
import { ShoppingCart, Search, Print, Delete } from '@mui/icons-material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
// import toast from 'react-hot-toast';
import { toast } from 'react-toastify'; 

import { useNavigate } from 'react-router-dom';

const Transactions = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [employees, setEmployees] = useState([]);
  const baseUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProducts();
    fetchEmployees();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(baseUrl + '/products?limit=0', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error('Không thể tải danh sách sản phẩm!');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi tải sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(baseUrl + '/employees',
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('Employee response:', response.data);
      const employeesList = response.data.employees || [];
      setEmployees(employeesList);
      if (employeesList.length > 0) {
        setEmployeeInfo(employeesList[0]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Không thể tải danh sách nhân viên');
    }
  };

  const handleEmployeeChange = (event, newValue) => {
    if (newValue) {
      setEmployeeInfo(newValue);
    }
  };

  useEffect(() => {
    const total = cart.reduce((sum, item) => {
      const price = item.price || item.retailPrice || 0;
      return sum + (price * item.quantity);
    }, 0);
    setTotalAmount(total);
  }, [cart]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const handleCheckout = async () => {
    try {
      if (cart.length === 0) {
        toast.error('Giỏ hàng trống!');
        return;
      }

      if (!customerPhone) {
        toast.error('Vui lòng nhập số điện thoại khách hàng!');
        return;
      }

      if (isNewCustomer && (!customerName || !customerAddress)) {
        toast.error('Vui lòng nhập đầy đủ thông tin khách hàng mới!');
        return;
      }

      if (!amountPaid || parseFloat(amountPaid) < totalAmount) {
        toast.error('Số tiền khách đưa không được nhỏ hơn tổng tiền đơn hàng!');
        return;
      }

      const response = await axios.post(
        baseUrl + '/transactions/checkOut',
        {
          customerPhone,
          customerName: isNewCustomer ? customerName : undefined,
          customerAddress: isNewCustomer ? customerAddress : undefined,
          products: cart.map(item => ({
            product_id: item._id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price || item.retailPrice
          })),
          amountPaid: parseFloat(amountPaid),
          employee_id: employeeInfo._id,
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Thanh toán thành công!');
        setCart([]);
        setCustomerPhone('');
        setCustomerName('');
        setCustomerAddress('');
        setAmountPaid('');
        setTotalAmount(0);
        setIsNewCustomer(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi thanh toán!');
    }
  };

  const handleSaveEmployee = () => {
    if (!employeeInfo) {
      alert('Vui lòng chọn nhân viên trước khi lưu hóa đơn.');
      return;
    }
    // Logic to save employee data
    console.log('Employee saved:', employeeInfo);
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '0';
    return price.toLocaleString('vi-VN');
  };

  const searchCustomer = async () => {
    if (!customerPhone) {
      toast.error('Vui lòng nhập số điện thoại khách hàng!');
      return;
    }

    setIsSearching(true);
    try {

      const response = await axios.get(baseUrl + `/transactions/searchCustomer?phone=${customerPhone}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.data) {
        setCustomerName(response.data.data.name);
        setCustomerAddress(response.data.data.address);
        setIsNewCustomer(false);
        toast.success('Đã tìm thấy thông tin khách hàng!');
      } else {
        setIsNewCustomer(true);
        setCustomerName('');
        setCustomerAddress('');
        toast.info('Khách hàng mới, vui lòng nhập thông tin!');
      }
    } catch (error) {
      console.error('Customer search error:', error);
      setIsNewCustomer(true);
      setCustomerName('');
      setCustomerAddress('');
      toast.error('Không tìm thấy khách hàng, vui lòng nhập thông tin mới!');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Employee Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chọn nhân viên bán hàng
            </Typography>
            <Autocomplete
              options={employees || []}
              getOptionLabel={(option) => option ? `${option.fullname} ` : ''}
              value={employeeInfo}
              onChange={handleEmployeeChange}
              isOptionEqualToValue={(option, value) => option?._id === value?._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nhân viên"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}
                  sx={{
                    pointerEvents: option.status === "Active" ? 'auto' : 'none',
                    opacity: option.status === "Active" ? 1 : 0.5,
                    cursor: option.status === "Active" ? 'pointer' : 'not-allowed',
                  }}
                  aria-disabled={!(option.status === "Active")}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#2196F3',
                        fontSize: '1rem',
                        mr: 2,
                      }}
                    >
                      {option?.fullname?.charAt(0) || ''}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{option?.fullname || ''}</Typography>
                      <Typography variant="body2" color="text.secondary">
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>

        {/* Show employee info only if selected */}
        {employeeInfo && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f8faff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    backgroundColor: '#2196F3',
                    fontSize: '1.5rem',
                  }}
                >
                  {employeeInfo?.fullname?.charAt(0) || ''}
                </Avatar>
                <Box>
                  <Typography variant="h6">{employeeInfo?.fullname || ''}</Typography>
                  <Typography variant="body2" color="text.secondary">

                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {employeeInfo?.email || ''}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Product Search */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tìm kiếm sản phẩm
            </Typography>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => `${option.name} - ${option.barcode}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tìm sản phẩm"
                  variant="outlined"
                  fullWidth
                  error={!!error}
                  helperText={error}
                />
              )}
              onChange={(event, newValue) => {
                if (newValue) {
                  const existingProduct = cart.find(item => item._id === newValue._id);
                  if (existingProduct) {
                    toast.error('Sản phẩm đã có trong giỏ hàng!');
                    return;
                  }
                  setCart([...cart, {
                    ...newValue,
                    quantity: 1,
                    price: newValue.price || newValue.retailPrice
                  }]);
                }
              }}
              loading={loading}
              loadingText="Đang tải..."
              noOptionsText="Không tìm thấy sản phẩm"
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{
                  pointerEvents: option.quantity <= 0 ? 'none' : 'auto',
                  opacity: option.quantity <= 0 ? 0.5 : 1,
                  cursor: option.quantity <= 0 ? 'not-allowed' : 'pointer',
                }}
                  aria-disabled={option.quantity <= 0}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item>
                      {option.images && option.images[0] && (
                        <img
                          src={option.images[0].data}
                          alt={option.name}
                          style={{ width: 50, height: 50, objectFit: 'cover' }}
                        />
                      )}
                    </Grid>
                    <Grid item xs>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Mã: {option.barcode} - Giá: {formatPrice(option.price || option.retailPrice)}đ
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" color={option.quantity > 0 ? 'success.main' : 'error.main'}>
                        {option.quantity > 0 ? `Còn ${option.quantity}` : 'Hết hàng'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            />
          </Paper>
        </Grid>

        {/* Shopping Cart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Giỏ hàng
            </Typography>
            {cart.length === 0 ? (
              <Typography>Chưa có sản phẩm trong giỏ hàng</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hình ảnh</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          {item.images && item.images[0] && (
                            <img
                              src={item.images[0].data}
                              alt={item.name}
                              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">
                          {formatPrice(item.price || item.retailPrice)}đ
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value))}
                            InputProps={{ inputProps: { min: 1 } }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice((item.price || item.retailPrice) * item.quantity)}đ
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleRemoveFromCart(item._id)} color="error">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <strong>Tổng cộng:</strong>
                      </TableCell>
                      <TableCell align="right" colSpan={2}>
                        <strong>{formatPrice(totalAmount)}đ</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Customer Info and Payment */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin khách hàng
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={searchCustomer}
                disabled={isSearching}
                sx={{ minWidth: '100px' }}
              >
                {isSearching ? <CircularProgress size={24} /> : 'Tìm'}
              </Button>
            </Box>

            {isNewCustomer && (
              <Typography color="primary" gutterBottom>
                Khách hàng mới
              </Typography>
            )}

            <TextField
              fullWidth
              label="Tên khách hàng"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              margin="normal"
              required={isNewCustomer}
              disabled={!isNewCustomer && customerName}
            />
            <TextField
              fullWidth
              label="Địa chỉ"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              margin="normal"
              required={isNewCustomer}
              disabled={!isNewCustomer && customerAddress}
            />
            <TextField
              fullWidth
              label="Số tiền khách đưa"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              margin="normal"
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
            {amountPaid && (
              <Typography variant="body1" gutterBottom>
                Tiền thối: {formatPrice(Math.max(0, parseFloat(amountPaid) - totalAmount))}đ
              </Typography>
            )}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleCheckout}
              disabled={cart.length === 0 || (isNewCustomer && (!customerName || !customerAddress))}
              sx={{ mt: 2 }}
            >
              Thanh toán
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Transactions;