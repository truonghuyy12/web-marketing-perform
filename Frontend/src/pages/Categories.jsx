import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify'; 
const Categories = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const baseUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(baseUrl + '/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditMode(true);
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditMode(false);
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: ''
    });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let response;
      if (editMode) {
        response = await axios.put(
          baseUrl + `/categories/update/${selectedCategory._id}`,
          formData,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else {
        response = await axios.post(
          baseUrl + '/categories/create',
          formData,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
      }

      if (response.data.success) {
        toast.success(editMode ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
        fetchCategories();
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        const response = await axios.delete(
          baseUrl + `/categories/delete/${categoryId}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        if (response.data.success) {
          fetchCategories();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa danh mục');
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Đang tải danh mục...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            <CategoryIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '1.75rem', sm: '2rem' },
                mb: 0.5
              }}
            >
              Danh mục sản phẩm
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý tất cả danh mục trong hệ thống
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            px: 3,
            py: 1.2,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Thêm danh mục
        </Button>
      </Box>

      {/* Categories Grid */}
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  '& .category-actions': {
                    opacity: 1,
                    transform: 'translateX(0)'
                  }
                }
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 60%)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InventoryIcon sx={{ fontSize: 24 }} />
                  <Typography variant="h6" sx={{
                    flexGrow: 1,
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {category.name}
                  </Typography>
                  <Box
                    className="category-actions"
                    sx={{
                      display: 'flex',
                      gap: 1,
                      opacity: 0,
                      transform: 'translateX(10px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Tooltip title="Chỉnh sửa" arrow placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(category)}
                        sx={{
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa" arrow placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(category._id)}
                        sx={{
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,0,0,0.2)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <DescriptionIcon
                    color="primary"
                    sx={{
                      opacity: 0.7,
                      fontSize: 20,
                      mt: 0.5
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      flexGrow: 1,
                      lineHeight: 1.6,
                      fontWeight: 500
                    }}
                  >
                    {category.description || 'Chưa có mô tả'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {editMode ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </Typography>
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  transform: 'rotate(90deg)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider sx={{ opacity: 0.5 }} />

        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(211,47,47,0.1)'
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(46,125,50,0.1)'
              }}
            >
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Tên danh mục"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                }
              }}
            />

            <TextField
              fullWidth
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={editMode ? <EditIcon /> : <AddIcon />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {editMode ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Categories;
