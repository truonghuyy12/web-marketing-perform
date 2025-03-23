const cron = require("node-cron");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { transporter } = require("./mailConfig");
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Chức năng gửi Email đã khởi chạy.");

const getRecommendProduct = async (orders) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.log(
        "GOOGLE_API_KEY is not set in environment variables. Recommendation disabled."
      );
      return null;
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const products = await Product.find().select("name").lean();
    const productsList = products.map(product => product.name);

    if (!orders || orders.length === 0) {
      console.log("No order history available for recommendation.");
      return null;
    }

    // Extract product names from order history
    const productNames = orders.flatMap((order) =>
      order.products.map((product) => product.name)
    );

    if (productNames.length === 0) {
      console.log("No products found in order history.");
      return null;
    }

    const prompt = `Based on these purchased items: ${productNames.join(
      ", "
    )}, recommend a single similar product name in ${productsList} and provide a one-sentence reason why.  Do not include any introductory or concluding phrases. Return the product name and the reason in the format "Product Name - Reason".`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const [productName, reason] = responseText.split(" - ");

    if (!productName || !reason) {
      console.log("Could not parse product name and reason.");
      return null;
    }

    const trimmedProductName = productName.trim();

    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${trimmedProductName}$`, "i") },
    })
      .lean();
    console.log(product);
    if (!product) {
      console.log(
        `Recommended product "${trimmedProductName}" not found in database.`
      );
      return null;
    }

    return { product, reason: reason.trim() };
  } catch (error) {
    console.log("Lỗi lấy sản phẩm đề xuất: ", error);
    return null;
  }
};

const getNewProduct = async () => {
  try {
    const product = await Product.findOne().sort({ createdAt: -1 }).lean().exec();
    return product;
  } catch (error) {
    console.log("Lỗi lấy sản phẩm mới: ", error);
    return null;
  }
};

const sendMailProduct = async (email, product, recommendationReason = null) => {
  try {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quảng cáo sản phẩm</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }

        .container {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          width: 90%;
          max-width: 600px;
        }

        .header {
          background-color: #007bff;
          color: #fff;
          text-align: center;
          padding: 30px;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: 1px;
        }

        .product-details {
          padding: 30px;
        }

        .product-image {
          text-align: center;
          margin-bottom: 30px;
        }

        .product-image img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .product-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }

        .product-price {
          font-size: 20px;
          color: #007bff;
          margin-bottom: 15px;
        }

        .product-description {
          font-size: 16px;
          color: #555;
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .recommendation-reason {
          font-style: italic;
          color: #777;
          margin-bottom: 20px;
        }

        .cta-button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #28a745;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin-top: 20px;
          transition: background-color 0.3s ease;
        }

        .cta-button:hover {
          background-color: #218838;
        }

        .footer {
          background-color: #f0f0f0;
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quảng cáo sản phẩm</h1>
        </div>
        <div class="product-details">
          <div class="product-name">${product.name}</div>
          <div class="product-price">${product.retailPrice}đ</div>
          <div class="product-description">${product.description}</div>
          ${recommendationReason
        ? `<div class="recommendation-reason">Because you might like it: ${recommendationReason}</div>`
        : ""
      }
          <div style="text-align: center;">
            <a href="your-website/product/${product._id
      }" class="cta-button">Mua ngay</a>
          </div>
        </div>
        <div class="footer">
          © 2024 Your Store. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      to: email,
      subject: "Quảng cáo sản phẩm!",
      html: html,
    });
  } catch (error) {
    console.error(`Lỗi gửi email:`, error);
  }
};

const cronSchedule = '* * * * *'; // Runs every minute for testing

//-----Quảng cáo sản phẩm mới-----
cron.schedule('*/5 * * * *', async () => {
  try {
    const users = await User.find({ role: "User" }).select('email').lean();
    const product = await getNewProduct();
    const reason = "Sản phẩm mới đã được nhập hàng tại cửa hàng của chúng tôi.";
    for (const user of users) {
      if (product && user) {
        await sendMailProduct(user.email, product, reason);
      }
    }
  } catch (error) {
    console.log("Lỗi cron: ", error);
  }
});

//-----Quảng cáo sản phẩm đề xuất-----
cron.schedule(cronSchedule, async () => {
  try {
    const users = await User.find({ role: "User" }).lean();

    for (const user of users) {
      let recommendedProductInfo = null;

      const orders = await Order.find({ customer_phone: user.phone })
        .populate('products.product_id')
        .lean();

      if (orders && orders.length > 0) {
        recommendedProductInfo = await getRecommendProduct(orders);
      }

      let product = recommendedProductInfo;
      // console.log(product);

      const reason = null;

      if (product) {
        await sendMailProduct(user.email, product, reason);
      }
    }
  } catch (error) {
    console.log("Lỗi cron: ", error);
  }
});