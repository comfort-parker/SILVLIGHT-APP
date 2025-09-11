// routes/paymentRoutes.js
import express from "express";
import { 
  initiatePayment, 
  verifyPaystackPayment, 
  paystackWebhook, 
  getUserPayments,
  getAllPayments
} from "../Controllers/Payment_Con.js";
import { protect, adminOnly } from "../Middleware/auth.js";

const paymentRoute = express.Router();

// Initialize Paystack Payment
paymentRoute.post("/paystack/initialize", protect, initiatePayment);

// Verify Paystack Payment (in case webhook is delayed or missed)
paymentRoute.get("/paystack/verify/:reference", protect, verifyPaystackPayment);

// Paystack Webhook (automatic verification)
paymentRoute.post("/paystack/webhook", paystackWebhook);

// Cash on Delivery (just update payment status as pending)
paymentRoute.get("/userpay", protect, getUserPayments);
// Cash on Delivery (just update payment status as pending)
paymentRoute.get("/allpay", protect, getAllPayments);

export default paymentRoute;
