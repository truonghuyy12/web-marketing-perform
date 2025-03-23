const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { sendErrorResponse } = require("../middlewares/errorHandler");
const { transporter } = require("../middlewares/mailConfig");
const crypto = require('crypto'); // Để tạo token ngẫu nhiên

//-----Kiểm tra đầu vào của Đăng ký-----
const validateSignupInput = (email, fullname, username, password, confirmPassword) => {
    if (!email || !fullname || !username || !password || !confirmPassword) {
        return "Vui lòng nhập đầy đủ thông tin cần thiết.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Email không hợp lệ.";
    }

    if (password.length < 6) {
        return "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (password !== confirmPassword) {
        return "Mật khẩu xác nhận không khớp.";
    }

    return null;
};

//-----Đăng ký-----
exports.signUp = async (req, res) => {
    try {
        const { email, fullname, username, password, confirmPassword } = req.body;

        const validationError = validateSignupInput(email, fullname, username, password, confirmPassword);
        if (validationError) {
            return sendErrorResponse(res, 400, validationError);
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return sendErrorResponse(res, 400, "Email này đã được sử dụng.");
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return sendErrorResponse(res, 400, "Tên đăng nhập này đã được sử dụng.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullname: fullname.trim(),
            email,
            username,
            password: hashedPassword,
            role: 'User',
            status: "Inactive"
        });


        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        const activationLink = `http://localhost:3000/activate/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Kích hoạt tài khoản',
            html: `
                <h2>Xin chào ${fullname}!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào đường dẫn dưới đây để kích hoạt tài khoản của bạn:</p>
                <a href="${activationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Kích hoạt tài khoản</a>
                <p>Đường dẫn này sẽ hết hạn sau 5 phút.</p>
                <p>Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ success: true, message: "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản." });
    } catch (error) {
        return sendErrorResponse(res, 500, "đăng ký", error);
    }
};

//-----Đăng nhập-----
exports.signIn = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            return sendErrorResponse(res, 400, "Vui lòng nhập đầy đủ thông tin cần thiết.");
        }

        const user = await User.findOne({
            $or: [
                { email: emailOrUsername },
                { username: emailOrUsername }
            ]
        });

        if (!user) {
            return sendErrorResponse(res, 404, "Không tìm thấy người dùng.");
        }

        if (user.status === "Inactive") {
            return sendErrorResponse(res, 401, "Tài khoản chưa được kích hoạt.");
        }

        if (user.status === "Locked") {
            return sendErrorResponse(res, 401, "Tài khoản đã bị khóa.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendErrorResponse(res, 400, "Thông tin đăng nhập không chính xác.");
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET
        );

        const userData = {
            id: user._id,
            email: user.email,
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            birthday: user.birthday,
        };

        return res.status(200).json({ success: true, message: "Đăng nhập thành công.", token, user: userData })
    } catch (error) {
        return sendErrorResponse(res, 500, "đăng nhập", error);
    }
};

// -----Đặt lại mật khẩu-----
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        const resetLink = `http://localhost:3000/resetPassword/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu',
            html: `
                <p>Vui lòng nhấp vào đường dẫn dưới đây để đặt lại mật khẩu:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
                <p>Đường dẫn này sẽ hết hạn sau 5 phút.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Vui lòng kiểm tra mail để đặt lại mật khẩu." });
    } catch (error) {
        return sendErrorResponse(res, 500, "gửi mail đặt lại mật khẩu", error);
    }
};


// -----Đặt lại mật khẩu-----
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmPassword } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return sendErrorResponse(res, 400, "Mã token không hợp lệ.");
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return sendErrorResponse(res, 400, "Mã token không hợp lệ.");
        }

        if (!newPassword || !confirmPassword) {
            return sendErrorResponse(res, 400, "Vui lòng nhập đầy đủ thông tin cần thiết.");
        }

        if (newPassword !== confirmPassword) {
            return sendErrorResponse(res, 400, "Mật khẩu xác nhận không khớp.");
        }

        if (newPassword.length < 6) {
            return sendErrorResponse(res, 400, "Mật khẩu phải có ít nhất 6 ký tự.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.save();

        return res.status(200).json({
            success: true,
            message: "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới."
        });
    } catch (error) {
        return sendErrorResponse(res, 500, "đặt lại mật khẩu", error);
    }
};

//-----Đổi mật khẩu-----
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return sendErrorResponse(res, 400, "Vui lòng nhập đầy đủ thông tin cần thiết.");
        }

        if (newPassword !== confirmPassword) {
            return sendErrorResponse(res, 400, "Mật khẩu xác nhận không trùng khớp.");
        }

        if (newPassword.length < 6) {
            return sendErrorResponse(res, 400, "Mật khẩu mới phải chứa ít nhất 6 ký tự.");
        }

        const user = await User.findById(userId);
        if (!user) {
            return sendErrorResponse(res, 404, "Không tìm thấy người dùng.");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return sendErrorResponse(res, 400, "Mật khẩu hiện tại không chính xác.");
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return sendErrorResponse(res, 400, "Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công." })
    } catch (error) {
        return sendErrorResponse(res, 500, "đổi mật khẩu", error);
    }
};

//-----Kích hoạt tài khoản-----
exports.activateAccount = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return sendErrorResponse(res, 404, "Không tìm thấy người dùng.");
        }

        if (user.status === "Active") {
            return sendErrorResponse(res, 400, "Tài khoản đã được kích hoạt trước đó.");
        }

        user.status = "Active";
        await user.save();

        return res.status(200).json({ success: true, message: "Kích hoạt tài khoản thành công." });
    } catch (error) {
        console.error('Lỗi kích hoạt tài khoản:', error);

        if (error.name === 'TokenExpiredError') {
            return sendErrorResponse(res, 401, "Đường dẫn kích hoạt đã hết hạn.");
        }

        return sendErrorResponse(res, 400, "Đường dẫn kích hoạt không hợp lệ.");
    }
};

//-----Gửi lại đường dẫn kích hoạt-----
exports.resendActivation = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return sendErrorResponse(res, 400, "Vui lòng nhập email.");
        }

        const user = await User.findOne({ email, status: "Inactive" });
        if (!user) {
            return sendErrorResponse(res, 404, "Không tìm thấy tài khoản chưa kích hoạt với email này.");
        }

        const activationToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '2m' }
        );

        const activationUrl = `http://localhost:3000/activate/${activationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Kích hoạt tài khoản - Đường dẫn mới',
            html: `
                <h2>Xin chào ${user.fullname}!</h2>
                <p>Đây là đường dẫn kích hoạt mới cho tài khoản của bạn. Vui lòng nhấp vào liên kết dưới đây để kích hoạt:</p>
                <a href="${activationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Kích hoạt tài khoản</a>
                <p>Đường dẫn này sẽ hết hạn sau 2 phút.</p>
                <p>Nếu bạn không yêu cầu đường dẫn kích hoạt mới, vui lòng bỏ qua email này.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: "Đường dẫn kích hoạt mới đã được gửi đến email của bạn." });
    } catch (error) {
        return sendErrorResponse(res, 500, "gửi lại đường dẫn kích hoạt", error);
    }
};

//-----Lấy thông tin tài khoản-----
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return sendErrorResponse(res, 404, "Không tìm thấy người dùng.");
        }

        const userData = {
            email: user.email,
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone || '',
            birthday: user.birthday || '',
            bio: user.bio || ''
        };

        return res.status(200).json({ success: true, data: userData });
    } catch (error) {
        return sendErrorResponse(res, 500, "lấy thông tin người dùng", error);
    }
};

//-----Cập nhật thông tin tài khoản-----
exports.updateProfile = async (req, res) => {
    try {
        const { fullname, phone, birthday, bio } = req.body;
        const userId = req.user._id;

        const updateData = {
            fullname: fullname,
            phone: phone || '',
            birthday: birthday || '',
            bio: bio || ''
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return sendErrorResponse(res, 404, "Không tìm thấy người dùng.");
        }

        const userData = {
            email: updatedUser.email,
            username: updatedUser.username,
            fullname: updatedUser.fullname,
            role: updatedUser.role,
            avatar: updatedUser.avatar,
            phone: updatedUser.phone || '',
            birthday: updatedUser.birthday || '',
            bio: updatedUser.bio || ''
        };

        return res.status(200).json({ success: true, message: "Cập nhật thông tin thành công.", data: userData });
    } catch (error) {
        return sendErrorResponse(res, 500, "cập nhật thông tin người dùng", error);
    }
};

//-----Cập nhật ảnh đại diện-----
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user._id;
        const avatar = req.body.avatar;

        if (!avatar) {
            return sendErrorResponse(res, 400, "Ảnh đại diện không được để trống.");
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { avatar: avatar } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return sendErrorResponse(res, 404, "Không tìm thấy người dùng.");
        }

        const userData = {
            email: updatedUser.email,
            username: updatedUser.username,
            fullname: updatedUser.fullname,
            role: updatedUser.role,
            avatar: updatedUser.avatar
        };

        return res.status(200).json({ success: true, message: "Cập nhật ảnh đại diện thành công.", data: userData });
    } catch (error) {
        return sendErrorResponse(res, 500, "cập nhật ảnh đại diện", error);
    }
};

