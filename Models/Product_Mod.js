import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true }, // Stock Keeping Unit
  color: { type: String },
  size: { type: String },
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true }, // ✅ price tied to each variant
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    variants: {
      type: [variantSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    totalStock: { type: Number, default: 0 },
    // removed product-level price, minPrice, maxPrice
    featured: { type: Boolean, default: false },
    mainImage: { type: String }, // single main image
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
