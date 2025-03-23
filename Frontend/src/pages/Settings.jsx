import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  AccountCircle,
  Security,
  PhotoCamera,
  Save,
  Cancel,
  Logout,
  CloudUpload
} from '@mui/icons-material';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userInfo, setUserInfo] = useState({
    email: '',
    username: '',
    fullname: '',
    role: '',
    avatar: null,
    phone: '',
    birthday: '',
    bio: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        '/auth/profile',
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

      if (response.data.success) {
        setUserInfo(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error);
      toast.error('Không thể tải thông tin người dùng');
      if (error.response?.status === 401) {
        localStorage.removeItem('token'); // Xóa token nếu hết hạn
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Lấy phần base64 string sau prefix "data:image/..."
        const base64String = reader.result.split(',')[1];
        setPreviewUrl(base64String);
        // Cập nhật preview ngay lập tức
        setUserInfo(prev => ({
          ...prev,
          avatar: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);

      // Nếu có file avatar mới, upload trước
      if (selectedFile) {
        const avatarData = {
          avatar: previewUrl
        };

        const avatarResponse = await axios.post(
          '/auth/uploadAvatar',
          avatarData,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        if (!avatarResponse.data.success) {
          // Nếu upload thất bại, reset lại avatar cũ
          setUserInfo(prev => ({
            ...prev,
            avatar: avatarResponse.data.data.avatar
          }));
          throw new Error(avatarResponse.data.message);
        }
      }

      // Sau đó cập nhật thông tin cá nhân
      const response = await axios.put(
        '/auth/profile',
        {
          fullname: userInfo.fullname,
          phone: userInfo.phone,
          birthday: userInfo.birthday,
          bio: userInfo.bio
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

      if (response.data.success) {
        // Cập nhật state với thông tin mới
        setUserInfo(prev => ({
          ...prev,
          ...response.data.data
        }));
        setSelectedFile(null);
        setPreviewUrl(null);
        toast.success('Cập nhật thông tin thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(userInfo.avatar);
    fetchUserInfo();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      toast.error('Không thể đăng xuất');
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    try {
      // Chuyển file thành base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result;

        if (!token) {
          navigate('/login');
          return;
        }

        // Set token cho request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Gửi request upload avatar
        const response = await axios.post(
          '/auth/uploadAvatar',
          { avatar: base64String },
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          toast.success('Cập nhật avatar thành công!');
          setUserInfo(prev => ({
            ...prev,
            avatar: response.data.data.avatar
          }));
        }
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi upload avatar');
    }
  };

  const getAvatarUrl = () => {
    if (!userInfo.avatar) return '/default-avatar.png';
    return `data:image/png;base64,${userInfo.avatar}`;
  };

  const handlePasswordChange = async () => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast.error('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Mật khẩu mới không khớp');
        return;
      }

      if (passwordData.newPassword === passwordData.currentPassword) {
        toast.error('Mật khẩu mới phải khác mật khẩu hiện tại');
        return;
      }

      setLoading(true);

      const response = await axios.put(
        '/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
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
        toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi đổi mật khẩu';
      toast.error(errorMessage);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  selected={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                >
                  <ListItemIcon>
                    <AccountCircle />
                  </ListItemIcon>
                  <ListItemText primary="Thông tin cá nhân" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={activeTab === 'security'}
                  onClick={() => setActiveTab('security')}
                >
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText primary="Bảo mật" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLogout}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon>
                    <Logout sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText primary="Đăng xuất" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            {activeTab === 'overview' ? (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        src={userInfo.avatar ? `data:image/jpeg;base64,${userInfo.avatar}` : ''}
                        sx={{
                          width: 120,
                          height: 120,
                          mb: 2,
                          bgcolor: 'primary.main',
                          fontSize: '3rem'
                        }}
                      >
                        {!userInfo.avatar && userInfo.fullname?.charAt(0)}
                      </Avatar>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="avatar-upload"
                        type="file"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="avatar-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<CloudUpload />}
                        >
                          Upload Avatar
                        </Button>
                      </label>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="E-mail"
                          name="email"
                          value={userInfo.email || ''}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Tên đăng nhập"
                          name="username"
                          value={userInfo.username || ''}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Họ và tên"
                          name="fullname"
                          value={userInfo.fullname || ''}
                          onChange={handleInputChange}
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Số điện thoại"
                          name="phone"
                          value={userInfo.phone || ''}
                          onChange={handleInputChange}
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Ngày sinh"
                          name="birthday"
                          type="date"
                          value={userInfo.birthday || ''}
                          onChange={handleInputChange}
                          variant="outlined"
                          margin="normal"
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Giới thiệu bản thân"
                          name="bio"
                          value={userInfo.bio || ''}
                          onChange={handleInputChange}
                          variant="outlined"
                          margin="normal"
                          multiline
                          rows={4}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Vai trò"
                          name="role"
                          value={userInfo.role || ''}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={() => fetchUserInfo()}
                          >
                            HỦY
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                          >
                            LƯU THAY ĐỔI
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Đổi mật khẩu
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Mật khẩu hiện tại"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Mật khẩu mới"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Xác nhận mật khẩu mới"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handlePasswordChange}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    >
                      Đổi mật khẩu
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;