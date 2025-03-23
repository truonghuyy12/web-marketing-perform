const Product = require("../models/Product");
const Order = require("../models/Order");
const Customer = require("../models/Customer")
const path = require('path');
const fs = require('fs');
const { sendErrorResponse } = require("../middlewares/errorHandler");
const { generateInvoicePDF } = require("../utils/pdfInvoice");

exports.addToCart = async (req, res) => {
  try {
    let { query } = req.body; // Barcode hoặc tên sản phẩm
    query = query?.trim();
    if (!query) {
      return sendErrorResponse(res, 400, 'Yêu cầu thông tin sản phẩm.');
    }

    // Tìm sản phẩm theo barcode hoặc tên
    const product = await Product.findOne({
      $or: [{ barcode: query }, { name: { $regex: query, $options: 'i' } }]
    }).lean();

    if (!product) {
      return sendErrorResponse(res, 404, 'Không tìm thấy sản phẩm.');
    }

    const productData = {
      product_id: product._id,
      barcode: product.barcode,
      name: product.name,
      image: product.images[0],
      unitPrice: product.retailPrice,
      quantity: 1,
      total: product.retailPrice
    };

    res.status(200).json({
      success: true,
      message: `Thêm sản phẩm ${query} thành công.`,
      data: productData
    });
  } catch (error) {
    return sendErrorResponse(res, 500, 'thêm sản phẩm vào giỏ hàng', error);
  }
}

exports.updateQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || quantity === undefined) {
      return sendErrorResponse(res, 400, 'Thiếu thông tin sản phẩm hoặc số lượng.');
    }

    if (quantity < 1) {
      return sendErrorResponse(res, 400, 'Số lượng phải lớn hơn 0.');
    }

    // Tính toán tổng giá trị mới
    const product = await Product.findById(product_id).lean();
    if (!product) {
      return sendErrorResponse(res, 404, 'Không tìm thấy sản phẩm.');
    }

    const total = product.retailPrice * quantity;

    return res.status(200).json({ success: true, message: 'Cập nhật số lượng sản phẩm thành công', total });
  } catch (error) {
    return sendErrorResponse(res, 500, 'lỗi cập nhật số lượng sản phẩm', error);
  }
}

exports.removeFromCart = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return sendErrorResponse(res, 400, 'Thiếu thông tin sản phẩm.');
    }

    const product = await Product.findById(product_id).lean();
    if (!product) {
      return sendErrorResponse(res, 404, 'Không tìm thấy sản phẩm.');
    }

    res.status(200).json({ success: true, message: 'Sản phẩm đã được xóa khỏi giỏ hàng.' });
  } catch (error) {
    return sendErrorResponse(res, 500, 'xóa sản phẩm khỏi giỏ hàng', error);
  }
}

exports.checkOut = async (req, res) => {
  try {
    const { customerPhone, customerName, customerAddress, products, amountPaid, employee_id } = req.body;

    if (!products || products.length === 0) {
      return sendErrorResponse(res, 400, 'Danh sách sản phẩm không được trống');
    }

    if (!customerPhone) {
      return sendErrorResponse(res, 400, 'Vui lòng nhập số điện thoại khách hàng.');
    }

    if (!employee_id) {
      return sendErrorResponse(res, 400, 'Không tìm thấy thông tin nhân viên.');
    }

    // Kiểm tra số lượng sản phẩm trong kho
    for (const product of products) {
      const dbProduct = await Product.findById(product.product_id).lean();
      if (!dbProduct) {
        return sendErrorResponse(res, 400, `Không tìm thấy sản phẩm: ${product.name}`);
      }
      if (dbProduct.quantity < product.quantity) {
        return sendErrorResponse(res, 400, `Sản phẩm ${product.name} chỉ còn ${dbProduct.quantity} trong kho.`);
      }
    }

    let customer = await Customer.findOne({ phone: customerPhone });

    // Nếu không tìm thấy khách hàng, tạo khách hàng mới
    if (!customer) {
      if (!customerName || !customerAddress) {
        return sendErrorResponse(res, 400, 'Khách hàng mới cần thông tin họ tên và địa chỉ.');
      }

      customer = new Customer({
        name: customerName,
        phone: customerPhone,
        address: customerAddress
      });

      await customer.save();
    }

    // Tính tổng tiền đơn hàng
    let totalAmount = 0;
    const orderProducts = products.map((product) => {
      const total = product.unitPrice * product.quantity;
      totalAmount += total;
      return {
        product_id: product.product_id,
        name: product.name,
        quantity: product.quantity,
        price: product.unitPrice,
        total: total
      };
    });

    if (!amountPaid || (amountPaid < totalAmount)) {
      return sendErrorResponse(res, 400, 'Số tiền khách đưa không được nhỏ hơn tổng tiền đơn hàng.');
    }

    const change = amountPaid - totalAmount;

    // Lưu đơn hàng vào cơ sở dữ liệu
    const order = new Order({
      customer_id: customer._id,
      customer_phone: customerPhone,
      employee_id: employee_id,
      products: orderProducts,
      total_price: totalAmount,
      payment_info: {
        amount_paid: amountPaid,
        change: change
      },
      status: 'Completed'
    });

    await order.save();

    // Cập nhật số lượng sản phẩm
    for (const product of products) {
      await Product.findByIdAndUpdate(
        product.product_id,
        { $inc: { quantity: -product.quantity } }
      );
    }

    // Tạo hóa đơn pdf
    await order.populate([
      {
        path: 'products.product_id',
        select: 'barcode'
      },
      {
        path: 'customer_id',
        select: 'name phone address'
      },
      {
        path: 'employee_id',
        select: 'fullname'
      }
    ]);

    await generateInvoicePDF(order, customer);

    const orderData = {
      _id: order._id,
      total_price: order.total_price,
      payment_info: order.payment_info,
      products: order.products,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address
      }
    };

    res.status(200).json({
      success: true,
      message: 'Đơn hàng đã được tạo thành công.',
      order: orderData
    });
  } catch (error) {
    return sendErrorResponse(res, 500, 'xử lý giao dịch', error);
  }
};

exports.downloadInvoice = async (req, res) => {
  const { orderId } = req.params;
  const invoicePath = path.join(__dirname, '../public/invoices', `${orderId}.pdf`);

  // Kiểm tra nếu file tồn tại
  fs.access(invoicePath, fs.constants.F_OK, (error) => {
    if (error) {
      // Nếu file không tồn tại
      return sendErrorResponse(res, 404, 'Hóa đơn không tồn tại.');
    }

    // Gửi file về cho trình duyệt tải xuống
    res.download(invoicePath, `${orderId}.pdf`, (error) => {
      if (error) {
        return sendErrorResponse(res, 500, 'tải hóa đơn', error);
      }
    });
  });
}

exports.searchCustomer = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return sendErrorResponse(res, 400, 'Vui lòng nhập thông tin tìm kiếm!');
    }

    let customer = await Customer.findOne({ phone });
    // const customers = await Customer.find({
    //   $or: [
    //     { name: { $regex: query, $options: 'i' } },
    //     { phone: { $regex: query, $options: 'i' } }
    //   ]
    // }).lean();

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    return sendErrorResponse(res, 500, 'tìm kiếm khách hàng', error);
  }
};