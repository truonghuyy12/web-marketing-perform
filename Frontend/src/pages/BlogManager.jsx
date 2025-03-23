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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { toast } from 'react-hot-toast';

const BlogManager = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    image: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPosts(response.data.posts);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bài viết:', error);
      toast.error('Không thể tải danh sách bài viết');
      setLoading(false);
    }
  };

  const handleOpenDialog = (post = null) => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        category: post.category,
        image: post.image
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: '',
        image: ''
      });
    }
  };

  const handleCloseDialog = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      image: ''
    });
  };

  const handleViewDetails = (post) => {
    setSelectedPost(post);
    setDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialog(false);
    setSelectedPost(null);
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
    try {
      if (editPost) {
        // Cập nhật bài viết
        const response = await axios.put(
          `/posts/update/${editPost._id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.data.success) {
          setPosts(posts.map(p => p._id === editPost._id ? response.data.post : p));
          toast.success('Cập nhật bài viết thành công');
        }
      } else {
        // Tạo bài viết mới
        const response = await axios.post(
          '/posts/create',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.data.success) {
          setPosts([response.data.post, ...posts]);
          toast.success('Tạo bài viết thành công');
        }
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Lỗi khi lưu bài viết:', error);
      toast.error(error.response?.data?.message || 'Không thể lưu bài viết');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        const response = await axios.delete(
          `/posts/delete/${postId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.data.success) {
          setPosts(posts.filter(p => p._id !== postId));
          toast.success('Xóa bài viết thành công');
        }
      } catch (error) {
        console.error('Lỗi khi xóa bài viết:', error);
        toast.error('Không thể xóa bài viết');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Quản lý bài viết
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/create-post')}
          >
            Thêm bài viết
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Hình ảnh</TableCell>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((post, index) => (
                  <TableRow key={post._id}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      {post.image && (
                        <Box
                          component="img"
                          src={post.image}
                          alt={post.title}
                          sx={{
                            width: 100,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                          onClick={() => window.open(post.image, '_blank')}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                        onClick={() => handleViewDetails(post)}
                      >
                        {post.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1
                        }}
                      >
                        {post.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(post)}
                        color="info"
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/dashboard/update-post/${post._id}`)}
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePost(post._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={posts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Dialog xem chi tiết bài viết */}
      <Dialog
        open={detailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedPost && (
          <>
            <DialogTitle>
              Chi tiết bài viết
              <IconButton
                onClick={handleCloseDetails}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                {selectedPost.image && (
                  <Box
                    component="img"
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    sx={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                )}
                <Typography variant="h5" gutterBottom>
                  {selectedPost.title}
                </Typography>
                <Box display="flex" gap={2} mb={2}>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block'
                    }}
                  >
                    {selectedPost.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo: {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 2,
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto'
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Đóng</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  handleCloseDetails();
                  navigate(`/dashboard/update-post/${selectedPost._id}`);
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

export default BlogManager;
