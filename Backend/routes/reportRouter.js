const express = require('express');
const router = express.Router();
const reportController = require("../controllers/reportController");
const {verifyToken, isAdmin, isStaff} = require("../middlewares/auth");

//-----Hiển thị giao diện báo cáo-----
router.get("/", verifyToken, isStaff, reportController.getReport);

//-----Lọc dữ liệu báo cáo-----
router.post("/filter", verifyToken, isStaff, reportController.filterOrder);

//-----Lấy chi tiết hóa đơn-----
router.get("/order/:orderId", verifyToken, isStaff, reportController.getOrder);
router.get("/user", verifyToken, reportController.getOrdersByUserPhone);
module.exports = router;
