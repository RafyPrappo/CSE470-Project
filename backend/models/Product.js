import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  retailPrice: {
    type: Number,
    required: [true, "Retail price is required"],
    min: [0, "Price cannot be negative"],
  },
  importCost: {
    type: Number,
    required: [true, "Import cost is required"],
    min: [0, "Import cost cannot be negative"],
  },
  stock: {
    type: Number,
    required: [true, "Stock quantity is required"],
    min: [0, "Stock cannot be negative"],
    default: 0,
  },
  category: {
    type: String,
    default: "uncategorized",
    enum: ["gadgets", "cases", "decor", "accessories", "uncategorized"],
  },
  image: {
    type: String,
    default: "",
  },
  outOfStockSince: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if product is out of stock for >24 hours
productSchema.virtual('isHidden').get(function() {
  if (!this.outOfStockSince) return false;
  const hoursSinceOutOfStock = (Date.now() - this.outOfStockSince) / (1000 * 60 * 60);
  return hoursSinceOutOfStock > 24;
});

// Virtual for product status
productSchema.virtual('status').get(function() {
  if (this.stock <= 0) return 'out-of-stock';
  if (this.stock < 5) return 'low-stock';
  return 'in-stock';
});

// Ensure virtuals are included in JSON responses
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;