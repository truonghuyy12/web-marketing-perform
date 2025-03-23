const express = require('express');
const router = express.Router();
const postController = require("../controllers/postController");
const {verifyToken, isAdmin, isStaff} = require('../middlewares/auth');

// Public routes
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);

// Protected routes
router.post('/create', verifyToken, isStaff, postController.createPost);
router.put('/update/:id', verifyToken, isStaff, postController.updatePost);
router.delete('/delete/:id', verifyToken, isStaff, postController.deletePost);

// Like and comment routes
router.put('/like/:id', verifyToken, postController.likePost);
router.post('/comment/:id', verifyToken, postController.commentPost);
router.get('/me/likes', verifyToken, postController.getLikedPosts);

module.exports = router;