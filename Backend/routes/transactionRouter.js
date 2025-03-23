const express = require("express");
const router = express.Router({ mergeParams: true });
const transactionController = require("../controllers/transactionController");
const {verifyToken, isStaff} = require("../middlewares/auth");

//-----Thêm sản phẩm vào giỏ hàng-----
router.post('/addToCart', verifyToken, isStaff, transactionController.addToCart);

//-----Cập nhật số lượng sản phẩm trong giỏ hảng-----
router.put('/updateCart', verifyToken, isStaff, transactionController.updateQuantity);

//-----Xóa sản phẩm khỏi giỏ hàng-----
router.delete('/removeFromCart', verifyToken, isStaff, transactionController.removeFromCart);

//-----Tìm kiếm khách hàng-----
router.get('/searchCustomer', verifyToken, isStaff, transactionController.searchCustomer);

//-----Tạo đơn hàng và in hóa đơn-----
router.post('/checkOut', verifyToken, isStaff, transactionController.checkOut);

//-----Tải hóa đơn-----
router.get('/download/order/:orderId', verifyToken, isStaff, transactionController.downloadInvoice)

module.exports = router;
