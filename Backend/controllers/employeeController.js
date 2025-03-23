const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require('fs');
const User = require("../models/User");
const Order = require("../models/Order");
const { sendErrorResponse } = require("../middlewares/errorHandler");
const { transporter } = require("../middlewares/mailConfig");

//-----Lấy danh sách nhân viên-----
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee' }).select('-password');

    res.status(200).json({ success: true, employees });
  } catch (error) {
    return sendErrorResponse(res, 500, 'lấy danh sách nhân viên', error);
  }
};

//-----Lấy thông tin nhân viên-----
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password').lean();

    if (!employee) {
      return sendErrorResponse(res, 404, "Không tìm thấy nhân viên!");
    }

    return res.status(200).json({ success: true, employee });
  } catch (error) {
    return sendErrorResponse(res, 500, "lấy thông tin nhân viên.", error);
  }
}

//-----Tạo nhân viên-----
exports.createEmployee = async (req, res) => {
  try {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
      return sendErrorResponse(res, 400, "Vui lòng nhập đầy đủ thông tin cần thiết.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendErrorResponse(res, 400, "Email không hợp lệ.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendErrorResponse(res, 400, "Email này đã được sử dụng.");
    }

    const username = email.split("@")[0];
    const password = username;
    const hashedPassword = await bcrypt.hash(password, 10);
    const bitmap = fs.readFileSync("./public/img/users/user_default.png");
    const base64String = new Buffer(bitmap).toString('base64');

    const newEmployee = new User({
      fullname,
      email,
      username,
      password: hashedPassword,
      role: "Employee",
      status: "Inactive",
      avatar: base64String
    });

    await newEmployee.save();

    const token = jwt.sign(
      { id: newEmployee._id },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    const activationLink = `http://localhost:3000/activate/${token}`;

    await transporter.sendMail({
      to: email,
      subject: "Kích hoạt tài khoản",
      html: `
    <h2>Xin chào ${fullname}!</h2>
    <p>Tài khoản của bạn đã được tạo:</p>
    <ul>
      <li>Tên đăng nhập: <strong>${username}</strong></li>
      <li>Mật khẩu: <strong>${password}</strong></li>
    </ul>
    <p>Vui lòng nhấp vào nút bên dưới để kích hoạt tài khoản:</p>
    <a href="${activationLink}" 
       style="display: inline-block; 
              padding: 10px 20px; 
              background-color: #4CAF50; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;">
      Kích hoạt tài khoản
    </a>
    <p><strong>Lưu ý:</strong></p>
    <ul>
      <li>Liên kết có thời hạn là 2 phút</li>
      <li>Sau 2 phút bạn cần yêu cầu admin gửi lại email kích hoạt</li>
      <li>Bạn không thể đăng nhập nếu chưa kích hoạt tài khoản</li>
    </ul>
    <p>Cảm ơn!</p>
    `,
    });

    return res.status(201).json({ success: true, message: "Tạo tài khoản nhân viên thành công. Hệ thống đã gửi email kích hoạt." });
  } catch (error) {
    return sendErrorResponse(res, 500, "tạo nhân viên", error);
  }
};

//-----Gửi mail kích hoạt-----
exports.resendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse(res, 404, "Người dùng không tồn tại.");
    }

    if (user.status === "Active") {
      return sendErrorResponse(res, 400, "Tài khoản này đã được kích hoạt từ trước.");
    }

    if (user.status === "Locked") {
      return sendErrorResponse(res, 400, "Tài khoản này đã bị khóa.");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1m",
    });

    const activationLink = `http://localhost:${process.env.PORT}/api/auth/activateAccount/${token}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Kích hoạt lại tài khoản của bạn",
      text: `
      \nChào ${user.fullname},\n\nBạn đã yêu cầu gửi lại email kích hoạt. Nhấn vào link sau để kích hoạt tài khoản (liên kết có hiệu lực trong 1 phút):\n\n${activationLink}\n\nCảm ơn!`,
    });

    return res.json({ success: true, message: "Email kích hoạt đã được gửi lại thành công." });
  } catch (error) {
    return sendErrorResponse(res, 500, "gửi email kích hoạt", error);
  }
}

//-----Khóa/Mở khóa nhân viên-----
exports.toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse(res, 404, "Tài khoản nhân viên không tồn tại.");
    }

    if (user.status === "Inactive") {
      return sendErrorResponse(res, 400, "Tài khoản này chưa được kích hoạt.");
    }

    user.status = user.status === "Locked" ? "Active" : "Locked";
    await user.save();

    return res.json({
      success: true,
      message: user.status === "Locked" ? "Khóa tài khoản thành công." : "Mở khóa tài khoản thành công.",
      status: user.status,
    });

  } catch (error) {
    return sendErrorResponse(res, 500, "đóng/mở khóa nhân viên", error);
  }
}

//-----Lấy thông tin bán hàng của nhân viên-----
exports.getEmployeeSalesInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id).lean();

    if (!employee) {
      return sendErrorResponse(res, 404, "Nhân viên khôn tồn tại.");
    }

    const orders = await Order.find({ employee_id: id }).sort({ created_at: -1 }).lean();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
    const totalProductsSold = orders.reduce((sum, order) => {
      return sum + order.products.reduce((count, product) => count + product.quantity, 0);
    }, 0);

    // Format dữ liệu đơn hàng
    const orderDetails = orders.map((order) => ({
      orderId: order._id,
      createdAt: order.created_at,
      totalProducts: order.products.reduce((count, product) => count + product.quantity, 0),
      totalPrice: order.total_price
    }));

    return res.status(200).json({
      success: true,
      employeeInfo: {
        id: employee._id,
        email: employee.email,
        fullname: employee.fullname
      },
      totalOrders,
      totalRevenue,
      totalProductsSold,
      orderDetails
    });

  } catch (error) {
    return sendErrorResponse(res, 500, "lấy thông tin bán hàng", error);
  }
};

//-----Xóa nhân viên-----
exports.deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await User.findById(employeeId);

    if (!employee) {
      return sendErrorResponse(res, 404, "Không tìm thấy nhân viên.");
    }

    if (employee._id.toString() === req.user._id.toString()) {
      return sendErrorResponse(res, 400, "Không thể xóa tài khoản của chính mình.");
    }

    await User.findByIdAndDelete(employeeId);

    return res.status(200).json({ success: true, message: "Xóa nhân viên thành công." });
  } catch (error) {
    return sendErrorResponse(res, 500, "xóa nhân viên", error);
  }
};
