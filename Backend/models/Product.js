const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  importPrice: { type: Number, required: true },
  retailPrice: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  quantity: {type: Number, required: true},
  description: { type: String },
  images: [{
    data: { type: String, required: true }, // base64 string
    contentType: { type: String, required: true }
  }],
  inStock: { type: Boolean, default: true },
}, { timestamps: true });

// Tự động cập nhật `inStock` dựa trên `quantity`
productSchema.pre("save", function (next) {
  this.inStock = this.quantity > 0; // Nếu số lượng > 0, `inStock` sẽ là true
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
