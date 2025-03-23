const multer = require("multer");

const storage = (destination) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, destination); // Thư mục lưu trữ
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.floor(Math.random() * 9999 + 1);
        cb(null, `${uniqueSuffix}-${file.originalname}`); // Tên file duy nhất
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ được phép upload file ảnh (JPEG, PNG, GIF, JPG)"));
    }
  };

exports.uploadAvatar = multer({
    storage: storage("public/uploads/avatar"),
    limits: {fileSize: 2 * 1024 * 1024}, // Giới hạn 2MB
    fileFilter
});

exports.uploadProductImg = multer({
  storage: storage("public/uploads/product"),
  limits: {fileSize: 3 * 1024 * 1024}, // Giới hạn 3MB
  fileFilter,
}).array("images", 4); // Tối đa 4 file