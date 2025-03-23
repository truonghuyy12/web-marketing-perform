import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert 
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token: routeToken } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');

  useEffect(() => {
    // Log đầy đủ thông tin để debug
    // console.log('Current URL:', window.location.href);
    // console.log('Current Pathname:', window.location.pathname);
    // console.log('Route Token:', routeToken);

    // Tách token từ pathname, ưu tiên loại bỏ tiền tố /api/auth/
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/');
    const pathToken = pathParts[pathParts.length - 1];
    const apiPathToken = pathParts.includes('api') 
      ? pathParts[pathParts.indexOf('api') + 2] 
      : pathToken;

    const finalToken = routeToken || apiPathToken || pathToken;
    
    console.log('Final Token:', finalToken);
    setToken(finalToken);
  }, [routeToken]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        setLoading(false);
        return;
    }

    if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
        setLoading(false);
        return;
    }

    try {
        // console.log("Gửi yêu cầu reset với token:", token);  // Log token
        // console.log("Mật khẩu mới:", password);
        
        const response = await axios.post(`/auth/resetPassword/${token}`, {
            newPassword: password,
            confirmPassword
        });

        if (response.data.success) {
            toast.success('Đặt lại mật khẩu thành công');
            navigate('/login');
        }

    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);  // Log lỗi từ backend
        setError(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
        toast.error(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
        setLoading(false);
    }
};

  return (
    <Container maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 3 
        }}
      >
        <Typography component="h1" variant="h5">
          Đặt Lại Mật Khẩu
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleResetPassword} 
          sx={{ mt: 1, width: '100%' }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu mới"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            sx={{ 
              mt: 3, 
              mb: 2, 
              bgcolor: '#FF6363', 
              '&:hover': { bgcolor: '#FF4444' } 
            }}
            disabled={loading}
          >
            Đặt Lại Mật Khẩu
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;