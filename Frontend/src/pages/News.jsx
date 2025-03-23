import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment } from 'react-icons/fa';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const postsPerPage = 3;

export default function News() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Product', label: 'Product' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Performance', label: 'Performance' },
    { value: 'other', label: 'Khác' }
  ];

  // Hàm để lọc và sắp xếp bài viết
  const getFilteredAndSortedPosts = useCallback((posts, searchQuery, selectedCategory, sortOrder) => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
  }, []);

  // Sử dụng useMemo để tính toán filteredPosts chỉ khi các dependencies thay đổi
  const filteredPosts = React.useMemo(() =>
    getFilteredAndSortedPosts(posts, searchQuery, selectedCategory, sortOrder),
    [posts, searchQuery, selectedCategory, sortOrder, getFilteredAndSortedPosts]
  );

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`/posts?page=${currentPage}`);
        setPosts(response.data.posts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Error fetching posts');
        setLoading(false);
      }
    };

    fetchPosts();

    // Fetch liked posts on login
    const fetchLikedPosts = async () => {
      if (currentUser) {
        try {
          const response = await axios.get('/posts/me/likes', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          setLikedPosts(response.data); // Assuming response.data is an array of post IDs
        } catch (error) {
          console.error("Error fetching liked posts:", error);
        }
      } else {
        setLikedPosts([]); // Reset likedPosts when the user logs out
      }
    };
    fetchLikedPosts();
  }, [currentPage, currentUser, token]);

  const handleLike = async (postId) => {
    try {
      const response = await axios.put(
        `/posts/like/${postId}`,
        {}, // No body needed for the like request
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const updatedPosts = posts.map(post =>
        post._id === postId ? { ...post, likes: response.data.likes } : post
      );

      setPosts(updatedPosts);
      setLikedPosts(prev =>
        prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
      );

    } catch (err) {
      console.error('Error liking post:', err);
      setError('Failed to like post. Please try again.');  // Set an error message for the user
    }
  };

  const handleComment = async (postId) => {
    if (!commentText[postId]?.trim()) return;

    try {
      const response = await axios.post(
        `/posts/comment/${postId}`,
        { content: commentText[postId] },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const updatedPosts = posts.map(post =>
        post._id === postId ? { ...post, comments: response.data.comments } : post
      );

      setPosts(updatedPosts);
      setCommentText(prevCommentText => ({
        ...prevCommentText,
        [postId]: '' // Clear the comment text for this post after submitting
      }));
    } catch (err) {
      console.error('Error commenting:', err);
      setError('Failed to post comment. Please try again.');  // Set an error message for the user
    }
  };

  const handleCommentChange = (postId, event) => {
    setCommentText({
      ...commentText,
      [postId]: event.target.value
    });
  };

  if (loading) return (
    <Box style={styles.loadingContainer}>
      <Box style={styles.spinner}></Box>
    </Box>
  );

  if (error) return <Box style={styles.error}>{error}</Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '72px',
          py: 1
        }}>
          {/* Logo */}
          <Typography
            variant="h5"
            noWrap
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              cursor: 'pointer',
              fontSize: '24px'
            }}
            onClick={() => navigate('/')}
          >
            Marketing Platform
          </Typography>

          {/* Search Bar and Categories */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '800px',
            mx: 4
          }}>
            {/* Search Bar */}
            <TextField
              placeholder="Tìm kiếm bài viết..."
              variant="outlined"
              size="medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  borderRadius: '20px',
                  height: '44px'
                },
                '& .MuiOutlinedInput-input': {
                  fontSize: '16px'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '20px' }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Categories */}
            <Box sx={{
              display: 'flex',
              gap: 1,
              mt: 1,
              flexWrap: 'nowrap',
              overflowX: 'auto',
              width: '100%',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}>
              {categories.map(category => (
                <Chip
                  key={category.value}
                  label={category.label}
                  onClick={() => setSelectedCategory(category.value)}
                  color={selectedCategory === category.value ? 'primary' : 'default'}
                  variant={selectedCategory === category.value ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: '15px',
                    '&:hover': {
                      backgroundColor: selectedCategory === category.value ? '#1565c0' : 'rgba(21, 101, 192, 0.1)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser ? (
              <>
                <Typography variant="body1" sx={{ mr: 1, fontSize: '16px' }}>
                  {currentUser.username}
                </Typography>
                <IconButton onClick={handleUserMenuClick}>
                  <Avatar
                    src={currentUser.avatar !== 'user_default.png' ? `data:image/png;base64,${currentUser.avatar}` : '/default-avatar.png'}
                    alt={currentUser.username}
                    sx={{ width: 40, height: 40 }}
                  />
                </IconButton>
                {currentUser && currentUser.role == 'User' && (
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                      },
                    }}
                  >
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Đăng xuất</ListItemText>
                    </MenuItem>
                  </Menu>
                )}
              </>
            ) : (
              <IconButton
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  px: 2,
                  py: 1,
                  borderRadius: '20px'
                }}
              >
                <Typography variant="button" sx={{ mr: 1 }}>
                  Đăng nhập
                </Typography>
                <Avatar sx={{ width: 32, height: 32 }} />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ pt: 12 }}>
        <Box style={{
          backgroundColor: '#bbdefb',
          minHeight: '100vh',
          padding: '20px 0',
          position: 'relative',
        }}>
          <Box style={styles.pageLayout}>
            <Box style={styles.mainContent}>
              <Typography style={styles.pageTitle} variant="h4">Tin Tức</Typography>

              <Box style={styles.postsGrid}>
                {currentPosts.map((post) => (
                  <Box
                    key={post._id}
                    style={styles.postCard}
                    onClick={() => setSelectedPostId(selectedPostId === post._id ? null : post._id)} // Toggle selection
                  >
                    <Box style={styles.cardHeader}>
                      <Box style={styles.userInfo}>
                        <img
                          src={post.userId?.avatar !== 'user_default.png' ? `data:image/png;base64,${post.userId.avatar}` : '/default-avatar.png'}
                          alt={post.userId?.username}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            marginRight: '12px',
                            objectFit: 'cover',
                            border: '2px solid #0984e3',
                            padding: '2px',
                            backgroundColor: '#fff'
                          }}
                        />
                        <Box>
                          <Typography style={styles.username}>{post.userId?.username}</Typography>
                          <Box style={styles.postMeta}>
                            <Typography style={styles.date}>
                              {new Date(post.createdAt).toLocaleString()}
                            </Typography>
                            <Typography style={styles.category}>• {post.category}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {post.image && (
                      <Box style={styles.imageContainer}>
                        <img
                          src={post.image}
                          alt={post.title}
                          style={styles.postImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      </Box>
                    )}

                    <Box style={styles.postContent}>
                      <Typography style={styles.postTitle} variant="h6">{post.title}</Typography>
                      {selectedPostId === post._id && ( // Hiển thị content có điều kiện
                        <Box
                          style={styles.postText}
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      )}

                      <Box style={styles.postFooter}>
                        <Box style={styles.actions}>
                          <IconButton
                            onClick={() => handleLike(post._id)}
                            style={{
                              ...styles.actionButton,
                              color: likedPosts.includes(post._id) ? 'red' : 'black',
                            }}
                          >
                            {likedPosts.includes(post._id) ? (
                              <FaHeart style={{ fontSize: '1.2rem' }} />
                            ) : (
                              <FaRegHeart style={{ fontSize: '1.2rem' }} />
                            )}
                            <Typography style={{
                              ...styles.actionCount,
                              color: likedPosts.includes(post._id) ? 'red' : 'black',
                            }}>
                              {Array.isArray(post.likes) ? post.likes.length : 0}
                            </Typography>
                          </IconButton>

                          <IconButton style={styles.actionButton}>
                            <FaComment />
                            <Typography style={styles.actionCount}>
                              {post.comments?.length || 0}
                            </Typography>
                          </IconButton>
                        </Box>

                        <Box style={styles.commentSection}>
                          <Box style={styles.commentForm}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Viết bình luận..."
                              value={commentText[post._id] || ''}
                              onChange={(e) => handleCommentChange(post._id, e)}
                              style={styles.commentInput}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleComment(post._id);
                                }
                              }}
                              InputProps={{
                                endAdornment: (
                                  <IconButton
                                    onClick={() => handleComment(post._id)}
                                    style={styles.commentButton}
                                  >
                                    Gửi
                                  </IconButton>
                                ),
                              }}
                            />
                          </Box>

                          <Box style={styles.commentsList}>
                            {post.comments?.slice(0, 10).map((comment) => (
                              <Box key={comment._id} style={styles.commentItem}>
                                <img
                                  src={comment.userId?.avatar !== 'user_default.png' ? `data:image/png;base64,${comment.userId.avatar}` : '/default-avatar.png'}
                                  alt={comment.userId?.username}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    marginRight: '8px',
                                    objectFit: 'cover',
                                    border: '1px solid #0984e3',
                                    padding: '1px',
                                    backgroundColor: '#fff'
                                  }}
                                />
                                <Box style={styles.commentContent}>
                                  <Typography style={styles.commentUsername}>{comment.userId?.username}</Typography>
                                  <Typography style={styles.commentText}>{comment.content}</Typography>
                                </Box>
                              </Box>
                            ))}
                            {post.comments?.length > 10 && (
                              <Typography style={styles.viewMoreComments}>
                                Xem thêm {post.comments.length - 10} bình luận
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box style={styles.pagination}>
                <IconButton
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.pageButton,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: currentPage === 1 ? '#ccc' : '#1976d2',
                  }}
                >
                  <Typography style={{ fontSize: '20px' }}>‹</Typography>
                </IconButton>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <IconButton
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      ...styles.pageButton,
                      backgroundColor: currentPage === pageNum ? '#1976d2' : 'transparent',
                      color: currentPage === pageNum ? 'white' : '#1976d2',
                      fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                      minWidth: '32px',
                      height: '32px',
                      padding: 0,
                      margin: '0 4px',
                      transition: 'all 0.3s ease',
                      transform: currentPage === pageNum ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {pageNum}
                  </IconButton>
                ))}

                <IconButton
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.pageButton,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: currentPage === totalPages ? '#ccc' : '#1976d2',
                  }}
                >
                  <Typography style={{ fontSize: '20px' }}>›</Typography>
                </IconButton>
              </Box>
            </Box>

            <Box style={{ ...styles.sidebar, order: 2 }}>
              <Box style={styles.topPostsCard}>
                <Typography style={styles.sidebarTitle} variant="h6">
                  <Typography style={styles.sidebarIcon}>🏆</Typography>
                  Bài viết nổi bật
                </Typography>
                {posts
                  .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
                  .slice(0, 3)
                  .map((post, index) => (
                    <Box
                      key={post._id}
                      style={styles.topPostItem}
                    >
                      <Typography style={styles.topPostRank}>#{index + 1}</Typography>
                      <Box style={styles.topPostContent}>
                        <Typography style={styles.topPostTitle} variant="subtitle1">{post.title}</Typography>
                        <Box style={styles.topPostMeta}>
                          <Typography style={styles.topPostLikes}>
                            ❤️ {post.likes?.length || 0} lượt thích
                          </Typography>
                          <Typography style={styles.topPostDate}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      {post.image && (
                        <Box style={styles.topPostImage}>
                          <img
                            src={post.image}
                            alt={post.title}
                            style={styles.topPostThumb}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  loadingContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.3)',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 2s linear infinite',
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
  error: {
    color: 'red',
    margin: '10px',
    textAlign: 'center',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#e3f2fd',
    minHeight: '100vh',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: '24px',
    textAlign: 'center',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  postsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '100%',
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    border: '1px solid #e3f2fd',
    maxWidth: '100%',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  cardHeader: {
    padding: '16px',
    borderBottom: '1px solid #e3f2fd',
    backgroundColor: '#f8faff',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  postMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#636e72',
    fontSize: '0.875rem',
  },
  postContent: {
    padding: '16px',
  },
  postImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  postTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '8px',
  },
  postText: {
    color: '#636e72',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 16px',
    borderTop: '1px solid #edf2f7',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
  },
  actionCount: {
    fontSize: '0.875rem',
    color: '#636e72',
    marginLeft: '4px',
  },
  commentSection: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
  },
  commentForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  commentInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e1e8ed',
    borderRadius: '20px',
    fontSize: '0.875rem',
  },
  commentButton: {
    background: '#0984e3',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  commentItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '8px 12px',
    borderRadius: '12px',
  },
  commentUsername: {
    fontWeight: '600',
    color: '#2d3436',
    fontSize: '0.875rem',
    marginBottom: '4px',
  },
  commentText: {
    color: '#636e72',
    fontSize: '0.875rem',
    lineHeight: '1.4',
  },
  viewMoreComments: {
    background: 'none',
    border: 'none',
    color: '#0984e3',
    fontSize: '0.875rem',
    cursor: 'pointer',
    padding: '4px 0',
  },
  username: {
    fontWeight: '600',
    color: '#2d3436',
    fontSize: '1rem',
    marginBottom: '2px',
  },
  date: {
    fontSize: '0.875rem',
    color: '#636e72',
  },
  category: {
    fontSize: '0.875rem',
    color: '#636e72',
  },
  filterSection: {
    marginBottom: '24px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  searchBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '30px',
    border: '2px solid #e3f2fd',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#1565c0',
      boxShadow: '0 0 0 4px rgba(21, 101, 192, 0.1)',
    },
  },
  searchButton: {
    padding: '12px 24px',
    borderRadius: '30px',
    border: 'none',
    backgroundColor: '#1565c0',
    color: '#ffffff',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(21, 101, 192, 0.2)',
    '&:hover': {
      backgroundColor: '#1976d2',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(21, 101, 192, 0.3)',
    },
  },
  filterControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  categoryFilter: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  categoryButton: {
    padding: '10px 20px',
    borderRadius: '25px',
    border: '2px solid #1565c0',
    backgroundColor: '#ffffff',
    color: '#1565c0',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#1565c0',
      color: '#ffffff',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(21, 101, 192, 0.3)',
    },
  },
  sortButtons: {
    display: 'flex',
    gap: '10px',
  },
  sortButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '25px',
    border: '2px solid #1565c0',
    backgroundColor: '#ffffff',
    color: '#1565c0',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#1565c0',
      color: '#ffffff',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(21, 101, 192, 0.3)',
    },
  },
  sortIcon: {
    fontSize: '1.1rem',
  },
  pageLayout: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
  },
  mainContent: {
    width: '800px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    height: 'fit-content',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: '20px',
  },
  topPostsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  sidebarTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sidebarIcon: {
    fontSize: '1.5rem',
  },
  topPostItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    marginBottom: '12px',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    '&:hover': {
      backgroundColor: '#f5f9ff',
      transform: 'translateX(4px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
  },
  topPostRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1565c0',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  topPostContent: {
    flex: 1,
    minWidth: 0,
    marginRight: '12px',
  },
  topPostImage: {
    width: '60px',
    height: '60px',
    flexShrink: 0,
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #e3f2fd',
  },
  topPostThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  topPostTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#2d3436',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  topPostMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.875rem',
    color: '#636e72',
  },
  topPostLikes: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  topPostDate: {
    color: '#636e72',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2px',
    marginTop: '30px',
    marginBottom: '30px',
    padding: '10px',
    borderRadius: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: 'fit-content',
    margin: '30px auto',
  },
  pageButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #1976d2',
    borderRadius: '50%',
    backgroundColor: 'white',
    color: '#1976d2',
    cursor: 'pointer',
    fontSize: '14px',
    outline: 'none',
    '&:hover': {
      backgroundColor: '#1976d2',
      color: 'white',
      transform: 'scale(1.1)',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      '&:hover': {
        transform: 'none',
        backgroundColor: 'transparent',
      }
    },
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(styleSheet);
