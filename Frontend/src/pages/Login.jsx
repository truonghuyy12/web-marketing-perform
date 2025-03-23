import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Link
} from '@mui/material';
import axios from '../utils/axios';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
// import { toast } from 'react-hot-toast';
import { toast } from 'react-toastify'; 

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot', 'resend', 'reset'
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    username: '', // Thêm trường username
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const location = useLocation(); // Sử dụng useLocation để theo dõi thay đổi URL

  // Xử lý thông báo từ URL
  useEffect(() => {
    // Kiểm tra xem có thông báo thành công từ trang kích hoạt không
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const message = urlParams.get('message');

    if (success === 'true' && message) {
      toast.success(message);
    }
  }, []);

  useEffect(() => {
    // Kiểm tra token từ query params
    const urlParams = new URLSearchParams(location.search);
    const queryToken = urlParams.get('token');

    // Kiểm tra token từ đường dẫn (pathname)
    const pathToken = location.pathname.split('/').pop();

    const token = queryToken || pathToken;

    if (token && token !== 'login') {
      setResetToken(token); // Lưu token vào state
      setMode('reset');     // Chuyển sang chế độ reset
    } else {
      setMode('login');     // Trở về chế độ login nếu không có token
    }
  }, [location.search, location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Validate dữ liệu trước khi gửi request
    if (!formData.emailOrUsername || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/signIn', {
        emailOrUsername: formData.emailOrUsername,
        password: formData.password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Đăng nhập thành công!');

        // Kiểm tra role của người dùng để chuyển hướng
        const userRole = response.data.user.role;
        if (userRole === 'User') {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      const errorMessage = error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Validate dữ liệu
      if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      if (formData.username.includes(' ')) {
        setError('Tên đăng nhập không được chứa khoảng trắng');
        return;
      }

      const response = await axios.post('/auth/signUp', {
        email: formData.emailOrUsername, // email field
        username: formData.username,
        fullname: formData.fullname,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.');
        setMode('login');
        setFormData({
          emailOrUsername: '',
          password: '',
          confirmPassword: '',
          fullname: '',
          username: '',
        });
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      setError(error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký');
      toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/forgotPassword', { // Sử dụng endpoint chính xác
        email: formData.emailOrUsername,
      });

      if (response.data) {
        toast.success('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn!');
        setMode('login');
        setFormData({
          emailOrUsername: '', // Reset email field
          password: '',
          confirmPassword: '',
          fullname: '',
          username: '',
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (!formData.emailOrUsername) {
        setError('Vui lòng nhập email');
        return;
      }

      const response = await axios.post('/auth/resendActivation', {
        email: formData.emailOrUsername
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setMode('login');
        setFormData({
          emailOrUsername: '',
          password: '',
          confirmPassword: '',
          fullname: '',
          username: '',
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi lại link kích hoạt:', error);
      setError(error.response?.data?.message || 'Đã có lỗi xảy ra khi gửi lại link kích hoạt');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if we're on a reset password page with a token
      if (!resetToken) {
        toast.error('Không tìm thấy mã token đặt lại mật khẩu.');
        return;
      }

      // Validate password
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      if (formData.password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }

      const response = await axios.post('/auth/resetPassword', { // Sử dụng endpoint chính xác
        token: resetToken, // Gửi token
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        toast.success('Mật khẩu đã được đặt lại thành công');
        setMode('login');
        setFormData({
          emailOrUsername: '',
          password: '',
          confirmPassword: '',
          fullname: '',
          username: '',
        });
        // Optional: Redirect to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      const errorMessage = error.response?.data?.message || 'Không thể đặt lại mật khẩu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case 'signup':
        return (
          <Box component="form" onSubmit={handleSignUp} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="emailOrUsername"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.emailOrUsername}
              onChange={handleChange}
              error={!!error && error.includes('email')}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!error && error.includes('đăng nhập')}
              helperText="Tên đăng nhập phải là duy nhất và không chứa khoảng trắng"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="fullname"
              label="Họ và tên"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              error={!!error && error.includes('họ tên')}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              error={!!error && error.includes('mật khẩu')}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              // error={!!error && error.includes('xác nhận')}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#FF6363', '&:hover': { bgcolor: '#FF4444' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => navigate('/')}
                variant="text"
                sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
              >
                Quay lại trang chủ
              </Button>
            </Box>
          </Box>
        );

      case 'forgot':
        return (
          <Box component="form" onSubmit={handleForgotPassword} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="emailOrUsername"
              label="Email hoặc Username"
              name="emailOrUsername"
              autoComplete="email"
              autoFocus
              value={formData.emailOrUsername}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#FF6363', '&:hover': { bgcolor: '#FF4444' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Gửi yêu cầu'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => navigate('/')}
                variant="text"
                sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
              >
                Quay lại trang chủ
              </Button>
            </Box>
          </Box>
        );

      case 'resend':
        return (
          <Box component="form" onSubmit={handleResendActivation} sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Gửi lại link kích hoạt
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="emailOrUsername"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.emailOrUsername}
              onChange={handleChange}
              error={!!error}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#FF6363', '&:hover': { bgcolor: '#FF4444' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Gửi lại link kích hoạt'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => navigate('/')}
                variant="text"
                sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
              >
                Quay lại trang chủ
              </Button>
            </Box>
          </Box>
        );

      case 'reset':
        return (
          <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Đặt lại mật khẩu
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu mới"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              error={!!error}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!error}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: '#FF6363', '&:hover': { bgcolor: '#FF4444' } }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đặt lại mật khẩu'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => navigate('/')}
                variant="text"
                sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
              >
                Quay lại trang chủ
              </Button>
            </Box>
          </Box>
        );

      default: // login
        return (
          <Container component="main" maxWidth="xs">
            <Box
              sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography component="h1" variant="h5">
                Đăng nhập
              </Typography>
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                sx={{ mt: 1 }}
              >
                <TextField
                  fullWidth
                  label="Email hoặc Username"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  placeholder="Nhập email hoặc username của bạn"
                  error={!!error}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  name="password"
                  label="Mật khẩu"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!error}
                />
                {error && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
                </Button>
                <Grid container>
                  <Grid item xs>
                    <Button
                      sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
                      onClick={() => {
                        setMode('forgot');
                        setFormData({
                          emailOrUsername: '',
                          password: '',
                          confirmPassword: '',
                          fullname: '',
                          username: '',
                        });
                      }}
                    >
                      Quên mật khẩu?
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
                      onClick={() => {
                        setMode('signup');
                        setFormData({
                          emailOrUsername: '',
                          password: '',
                          confirmPassword: '',
                          fullname: '',
                          username: '',
                        });
                      }}
                    >
                      Đăng ký
                    </Button>
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
                      onClick={() => {
                        setMode('resend');
                        setFormData({
                          emailOrUsername: '',
                          password: '',
                          confirmPassword: '',
                          fullname: '',
                          username: '',
                        });
                      }}
                    >
                      Gửi lại link kích hoạt
                    </Button>
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      onClick={() => navigate('/')}
                      variant="text"
                      sx={{ textTransform: 'none', color: '#FF6363', fontWeight: 'bold' }}
                    >
                      Quay lại trang chủ
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Container>
        );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FCEEB5, #FFDEE9)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <Typography variant="h4" align="center" gutterBottom>
                Đặt Lại Mật Khẩu
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                type="password"
                label="Mật khẩu mới"
                name="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                type="password"
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Đặt Lại Mật Khẩu'}
              </Button>
            </form>
          )}
          {mode !== 'reset' && renderForm()}
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;