const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {type: String, trim: true},
    email: {
      type: String,
      trim: true,
      required: [true, "Email không được để trống."],
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Email không hợp lệ. Vui lòng nhập đúng định dạng.",
      ],
    },
    fullname: {
      type: String,
      trim: true,
      required: [true, "Họ và tên không được để trống."],
    },
    avatar: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Mật khẩu không được để trống."],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Locked"],
      default: "Inactive",
    },
    role: {
      type: String,
      enum: ["Admin", "Employee", "User"],
      default: "User",
    },
    phone: { type: String, trim: true, default: "" },
    birthday: { type: String, default: "" },
    bio: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;