import express from "express";
import {upload} from "../Middleware/Uploads.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct, 
  addStock,
  reduceStock,
  getStockLevels
} from "../Controllers/Product_con.js";
 // renamed from parser to upload for clarity
import { protect, adminOnly } from "../Middleware/auth.js";

const productRoute = express.Router();


// Admin routes
productRoute.post("/", protect, adminOnly, createProduct);
productRoute.put("/:id", protect, adminOnly, updateProduct);

productRoute.delete("/:id", protect, adminOnly, deleteProduct);
productRoute.put("/:id/add-stock", protect, adminOnly, addStock);
productRoute.put("/:id/reduce-stock", protect, adminOnly, reduceStock);
productRoute.get("/stock-levels/:productId", protect, adminOnly, getStockLevels); // added :productId param

// Public routes
productRoute.get("/", getProducts);
productRoute.get("/:id", getProductById);

export default productRoute;
