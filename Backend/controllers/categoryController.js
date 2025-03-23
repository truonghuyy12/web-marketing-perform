const Category = require('../models/Category');
const Product = require('../models/Product');
const { sendErrorResponse } = require("../middlewares/errorHandler");

//-----Lấy danh sách danh mục-----
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();

        return res.status(200).json({ success: true, categories });
    } catch (error) {
        return sendErrorResponse(res, 500, "lấy danh sách danh mục", error);
    }
};

//-----Tạo danh mục-----
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return sendErrorResponse(res, 400, "Vui lòng nhập đầy đủ thông tin cần thiết.");
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return sendErrorResponse(res, 400, "Danh mục đã tồn tại.");
        }

        const category = new Category({ name, description });
        await category.save();

        return res.status(201).json({ success: true, message: "Tạo danh mục thành công.", category });
    } catch (error) {
        return sendErrorResponse(res, 500, "tạo danh mục", error);
    }
};

//-----Cập nhật danh mục-----
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || !description) {
            return sendErrorResponse(res, 400, "Vui lòng nhập đầy đủ thông tin cần thiết.");
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return sendErrorResponse(res, 400, "Danh mục đã tồn tại.");
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        if (!category) {
            return sendErrorResponse(res, 404, "Không tìm thấy danh mục.");
        }

        res.status(200).json({ success: true, message: "Cập nhật danh mục thành công.", category });
    } catch (error) {
        return sendErrorResponse(res, 500, "cập nhật danh mục", error);
    }
};

//-----Xóa danh mục-----
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return sendErrorResponse(res, 404, "Không tìm thấy danh mục.");
        }

        const isCategoryInUse = await Product.exists({ category: id });
        if (isCategoryInUse) {
            return sendErrorResponse(res, 400, "Không thể xóa danh mục vì vẫn còn sản phẩm liên kết.");
        }

        await Category.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "Xóa danh mục thành công." });
    } catch (error) {
        return sendErrorResponse(res, 500, "xóa danh mục", error);
    }
};
