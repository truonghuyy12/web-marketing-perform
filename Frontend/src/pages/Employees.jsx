import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Avatar,
  TextField,
  Link,
  Grid
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  ReceiptLong as ReceiptIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from '../utils/axios';
// import { toast } from 'react-hot-toast';
import { toast } from 'react-toastify'; 
const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: ''
  });
  const [salesInfoOpen, setSalesInfoOpen] = useState(false);
  const [salesData, setSalesData] = useState({
    employeeInfo: {
      id: '',
      email: '',
      fullname: ''
    },
    salesStats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0
    },
    orders: []
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchEmployees();
    fetchCurrentUser();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(response.data.employees);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi tải danh sách nhân viên:', error);
      toast.error('Không thể tải danh sách nhân viên');
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(
        '/auth/profile',
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      setCurrentUser(response.data.data);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/employees/create',
        formData);

      if (response.data.success) {
        toast.success('Tạo tài khoản nhân viên thành công');
        setOpenAddDialog(false);
        setFormData({ fullname: '', email: '' });
        fetchEmployees(); // Tải lại danh sách nhân viên
      }
    } catch (error) {
      console.error('Lỗi khi tạo nhân viên:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo tài khoản nhân viên');
    }
  };

  const handleResendEmail = async (employeeId) => {
    try {
      const response = await axios.post(
        `/employees/resend/${employeeId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      if (response.data.success) {
        toast.success('Đã gửi lại email kích hoạt!');
      }
    } catch (error) {
      console.error('Lỗi khi gửi lại email:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi lại email');
    }
  };

  const handleToggleLock = async (employee) => {
    try {
      const response = await axios.post(
        `/employees/toggleLock/${employee._id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      if (response.data.success) {
        toast.success(
          employee.status === 'Locked'
            ? 'Đã mở khóa tài khoản nhân viên'
            : 'Đã khóa tài khoản nhân viên'
        );
        fetchEmployees(); // Tải lại danh sách nhân viên
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái khóa:', error);
      toast.error('Không thể thay đổi trạng thái khóa tài khoản');
    }
  };

  const handleViewDetails = async (employee) => {
    try {
      const response = await axios.get(
        `/employees/${employee._id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      if (response.data.success) {
        setSelectedEmployee(response.data.employee);
        setDetailsOpen(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin nhân viên:', error);
      toast.error('Không thể tải thông tin nhân viên');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewSalesInfo = async (employee) => {
    try {
      const response = await axios.get(
        `/employees/salesInfo/${employee._id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      if (response.data.success) {
        setSalesData({
          employeeInfo: response.data.employeeInfo || {
            id: '',
            email: '',
            fullname: ''
          },
          salesStats: {
            totalOrders: response.data.totalOrders || 0,
            totalRevenue: response.data.totalRevenue || 0,
            totalProducts: response.data.totalProductsSold || 0
          },
          orders: response.data.orderDetails || []
        });
        setSalesInfoOpen(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin doanh số:', error);
      toast.error('Không thể tải thông tin doanh số');
    }
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(
        `/employees/delete/${employeeToDelete._id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      toast.success('Đã xóa nhân viên thành công');

      // Cập nhật danh sách nhân viên
      setEmployees(employees.filter(emp => emp._id !== employeeToDelete._id));

      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Lỗi khi xóa nhân viên:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa nhân viên');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{
        mt: 4,
        mb: 4,
        backgroundColor: 'white',
        borderRadius: 2,
        boxShadow: 3,
        p: 3
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            Danh sách nhân viên
          </Typography>
          {currentUser?.role === 'Admin' && (
            <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
            onClick={() => setOpenAddDialog(true)}
          >
            Thêm nhân viên
          </Button>
          </>)}
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            boxShadow: 2,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Avatar</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Họ Tên</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày tạo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(employees) && employees.map((employee, index) => (
                <TableRow
                  key={employee._id || index}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Avatar
                      src={employee.avatar ? `data:image/jpeg;base64,${employee.avatar}` : ''}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main',
                        fontSize: '1rem',
                        objectFit: 'cover'
                      }}
                    >
                      {!employee.avatar && employee.fullname?.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{employee.fullname}</TableCell>
                  <TableCell>{formatDate(employee.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status}
                      color={employee.status === 'Active' ? 'success' :
                        employee.status === 'Locked' ? 'error' : 'warning'}
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          onClick={() => handleViewDetails(employee)}
                          size="small"
                          sx={{
                            '&:hover': {
                              transform: 'scale(1.1)',
                              transition: 'transform 0.2s'
                            }
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {currentUser?.role === 'Admin' && (
                        <>
                          <Tooltip title={employee.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}>
                            <IconButton
                              onClick={() => handleToggleLock(employee)}
                              color={employee.status === 'Active' ? 'error' : 'success'}
                              size="small"
                              sx={{
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s'
                                }
                              }}
                            >
                              {employee.status === 'Active' ? <LockIcon /> : <LockOpenIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gửi lại email">
                            <IconButton
                              onClick={() => handleResendEmail(employee._id)}
                              color="primary"
                              size="small"
                              sx={{
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s'
                                }
                              }}
                            >
                              <EmailIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa nhân viên">
                            <IconButton
                              onClick={() => handleDeleteClick(employee)}
                              color="error"
                              size="small"
                              sx={{
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                      <Tooltip title="Thông tin bán hàng">
                        <IconButton
                          onClick={() => handleViewSalesInfo(employee)}
                          color="info"
                          size="small"
                          sx={{
                            '&:hover': {
                              transform: 'scale(1.1)',
                              transition: 'transform 0.2s'
                            }
                          }}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          px: 3,
          py: 2
        }}>
          Thêm nhân viên mới
        </DialogTitle>
        <form onSubmit={handleCreateEmployee}>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minWidth: 400
            }}>
              <TextField
                fullWidth
                label="Họ và tên"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                required
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{ mt: 1 }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Button
              onClick={() => setOpenAddDialog(false)}
              sx={{
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Thêm
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Chi tiết nhân viên
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={selectedEmployee.avatar ? `data:image/jpeg;base64,${selectedEmployee.avatar}` : ''}
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    objectFit: 'cover'
                  }}
                >
                  {!selectedEmployee.avatar && selectedEmployee.fullname?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedEmployee.fullname}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentUser?.role === 'Admin' && !selectedEmployee.isActivated && (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleResendEmail(selectedEmployee._id)}
                        startIcon={<EmailIcon />}
                      >
                        Gửi lại email
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Trạng thái
                  </Typography>
                  <Chip
                    label={selectedEmployee.status}
                    color={
                      selectedEmployee.status === 'Active'
                        ? 'success'
                        : selectedEmployee.status === 'Inactive'
                          ? 'warning'
                          : 'error'
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Số điện thoại
                  </Typography>
                  <Typography variant="body1">
                    {selectedEmployee.phone || '(Chưa cập nhật)'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Ngày sinh
                  </Typography>
                  <Typography variant="body1">
                    {selectedEmployee.birthday || '(Chưa cập nhật)'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Tiểu sử
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      minHeight: '100px'
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedEmployee.bio || '(Chưa cập nhật)'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedEmployee.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Lần cập nhật cuối
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedEmployee.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={salesInfoOpen}
        onClose={() => setSalesInfoOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Thông tin bán hàng - {salesData.employeeInfo?.fullname}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thống kê
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {salesData.salesStats?.totalOrders || 0}
                  </Typography>
                  <Typography variant="subtitle2">Tổng đơn hàng</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {formatCurrency(salesData.salesStats?.totalRevenue || 0)}
                  </Typography>
                  <Typography variant="subtitle2">Tổng doanh thu</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {salesData.salesStats?.totalProducts || 0}
                  </Typography>
                  <Typography variant="subtitle2">Tổng sản phẩm đã bán</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h6" gutterBottom>
            Chi tiết đơn hàng
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã đơn hàng</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="right">Số lượng SP</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(salesData.orders || []).map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell align="right">{order.totalProducts}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(order.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
                {(salesData.orders || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Chưa có đơn hàng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalesInfoOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Xác nhận xóa nhân viên</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa nhân viên {employeeToDelete?.fullname}?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Employees;