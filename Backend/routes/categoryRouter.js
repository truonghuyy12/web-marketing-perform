const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const {verifyToken, isAdmin} = require("../middlewares/auth");

//-----Lấy danh sách danh mục-----
router.get("/", categoryController.getCategories);

//-----Tạo danh mục-----
router.post("/create", verifyToken, isAdmin, categoryController.createCategory);

//-----Cập nhật danh mục-----
router.put("/update/:id", verifyToken, isAdmin, categoryController.updateCategory);

//-----Xóa danh mục-----
router.delete("/delete/:id", verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;
