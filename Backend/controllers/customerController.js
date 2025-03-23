const Customer = require("../models/Customer");
const Order = require('../models/Order');
const { sendErrorResponse } = require("../middlewares/errorHandler");

exports.getCustomer = async (req, res) => {
    try {
        let { phone } = req.query;
        phone = phone?.trim();

        if (!phone) {
            return sendErrorResponse(res, 400, 'Số điện thoại không được để trống.');
        }

        const customer = await Customer.findOne({ phone }).lean();

        if (!customer) {
            return sendErrorResponse(res, 404, 'Không tìm thấy khách hàng.');
        }

        const customerData = {
            customer_id: customer._id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address
        };

        return res.status(200).json({
            success: true,
            data: customerData
        });

    } catch (error) {
        return sendErrorResponse(res, 500, 'lấy thông tin khách hàng', error);
    }
}

exports.getCustomerPurchaseHistory = async (req, res) => {
    try {
        const { customer_id } = req.query;

        if (!customer_id) {
            return sendErrorResponse(res, 400, 'Yêu cầu mã id của khách hàng.');
        }

        let orders = await Order.find({ customer_id }).sort({ created_at: -1 }).lean();

        if (!orders.length) {
            return sendErrorResponse(res, 404, 'Khách hàng này chưa có giao dịch nào.');
        }

        const ordersWithTotalQuantity = orders.map(order => {
            const totalQuantity = order.products.reduce((sum, product) => sum + product.quantity, 0);
            return {
                ...order,
                total_quantity: totalQuantity,
            };
        });

        return res.status(200).json({ success: true, data: ordersWithTotalQuantity });

    } catch (error) {
        return sendErrorResponse(res, 500, 'lấy thông tin giao dịch khách hàng');
    }
}

exports.getSyncUserPurchaseHistory = async (req, res) => {
    try {
        const phone = req.user.phone;

        let customer = await Customer.findOne({ phone }).lean();

        if (!customer) {
            return sendErrorResponse(res, 404, 'Khách hàng chưa có giao dịch nào.');
        }

        const customer_id = customer._id;

        if (!customer_id) {
            return sendErrorResponse(res, 400, 'Yêu cầu mã id của khách hàng.');
        }

        let orders = await Order.find({ customer_id }).sort({ created_at: -1 }).lean();

        if (!orders.length) {
            return sendErrorResponse(res, 404, 'Khách hàng này chưa có giao dịch nào.');
        }

        const ordersWithTotalQuantity = orders.map(order => {
            const totalQuantity = order.products.reduce((sum, product) => sum + product.quantity, 0);
            return {
                ...order,
                total_quantity: totalQuantity,
            };
        });

        return res.status(200).json({ success: true, data: ordersWithTotalQuantity });

    } catch (error) {
        return sendErrorResponse(res, 500, 'lấy thông tin giao dịch đồng bộ khách hàng');
    }
}
