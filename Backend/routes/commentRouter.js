const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken, isAdmin, isStaff } = require("../middlewares/auth");

//-----Lấy danh sách bình luận-----
router.get('/', verifyToken, commentController.getComments);

//-----Lấy danh sách bình luận từ một bài viết-----
router.get('/post/:postId', commentController.getPostComments);

//-----Thích bình luận-----
router.put('/like/:commentId', verifyToken, commentController.likeComment);

//-----Tạo bình luận-----
router.post('/create', verifyToken, commentController.createComment);

//-----Cập nhật bình luận-----
router.put('/update/:commentId', verifyToken, commentController.updateComment);

//-----Xóa bình luận-----
router.delete('/delete/:commentId', verifyToken, commentController.deleteComment);

module.exports = router;