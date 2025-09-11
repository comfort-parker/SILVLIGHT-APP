// routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getUserOrders,
  getSingleOrder,
  getOrderStats
} from "../Controllers/Order_Con.js";
import { protect, adminOnly } from "../Middleware/auth.js";

const orderRoute = express.Router();

// USER ROUTES 

// Create new order (user checkout)
orderRoute.post("/", protect, createOrder);

// Get all orders of a logged-in user
orderRoute.get("/my-orders", protect, getUserOrders);

// Cancel an order (only if pending/processing)
orderRoute.put("/:id/cancel", protect, cancelOrder);

//  ADMIN ROUTES

// Get all orders (admin only)
orderRoute.get("/", protect, adminOnly, getAllOrders);

// Update order status (e.g. Processing → Shipped → Delivered)
orderRoute.patch("/:id/status", protect, adminOnly, updateOrderStatus);

orderRoute.get("/stats", getOrderStats);

orderRoute.get("/:id", protect, getSingleOrder);


export default orderRoute;
