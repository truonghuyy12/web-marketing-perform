exports.sendErrorResponse = (res, status, message, error) => {
    if (status == 500) {
        message = `Đã xảy ra lỗi trong quá trình ${message}. Vui lòng thử lại sau.`;
    }

    return res.status(status).json({ success: false, message });
};