import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  InputAdornment,
  Alert,
  IconButton,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;
  const baseUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  // Separate states for add and edit dialogs
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Separate form data for add and edit
  const [addFormData, setAddFormData] = useState({
    name: '',
    importPrice: '',
    retailPrice: '',
    category: '',
    quantity: '',
    description: '',
    images: []
  });

  const [editFormData, setEditFormData] = useState({
    barcode: '',
    name: '',
    importPrice: '',
    retailPrice: '',
    category: '',
    quantity: '',
    description: '',
    images: []
  });

  const [categories, setCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  // Thêm state cho dialog chi tiết
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Add search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // Add sorting states
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const checkAdminRole = () => {
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          setIsAdmin(decodedToken.role === 'Admin');
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    };

    checkAdminRole();
    fetchProducts();
    fetchCategories();
  }, [page, debouncedSearchQuery, selectedCategory, sortField, sortOrder]);

  const fetchProducts = async () => {
    try {
      let url = baseUrl + `/products?page=${page}&limit=${itemsPerPage}`;

      if (debouncedSearchQuery) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      }

      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }

      // Add sorting parameters
      url += `&sortField=${sortField}&sortOrder=${sortOrder}`;

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
      if (error.response?.status === 401 || error.response?.status === 403) {
        window.location.href = '/login';
        return;
      }
      setError(error.response?.data?.message || 'Error loading products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(baseUrl + '/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setFormError('Không thể tải danh mục sản phẩm');
    }
  };

  // Handle Add Dialog
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    setFormError('');
    setFormSuccess('');
    setPreviewImages([]);
    setAddFormData({
      name: '',
      importPrice: '',
      retailPrice: '',
      category: '',
      quantity: '',
      description: '',
      images: []
    });
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setFormError('');
    setFormSuccess('');
    setPreviewImages([]);
  };

  // Handle Edit Dialog
  const handleOpenEditDialog = (product) => {
    setOpenEditDialog(true);
    setFormError('');
    setFormSuccess('');
    setSelectedProduct(product);

    // Set form data with existing product information
    setEditFormData({
      barcode: product.barcode,
      name: product.name,
      importPrice: product.importPrice?.toString() || '',
      retailPrice: product.retailPrice?.toString() || '',
      category: product.category?._id || '',
      quantity: product.quantity?.toString() || '',
      description: product.description || '',
      images: product.images || []
    });

    // Set preview images if product has images
    if (product.images && product.images.length > 0) {
      const previews = product.images.map(image => image.data);
      setPreviewImages(previews);
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setFormError('');
    setFormSuccess('');
    setPreviewImages([]);
    setSelectedProduct(null);
  };

  // Handle form input changes
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image changes
  const handleAddImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      setFormError('Chỉ được chọn tối đa 4 ảnh');
      return;
    }

    // Create preview URLs for display
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);

    // Convert files to base64
    const processFiles = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          resolve({
            data: base64String,
            contentType: file.type
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(processFiles)
      .then(images => {
        setAddFormData(prev => ({
          ...prev,
          images: images
        }));
      })
      .catch(error => {
        console.error('Error processing images:', error);
        setFormError('Có lỗi xảy ra khi xử lý ảnh');
      });
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      setFormError('Chỉ được chọn tối đa 4 ảnh');
      return;
    }

    // Create preview URLs for display
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);

    // Convert files to base64
    const processFiles = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          resolve({
            data: base64String,
            contentType: file.type
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(processFiles)
      .then(images => {
        setEditFormData(prev => ({
          ...prev,
          images: images
        }));
      })
      .catch(error => {
        console.error('Error processing images:', error);
        setFormError('Có lỗi xảy ra khi xử lý ảnh');
      });
  };

  // Handle form submissions
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const dataToSend = {
        name: addFormData.name,
        importPrice: addFormData.importPrice,
        retailPrice: addFormData.retailPrice,
        category: addFormData.category,
        quantity: addFormData.quantity,
        description: addFormData.description,
        images: addFormData.images
      };

      const response = await axios.post(
        baseUrl + '/products/create',
        dataToSend,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setFormSuccess('Thêm sản phẩm thành công!');
        toast.success('Thêm sản phẩm thành công!');
        fetchProducts();
        setTimeout(() => {
          handleCloseAddDialog();
        }, 1500);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const dataToSend = {
        name: editFormData.name,
        importPrice: editFormData.importPrice,
        retailPrice: editFormData.retailPrice,
        category: editFormData.category,
        quantity: editFormData.quantity,
        description: editFormData.description
      };

      // Only include images if they were changed
      if (editFormData.images && editFormData.images.length > 0) {
        dataToSend.images = editFormData.images;
      }

      const response = await axios.put(
        baseUrl + `/products/update/${editFormData.barcode}`,
        dataToSend,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setFormSuccess('Cập nhật sản phẩm thành công!');
        toast.success('Cập nhật sản phẩm thành công!');

        fetchProducts();
        setTimeout(() => {
          handleCloseEditDialog();
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
    } finally {
      setFormLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await axios.delete(
          baseUrl + `/products/delete/${product.barcode}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        if (response.data.success) {
          fetchProducts(); // Refresh list after delete
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm');
      }
    }
  };

  // Thêm handlers cho dialog chi tiết
  const handleOpenDetailsDialog = (product) => {
    setSelectedProductDetails(product);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedProductDetails(null);
  };

  // Add handler for search input
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Add handler for category filter
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1); // Reset to first page when filtering
  };

  // Add handler for sorting
  const handleSortChange = (event) => {
    const value = event.target.value;
    if (value === 'nameAsc') {
      setSortField('name');
      setSortOrder('asc');
    } else if (value === 'nameDesc') {
      setSortField('name');
      setSortOrder('desc');
    } else if (value === 'priceAsc') {
      setSortField('retailPrice');
      setSortOrder('asc');
    } else if (value === 'priceDesc') {
      setSortField('retailPrice');
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  // Add search debounce hook
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

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: { xs: '1.75rem', sm: '2rem' }
          }}
        >
          Quản lý sản phẩm
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Thêm sản phẩm
        </Button>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Tìm kiếm sản phẩm"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ maxWidth: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Loại sản phẩm</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="Loại sản phẩm"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select
            value={`${sortField}${sortOrder === 'asc' ? 'Asc' : 'Desc'}`}
            onChange={handleSortChange}
            label="Sắp xếp"
          >
            <MenuItem value="nameAsc">Tên A-Z</MenuItem>
            <MenuItem value="nameDesc">Tên Z-A</MenuItem>
            <MenuItem value="priceAsc">Giá thấp đến cao</MenuItem>
            <MenuItem value="priceDesc">Giá cao đến thấp</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {Array.isArray(products) && products.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.3s ease',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                '& .product-actions': {
                  opacity: 1,
                }
              }
            }}>
              {/* Badge cho trạng thái sản phẩm */}
              {product.quantity <= 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: -28,
                    transform: 'rotate(-45deg)',
                    backgroundColor: 'error.main',
                    color: 'white',
                    padding: '4px 32px',
                    zIndex: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  Hết hàng
                </Box>
              )}

              {/* Action buttons */}
              <Box
                className="product-actions"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: 1,
                  zIndex: 1,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleOpenEditDialog(product)}
                  sx={{
                    bgcolor: 'white',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                    boxShadow: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteProduct(product)}
                  sx={{
                    bgcolor: 'white',
                    '&:hover': {
                      bgcolor: 'error.main',
                      color: 'white',
                      transform: 'scale(1.1)',
                    },
                    boxShadow: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Product Image */}
              <Box sx={{ position: 'relative', pt: '100%', bgcolor: '#f5f5f5' }}>
                <CardMedia
                  component="img"
                  height="100%"
                  image={product.images && product.images.length > 0
                    ? product.images[0].data
                    : 'placeholder-image-url'}
                  alt={product.name}
                  sx={{
                    objectFit: 'contain',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
              </Box>

              {/* Product Info */}
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="h2"
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '54px',
                    mb: 1,
                    color: 'text.primary'
                  }}
                >
                  {product.name}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 0.5
                    }}
                  >
                    Mã SP: {product.barcode}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 0.5
                    }}
                  >
                    Danh mục: {product.category?.name || 'Chưa phân loại'}
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1
                  }}>
                    <Box sx={{
                      px: 1,
                      py: 0.5,
                      bgcolor: product.quantity > 0 ? 'success.soft' : 'error.soft',
                      borderRadius: 1,
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}>
                      <Typography
                        variant="body2"
                        color={product.quantity > 0 ? 'success.main' : 'error.main'}
                      >
                        {product.quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {product.quantity} sản phẩm
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  mt: 'auto'
                }}>
                  <Typography
                    variant="h6"
                    color="primary.main"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.25rem'
                    }}
                  >
                    {formatPrice(product.price)}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleOpenDetailsDialog(product)}
                    sx={{
                      minWidth: '100px',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    Chi tiết
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{
        mt: 4,
        display: 'flex',
        justifyContent: 'center',
        pb: 4
      }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
        />
      </Box>

      {/* Add Product Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Thêm sản phẩm mới</Typography>
            <IconButton onClick={handleCloseAddDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {formSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleAddSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên sản phẩm"
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá nhập"
                  name="importPrice"
                  type="number"
                  value={addFormData.importPrice}
                  onChange={handleAddInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá bán"
                  name="retailPrice"
                  type="number"
                  value={addFormData.retailPrice}
                  onChange={handleAddInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    name="category"
                    value={addFormData.category}
                    onChange={handleAddInputChange}
                    label="Danh mục"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số lượng"
                  name="quantity"
                  type="number"
                  value={addFormData.quantity}
                  onChange={handleAddInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả sản phẩm"
                  name="description"
                  value={addFormData.description}
                  onChange={handleAddInputChange}
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="add-image-upload"
                    multiple
                    type="file"
                    onChange={handleAddImageChange}
                  />
                  <label htmlFor="add-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                    >
                      Chọn ảnh sản phẩm
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Tối đa 4 ảnh
                  </Typography>
                </Box>
              </Grid>

              {previewImages.length > 0 && (
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    {previewImages.map((preview, index) => (
                      <Grid item xs={3} key={index}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog} disabled={formLoading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={formLoading}
          >
            {formLoading ? 'Đang xử lý...' : 'Thêm sản phẩm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Cập nhật sản phẩm</Typography>
            <IconButton onClick={handleCloseEditDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {formSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleEditSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên sản phẩm"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá nhập"
                  name="importPrice"
                  type="number"
                  value={editFormData.importPrice}
                  onChange={handleEditInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá bán"
                  name="retailPrice"
                  type="number"
                  value={editFormData.retailPrice}
                  onChange={handleEditInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditInputChange}
                    label="Danh mục"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số lượng"
                  name="quantity"
                  type="number"
                  value={editFormData.quantity}
                  onChange={handleEditInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả sản phẩm"
                  name="description"
                  value={editFormData.description}
                  onChange={handleAddInputChange}
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="add-image-upload"
                    multiple
                    type="file"
                    onChange={handleAddImageChange}
                  />
                  <label htmlFor="add-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                    >
                      Chọn ảnh sản phẩm
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Tối đa 4 ảnh
                  </Typography>
                </Box>
              </Grid>

              {previewImages.length > 0 && (
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    {previewImages.map((preview, index) => (
                      <Grid item xs={3} key={index}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog} disabled={formLoading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={formLoading}
          >
            {formLoading ? 'Đang xử lý...' : 'Thêm sản phẩm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Cập nhật sản phẩm</Typography>
            <IconButton onClick={handleCloseEditDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {formSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleEditSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên sản phẩm"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá nhập"
                  name="importPrice"
                  type="number"
                  value={editFormData.importPrice}
                  onChange={handleEditInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá bán"
                  name="retailPrice"
                  type="number"
                  value={editFormData.retailPrice}
                  onChange={handleEditInputChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditInputChange}
                    label="Danh mục"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số lượng"
                  name="quantity"
                  type="number"
                  value={editFormData.quantity}
                  onChange={handleEditInputChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả sản phẩm"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  multiline
                  rows={4}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="edit-image-upload"
                    multiple
                    type="file"
                    onChange={handleEditImageChange}
                  />
                  <label htmlFor="edit-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                    >
                      Chọn ảnh sản phẩm
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Tối đa 4 ảnh
                  </Typography>
                </Box>
              </Grid>

              {previewImages.length > 0 && (
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    {previewImages.map((preview, index) => (
                      <Grid item xs={3} key={index}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={formLoading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={formLoading}
          >
            {formLoading ? 'Đang xử lý...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedProductDetails && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Chi tiết sản phẩm
                </Typography>
                <IconButton onClick={handleCloseDetailsDialog}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Ảnh sản phẩm */}
                <Grid item xs={12}>
                  <Box sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 2
                  }}>
                    {selectedProductDetails.images.map((image, index) => (
                      <Box
                        key={index}
                        sx={{
                          minWidth: 300,
                          height: 300,
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          flex: '0 0 auto'
                        }}
                      >
                        <img
                          src={image.data}
                          alt={`${selectedProductDetails.name} - ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#f5f5f5',
                            padding: '16px'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300';
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Grid>

                {/* Thông tin sản phẩm */}
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {selectedProductDetails.name}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 120 }}>
                        Mã sản phẩm:
                      </Typography>
                      <Typography variant="body1">
                        {selectedProductDetails.barcode}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 120 }}>
                        Giá bán:
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                        {formatPrice(selectedProductDetails.price)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 120 }}>
                        Danh mục:
                      </Typography>
                      <Typography variant="body1">
                        {selectedProductDetails.category?.name || 'Chưa phân loại'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 120 }}>
                        Tình trạng:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          px: 1,
                          py: 0.5,
                          bgcolor: selectedProductDetails.quantity > 0 ? 'success.soft' : 'error.soft',
                          borderRadius: 1,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          <Typography
                            variant="body2"
                            color={selectedProductDetails.quantity > 0 ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 600 }}
                          >
                            {selectedProductDetails.quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                          </Typography>
                        </Box>
                        <Typography variant="body1">
                          ({selectedProductDetails.quantity} sản phẩm)
                        </Typography>
                      </Box>
                    </Box>

                    {selectedProductDetails.description && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          Mô tả sản phẩm:
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            bgcolor: 'grey.50',
                            p: 2,
                            borderRadius: 1
                          }}
                        >
                          {selectedProductDetails.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDetailsDialog}>
                Đóng
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleCloseDetailsDialog();
                  handleOpenEditDialog(selectedProductDetails);
                }}
              >
                Chỉnh sửa
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Products;