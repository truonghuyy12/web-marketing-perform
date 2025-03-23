const Order = require("../models/Order");
const { sendErrorResponse } = require("../middlewares/errorHandler")

// Hàm tính khoảng thời gian
const getTimeRange = (timeline, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (timeline) {
    case "all":
      start = new Date(0); // Từ thời điểm xa nhất có thể
      end = new Date(); // Đến hiện tại
      break;
    case "today":
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      start = new Date(yesterday.setHours(0, 0, 0, 0));
      end = new Date(yesterday.setHours(23, 59, 59, 999));
      break;
    case "last_7_days":
      const last7Days = new Date(now);
      last7Days.setDate(now.getDate() - 7);
      start = new Date(last7Days.setHours(0, 0, 0, 0));
      end = new Date();
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "custom":
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error("Thời gian không hợp lệ.");
  }
  return { start, end };
};

exports.getReport = async (req, res) => {
  try {
    const {
      dateRange = "this_month",
      startDate = "",
      endDate = "",
      page = 1,
      limit = 10,
    } = req.query;

    const timeRange = getTimeRange(dateRange, startDate, endDate);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const query = {
      created_at: { $gte: timeRange.start, $lte: timeRange.end },
    };

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("products.product_id")
      .populate("employee_id", "fullname")
      .populate("customer_id", "name phone")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.total_price,
      0
    );
    const totalProducts = orders.reduce(
      (sum, order) =>
        sum +
        order.products.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const totalProfit = orders.reduce(
      (sum, order) => sum + order.total_price * 0.2,
      0
    );

    const statistics = {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalProfit,
    };

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / parsedLimit),
      totalItems: totalOrders,
      itemsPerPage: parsedLimit,
    };

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      createdAt: order.created_at,
      totalAmount: order.total_price,
      status: order.status,
      customer: {
        name: order.customer_id?.name || "N/A",
        phone: order.customer_id?.phone || "N/A",
      },
      employee: order.employee_id?.fullname || "N/A",
      products: order.products,
    }));

    return res.status(200).json({ success: true, data: { statistics, pagination, orders: formattedOrders } });
  } catch (error) {
    console.error("Lỗi lấy báo cáo, thống kê: ", error);
    return sendErrorResponse(res, 500, "Lỗi trong quá trình lấy báo cáo, thống kê. Vui lòng thử lại sau.");
  }
};


exports.filterOrder = async (req, res) => {
  try {
    const { timeline, startDate, endDate } = req.body;

    if (timeline === "custom" && (!startDate || !endDate)) {
      return sendErrorResponse(res, 400, "Vui lòng chọn khoảng thời gian.");
    }

    const { start, end } = getTimeRange(timeline, startDate, endDate);

    const query = { created_at: { $gte: start, $lte: end } };

    const orders = await Order.find(query)
      .populate("products.product_id")
      .lean();

    const totalAmount = orders.reduce(
      (acc, order) => acc + order.total_price,
      0
    );
    const totalOrders = orders.length;
    const totalProducts = orders.reduce(
      (acc, order) =>
        acc + order.products.reduce((sum, p) => sum + p.quantity, 0),
      0
    );

    let totalProfit = 0;
    if (req.user && req.user.isAdmin) { //Check if the user exists before accessing its properties
      totalProfit = orders.reduce((acc, order) => {
        return (
          acc +
          order.products.reduce((sum, product) => {
            const importPrice = product.product_id?.importPrice || 0;
            const profitPerProduct =
              (product.price - importPrice) * product.quantity;
            return sum + profitPerProduct;
          }, 0)
        );
      }, 0);
    }

    if (req.user && !req.user.isAdmin) {
      orders.forEach((order) => {
        order.products.forEach((product) => {
          if (product.product_id) {
            delete product.product_id.importPrice;
          }
        });
      });
    }

    const summary = {
      totalAmount,
      totalOrders,
      totalProducts,
      ...(req.user && req.user.isAdmin && { totalProfit }),
    };

    return res.status(200).json({ success: true, summary, orders });
  } catch (error) {
    console.error("Lỗi trong quá trình lọc dữ liệu: " + error);
    return sendErrorResponse(res, 500, "Lỗi trong quá trình lọc dữ liệu. Vui lòng thử lại sau.");
  }
}

exports.getOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId)
      .populate("products.product_id")
      .populate("customer_id")
      .populate("employee_id")
      .lean();

    if (!order) {
      return sendErrorResponse(res, 404, "Không tìm thấy đơn hàng.");
    }

    const formattedProducts = order.products.map((product) => ({
      barcode: product.product_id.barcode,
      name: product.product_id.name,
      image: product.product_id.images[0],
      quantity: product.quantity,
      price: product.price,
      total: product.price * product.quantity,
    }));

    const orderData = {
      _id: order._id,
      created_at: order.created_at,
      total_price: order.total_price,
      payment_info: order.payment_info,
      employee: {
        _id: order.employee_id._id,
        name: order.employee_id.fullname,
      },
      customer: {
        name: order.customer_id.name,
        phone: order.customer_id?.phone,
        address: order.customer_id?.address,
      },
      products: formattedProducts,
    };

    return res.status(200).json({ success: true, order: orderData });
  } catch (error) {
    console.error("Lỗi Lấy chi tiết đơn hàng: " + error);
    return sendErrorResponse(res, 500, "Lỗi trong quá trình lấy chi tiết đơn hàng. Vui lòng thử lại sau.");
  }
}

exports.getOrdersByUserPhone = async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return sendErrorResponse(res, 400, "Vui lòng cung cấp số điện thoại.");
  }

  try {
    const orders = await Order.find({ "customer_phone": phone }) // Modified query
      .populate("products.product_id")
      .populate("employee_id", "fullname")
      .populate("customer_id", "name phone") // Keep this for other data
      .sort({ created_at: -1 })
      .lean();

    if (!orders || orders.length === 0) {
      return sendErrorResponse(res, 404, "Không tìm thấy đơn hàng nào với số điện thoại này.");
    }

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      createdAt: order.created_at,
      totalAmount: order.total_price,  //Ensure this is correct
      status: order.status,
      customer: {
        name: order.customer_id?.name || "N/A", // Keep this in case you still want to access the name
        phone: order.customer_phone || "N/A", // Use customer_phone directly
      },
      employee: order.employee_id?.fullname || "N/A",
      products: order.products.map(product => ({ // Map Products for quantity
        name: product.product_id?.name || "N/A",
        quantity: product.quantity
      })),
    }));

    return res.status(200).json({ success: true, orders: formattedOrders });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng theo số điện thoại: ", error);
    return sendErrorResponse(res, 500, "Lỗi trong quá trình lấy đơn hàng. Vui lòng thử lại sau.");
  }
};
