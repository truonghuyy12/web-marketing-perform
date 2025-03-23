import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography, Box,
  Grid, Divider, CircularProgress, Alert, IconButton,
  Card, CardMedia, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
// import { toast } from 'react-hot-toast';
import { toast } from 'react-toastify'; 

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const categories = [
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Product', label: 'Sản phẩm' },
  { value: 'Technology', label: 'Thời đại công nghệ' },
  { value: 'Performance', label: 'Tính Năng Hiệu Suất' }
];

const UpdatePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [post, setPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other',
    image: null
  });
  const [preview, setPreview] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/posts/${id}`);
        if (response.data.success) {
          const postData = response.data.post;
          setFormData({
            title: postData.title || '',
            content: postData.content || '',
            category: postData.category || 'other',
            image: postData.image || null
          });
          setPreview(postData.image);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        toast.error(err.response?.data?.message || 'Error fetching post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, image: base64String }));
        setPreview(base64String);
      };
      reader.onerror = () => {
        toast.error('Lỗi khi đọc file');
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const resetImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setPreview(post?.image || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.title || !formData.content || !formData.category) {
        toast.error('Vui lòng điền đầy đủ thông tin bài viết');
        return;
      }

      const updateData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        image: formData.image
      };

      const response = await axios.put(`/posts/update/${id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Cập nhật bài viết thành công');
        navigate('/dashboard/blog-manager');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật bài viết');
    } finally {
      setLoading(false);
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <IconButton
            onClick={() => navigate('/dashboard/blog-manager')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight="600">
            Chỉnh sửa bài viết
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <TextField
                name="title"
                label="Tiêu đề"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                sx={{ mb: 3 }}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />

              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="500">
                  Nội dung
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  placeholder="Write something..."
                  className="h-72 mb-12"
                  required
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, content: value }));
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3, borderRadius: 2 }}>
                <Box p={2}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="500">
                    Thông tin bài viết
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      label="Danh mục"
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      p: 2,
                      mb: 2,
                      textAlign: 'center'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mb: 1 }}
                      >
                        Chọn ảnh
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Kích thước tối đa: 2MB
                    </Typography>
                  </Box>

                  {preview ? (
                    <Box position="relative">
                      <CardMedia
                        component="img"
                        image={preview}
                        alt="Preview"
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 2
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={resetImage}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 60, color: '#ccc' }} />
                    </Box>
                  )}
                </Box>
              </Card>

              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/dashboard/blog-manager')}
                  startIcon={<ArrowBackIcon />}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<SaveIcon />}
                >
                  Lưu
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UpdatePost;
