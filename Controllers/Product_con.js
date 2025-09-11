import { Product } from "../Models/Product_Mod.js";

// Utility to calculate total stock
const calculateTotalStock = (variants) => {
  return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  console.log("Received body:", req.body);
  try {
    const {
      name,
      description,
      category,
      tags = "",
      variants = [],
      featured = false,
      mainImage = "",
    } = req.body || {};

    if (!name || !description || !category) {
      console.log("Missing required fields");
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Parse variants safely
    const parsedVariants =
      typeof variants === "string" ? JSON.parse(variants) : variants;

    // Ensure numbers are cast properly
    const normalizedVariants = parsedVariants.map((v) => ({
      ...v,
      stock: Number(v.stock) || 0,
      price: Number(v.price) || 0,
    }));

    // Parse tags
    const tagsArray = Array.isArray(tags)
      ? tags
      : tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);

    // ✅ calculate total stock
    const totalStock = calculateTotalStock(normalizedVariants);

    // Create new product
    const product = new Product({
      name,
      description,
      category,
      tags: tagsArray,
      variants: normalizedVariants,
      featured,
      mainImage,
      totalStock,
    });

    await product.save();
    console.log("✅ Product saved:", product);
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("❌ Error in createProduct:", error);
    res
      .status(500)
      .json({ message: "Failed to create product", error: error.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, category, tags, variants, featured, mainImage } =
      req.body;

    // Parse variants safely
    const parsedVariants =
      variants && typeof variants === "string"
        ? JSON.parse(variants)
        : variants || product.variants;

    // Ensure stock and price are numbers
    const normalizedVariants = parsedVariants.map((v) => ({
      ...v,
      stock: Number(v.stock) || 0,
      price: Number(v.price) || 0,
    }));

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.tags =
      tags && typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : tags || product.tags;
    product.featured = featured !== undefined ? featured : product.featured;
    product.variants = normalizedVariants;

    // Update main image if provided
    if (mainImage) {
      product.mainImage = mainImage;
    }

    // ✅ Recalculate total stock
    product.totalStock = calculateTotalStock(normalizedVariants);

    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// GET ALL PRODUCTS
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
};

// GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: error.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete product", error: error.message });
  }
};

// ADD STOCK TO A VARIANT
export const addStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;
    if (!variantId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid variantId or quantity" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    variant.stock += Number(quantity);

    product.totalStock = calculateTotalStock(product.variants);

    await product.save();
    res.json({ message: "Stock added successfully", product });
  } catch (error) {
    console.error("Error in addStock:", error);
    res
      .status(500)
      .json({ message: "Failed to add stock", error: error.message });
  }
};

// REDUCE STOCK OF A VARIANT
export const reduceStock = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;
    if (!variantId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid variantId or quantity" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    if (variant.stock < quantity) {
      return res
        .status(400)
        .json({ message: "Insufficient stock to reduce" });
    }

    variant.stock -= Number(quantity);

    product.totalStock = calculateTotalStock(product.variants);

    await product.save();
    res.json({ message: "Stock reduced successfully", product });
  } catch (error) {
    console.error("Error in reduceStock:", error);
    res
      .status(500)
      .json({ message: "Failed to reduce stock", error: error.message });
  }
};

// GET STOCK LEVELS OF A PRODUCT
export const getStockLevels = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const stockLevels = product.variants.map((v) => ({
      variantId: v._id,
      sku: v.sku,
      stock: v.stock,
      price: v.price, // ✅ show price too
    }));

    res.json({ productId: product._id, stockLevels });
  } catch (error) {
    console.error("Error in getStockLevels:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch stock levels", error: error.message });
  }
};
