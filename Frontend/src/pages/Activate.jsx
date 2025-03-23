import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container, Paper, Button } from '@mui/material';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const Activate = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const response = await axios.get(`/auth/activateAccount/${token}`);
        
        if (response.data.success) {
          setActivated(true);
          toast.success(response.data.message);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error) {
        console.error('Lỗi khi kích hoạt tài khoản:', error);
        const errorMessage = error.response?.data?.message;
        setError(errorMessage || 'Đã có lỗi xảy ra khi kích hoạt tài khoản');
        
        // Nếu tài khoản đã kích hoạt trước đó
        if (error.response?.status === 400) {
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      activateAccount();
    }
  }, [token, navigate]);

  const handleResendActivation = () => {
    navigate('/login', { state: { openResendActivation: true } });
  };

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
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          {loading ? (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Đang kích hoạt tài khoản...</Typography>
            </>
          ) : error ? (
            <>
              <Typography color="error" variant="h6" sx={{ mb: 2 }}>
                {error}
              </Typography>
              {error.includes('đã được kích hoạt') ? (
                <Typography>
                  Đang chuyển hướng đến trang đăng nhập...
                </Typography>
              ) : (
                <>
                  <Typography sx={{ mb: 2 }}>
                    Link kích hoạt không hợp lệ hoặc đã hết hạn.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleResendActivation}
                    sx={{ bgcolor: '#FF6363', '&:hover': { bgcolor: '#FF4444' } }}
                  >
                    Yêu cầu gửi lại link kích hoạt
                  </Button>
                </>
              )}
            </>
          ) : activated ? (
            <>
              <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                Tài khoản đã được kích hoạt thành công!
              </Typography>
              <Typography>
                Đang chuyển hướng đến trang đăng nhập...
              </Typography>
            </>
          ) : null}
        </Paper>
      </Box>
    </Container>
  );
};

export default Activate;
