const Product = require("../models/Product");
const { sendErrorResponse } = require("../middlewares/errorHandler");

//-----Lấy danh sách sản phẩm-----
exports.getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = '', sortField = 'name', sortOrder = 'asc', minPrice, maxPrice } = req.query;
        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);
        const skip = (parsedPage - 1) * parsedLimit;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (!isNaN(parseFloat(minPrice)) && !isNaN(parseFloat(maxPrice))) {
            query.retailPrice = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
        } else if (!isNaN(parseFloat(minPrice))) {
            query.retailPrice = { $gte: parseFloat(minPrice) };
        } else if (!isNaN(parseFloat(maxPrice))) {
            query.retailPrice = { $lte: parseFloat(maxPrice) };
        }

        let sort = {};
        sort[sortField === 'price' ? 'retailPrice' : sortField] = sortOrder === 'desc' ? -1 : 1;

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / parsedLimit);

        const products = await Product.find(query)
            .populate('category', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parsedLimit)
            .lean();

        const formattedProducts = products.map(product => ({
            _id: product._id,
            name: product.name,
            barcode: product.barcode,
            importPrice: product.importPrice,
            retailPrice: product.retailPrice,
            price: product.retailPrice,
            quantity: product.quantity,
            category: product.category,
            description: product.description,
            images: product.images,
            inStock: product.inStock
        }));

        return res.status(200).json({
            success: true,
            products: formattedProducts,
            currentPage: parsedPage,
            totalPages: totalPages,
            totalProducts: totalProducts
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'lấy danh sách sản phẩm', error);
    }
};

//-----Lấy sản phẩm theo barcode-----
exports.getProduct = async (req, res) => {
    try {
        const { barcode } = req.params;
        const product = await Product.findOne({ barcode }).populate("category", "name").lean();

        if (!product) {
            return sendErrorResponse(res, 404, "Không tìm thấy sản phẩm.");
        }

        return res.status(200).json({ success: true, product })
    } catch (error) {
        return sendErrorResponse(res, 500, 'lấy thông tin sản phẩm', error);
    }
};

//-----Tạo tự động barcode-----
async function generateBarcode() {
    try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const datePrefix = `${day}${month}${year}`;

        const lastProduct = await Product
            .findOne({ barcode: new RegExp(`^${datePrefix}`) })
            .sort({ barcode: -1 })
            .select("barcode")
            .lean();

        const nextCounter = lastProduct
            ? parseInt(lastProduct.barcode.slice(6), 10) + 1
            : 1;

        const barcode = `${datePrefix}${String(nextCounter).padStart(5, '0')}`;
        return barcode;
    } catch (error) {
        console.error("Lỗi tạo barcode: ", error);
        throw new Error("Không thể tạo barcode mới.");
    }
}

//-----Thêm sản phẩm mới-----
exports.createProduct = async (req, res) => {
    try {
        const { name, importPrice, retailPrice, category, quantity, description, images } = req.body;

        if (!name || !importPrice || !retailPrice || !category || !quantity || !description || !images) {
            return sendErrorResponse(res, 400, "Vui lòng điền đầy đủ các thông tin cần thiết.");
        }

        if (importPrice <= 0 || retailPrice <= 0) {
            return sendErrorResponse(res, 400, 'Giá tiền phải lớn hơn 0.');
        }

        if (quantity < 1) {
            return sendErrorResponse(res, 400, 'Số lượng phải lớn hơn hoặc bằng 1.');
        }

        if (!images || !Array.isArray(images) || images.length < 1 || images.length > 4) {
            return sendErrorResponse(res, 400, "Mỗi sản phẩm phải có từ 1 đến 4 ảnh.");
        }

        const barcode = await generateBarcode();

        const newProduct = new Product({
            barcode,
            name,
            importPrice,
            retailPrice,
            category,
            quantity,
            description,
            images
        });

        await newProduct.save();
        const populatedProduct = await Product.findById(newProduct._id).populate('category', 'name').lean();

        return res.status(201).json({
            success: true,
            message: `Tạo sản phẩm thành công.`,
            product: populatedProduct
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'tạo sản phẩm', error);
    }
};

//-----Cập nhật sản phẩm-----
exports.updateProduct = async (req, res) => {
    try {
        const { barcode } = req.params;
        const { name, importPrice, retailPrice, category, quantity, description, images } = req.body;

        if (!name || !importPrice || !retailPrice || !category || !quantity) {
            return sendErrorResponse(res, 400, "Vui lòng điền đầy đủ các thông tin cần thiết.");
        }

        if (importPrice <= 0 || retailPrice <= 0) {
            return sendErrorResponse(res, 400, 'Giá tiền phải lớn hơn 0.');
        }

        if (quantity < 0) {
            return sendErrorResponse(res, 400, 'Số lượng không thể nhỏ hơn 0.');
        }

        if (!images || !Array.isArray(images) || images.length < 1 || images.length > 4) {
            return sendErrorResponse(res, 400, "Mỗi sản phẩm phải có từ 1 đến 4 ảnh.");
        }

        const product = await Product.findOne({ barcode });
        if (!product) {
            return sendErrorResponse(res, 404, "Không tìm thấy sản phẩm.");
        }

        const updateData = {
            name,
            importPrice,
            retailPrice,
            category,
            quantity,
            description,
            images
        };

        await Product.findOneAndUpdate({ barcode }, updateData, { new: true }).lean();
        const updatedProduct = await Product.findOne({ barcode }).populate('category', 'name').lean();

        return res.status(200).json({ success: true, message: `Cập nhật sản phẩm thành công.`, product: updatedProduct });
    } catch (error) {
        return sendErrorResponse(res, 500, 'cập nhật sản phẩm', error);
    }
};

//-----Xóa sản phẩm-----
exports.deleteProduct = async (req, res) => {
    try {
        const { barcode } = req.params;

        const product = await Product.findOne({ barcode });
        if (!product) {
            return sendErrorResponse(res, 404, "Không tìm thấy sản phẩm.");
        }

        await product.deleteOne();

        return res.status(200).json({ success: true, message: "Xóa sản phẩm thành công." });
    } catch (error) {
        return sendErrorResponse(res, 500, 'xóa sản phẩm', error);
    }
};