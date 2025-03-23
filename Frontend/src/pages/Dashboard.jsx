import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import {
  Inventory as ProductIcon,
  Category as CategoryIcon,
  People as EmployeeIcon,
  Receipt as OrderIcon,
  Article as PostIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalEmployees: 0,
    totalOrders: 0,
    totalPosts: 0
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch dashboard stats
        const dashboardRes = await axios.get(
          '/dashboard',
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        if (dashboardRes.data.success && dashboardRes.data.stats) {
          setStats({
            totalProducts: dashboardRes.data.stats.products,
            totalCategories: dashboardRes.data.stats.categories,
            totalEmployees: dashboardRes.data.stats.sales,
            totalOrders: dashboardRes.data.stats.orders,
            totalPosts: 0 // Will be updated from posts request
          });
        }

        // Fetch posts separately to get total count
        const postsRes = await axios.get(
          '/posts',
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        if (postsRes.data.success) {
          setPosts(postsRes.data.posts);
          setStats(prev => ({
            ...prev,
            totalPosts: postsRes.data.posts.length
          }));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: '100%',
        bgcolor: color,
        color: 'white',
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        py: 2
      }}>
        <Icon sx={{ fontSize: 48, opacity: 0.9 }} />
        <Typography variant="h5" component="h2" align="center">
          {title}
        </Typography>
        <Typography
          variant="h3"
          component="p"
          align="center"
          sx={{
            fontWeight: 'bold',
            fontSize: '3rem',
            lineHeight: 1,
            height: '64px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 5 }}>
        Số liệu thống kê
      </Typography>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Tổng số sản phẩm"
            value={stats.totalProducts}
            icon={ProductIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Tổng số danh mục"
            value={stats.totalCategories}
            icon={CategoryIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Tổng số nhân viên"
            value={stats.totalEmployees}
            icon={EmployeeIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Tổng số đơn hàng"
            value={stats.totalOrders}
            icon={OrderIcon}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Tổng số bài viết"
            value={stats.totalPosts}
            icon={PostIcon}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Bài viết gần đây</Typography>
          <Button
            component={Link}
            to="/dashboard/create-post"
            variant="contained"
            color="primary"
            startIcon={<PostIcon />}
          >
            Tạo bài viết mới
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading posts...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : posts.length === 0 ? (
          <Typography>No posts found</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Danh mục</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.map((post, index) => (
                  <TableRow key={post._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Link 
                        to={`/posts/${post._id}`}
                        style={{ 
                          textDecoration: 'none', 
                          color: 'inherit',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                      >
                        {post.title}
                      </Link>
                    </TableCell>
                    <TableCell>
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
                        {post.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        to={`/dashboard/update-post/${post._id}`}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this post?')) {
                            axios.delete(
                              `/posts/delete/${post._id}`,
                              {
                                headers: {
                                  'Accept': 'application/json',
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                }
                              })
                              .then(response => {
                                if (response.data.success) {
                                  setPosts(posts.filter(p => p._id !== post._id));
                                }
                              })
                              .catch(error => {
                                console.error('Error deleting post:', error);
                                alert(error.response?.data?.message || 'Error deleting post');
                              });
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
