const express = require('express');
const router = express.Router();
const customerController = require("../controllers/customerController");
const {verifyToken, isStaff} = require("../middlewares/auth");

//-----Lấy dữ liệu khách hàng-----
router.get('/', verifyToken, isStaff, customerController.getCustomer);

//-----Lấy lịch sử giao dịch của khách hàng-----
router.get('/purchaseHistory', verifyToken, isStaff, customerController.getCustomerPurchaseHistory)

module.exports = router;