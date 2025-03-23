const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendErrorResponse } = require('../middlewares/errorHandler');

//-----Xác thực token-----
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendErrorResponse(res, 401, 'Không có token được cung cấp.');
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return sendErrorResponse(res, 401, 'Token đã hết hạn.');
        } else {
          return sendErrorResponse(res, 401, 'Token không hợp lệ.');
        }
      }

      const user = await User.findById(decoded.id).select('-password').lean();

      if (!user) {
        return sendErrorResponse(res, 404, 'Người dùng không tồn tại.');
      }

      if (user.status === "Locked") {
        return sendErrorResponse(res, 403, 'Tài khoản đã bị khóa.');
      }

      req.user = user;
      next();
    });
  } catch (error) {
    return sendErrorResponse(res, 500, "xác thực token", error);
  }
};

//-----Kiểm tra quyền quản trị viên-----
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return sendErrorResponse(res, 403, 'Chỉ có quản trị viên mới có quyền truy cập.');
  }
  next();
};

//-----Kiểm tra quyền-----
exports.isStaff = (req, res, next) => {
  if (!req.user || !["Admin", "Employee"].includes(req.user.role)) {
    return sendErrorResponse(res, 403, 'Chỉ có nhân viên mới có quyền truy cập.');
  }
  next();
};