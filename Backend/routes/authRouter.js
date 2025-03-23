const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

//-----Đăng ký-----
router.post('/signUp', authController.signUp);

//-----Đăng nhập-----
router.post('/signIn', authController.signIn);

//-----Kích hoạt tài khoản-----
router.get('/activateAccount/:token', authController.activateAccount);

//-----Gửi lại đường dẫn kích hoạt tài khoản-----
router.post('/resendActivation', authController.resendActivation);

//-----Lấy thông tin người dùng-----
router.get('/profile', verifyToken, authController.getProfile);

//-----Cập nhật thông tin người dùng-----
router.put('/profile', verifyToken, authController.updateProfile);

//-----Thay đổi mật khẩu-----
router.put('/changePassword', verifyToken, authController.changePassword);

//-----Tải ảnh avatar-----
router.post('/uploadAvatar', verifyToken, authController.uploadAvatar);

//-----Quên mật khẩu-----
router.post('/forgotPassword', authController.forgotPassword);

//-----Đặt lại mật khẩu-----
router.post('/resetPassword/:token', authController.resetPassword);

module.exports = router;
