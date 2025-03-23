const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middlewares/auth');

// Cấu hình multer storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Đảm bảo thư mục uploads tồn tại
        const uploadDir = path.join(__dirname, '../public/uploads');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Cấu hình multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        // Kiểm tra mime type
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('image');

// Route handler
router.post('/', verifyToken, (req, res) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // Lỗi từ multer
            return res.status(400).json({
                success: false,
                message: err.message
            });
        } else if (err) {
            // Lỗi khác
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Kiểm tra file đã được upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Thành công - trả về đường dẫn tương đối
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: fileUrl
        });
    });
});

module.exports = router;
