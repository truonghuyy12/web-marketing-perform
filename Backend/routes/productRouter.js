const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, isStaff } = require("../middlewares/auth");

// Lấy danh sách sản phẩm
// Query parameters: ?page=<page_number>&limit=<items_per_page>
// Example: /products?page=1&limit=10
router.get("/", productController.getProducts);

//-----Hiển thị chi tiết sản phẩm-----
router.get("/:barcode", productController.getProduct);

//-----Tạo sản phẩm-----
router.post("/create", verifyToken, isStaff, productController.createProduct);

//-----Cập nhật sản phẩm-----
router.put("/update/:barcode", verifyToken, isStaff, productController.updateProduct);

//-----Xóa sản phẩm-----
router.delete("/delete/:barcode", verifyToken, isStaff, productController.deleteProduct);

module.exports = router;
