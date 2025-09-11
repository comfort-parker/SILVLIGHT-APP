import express from "express";
import { addToCart, removeFromCart, getCart, clearCart, updateCartItem } from "../Controllers/Cart_Con.js";
import { protect } from "../Middleware/auth.js";

const cartRoute = express.Router();

// Add product to cart
cartRoute.post("/add", protect, addToCart);

// Remove product from cart
cartRoute.delete("/remove/:productId/:variantId", protect, removeFromCart);


// Get user cart
cartRoute.get("/", protect, getCart);

// Clear cart
cartRoute.delete("/clear", protect, clearCart);

cartRoute.put("/update", protect, updateCartItem);

export default cartRoute;
