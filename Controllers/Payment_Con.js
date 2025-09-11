import { Payment } from "../Models/Payment_Mod.js";
import dotenv from "dotenv";
import { Order } from "../Models/Order_Mod.js";
import axios from "axios";
import crypto from "crypto"; 

dotenv.config();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// 1. Initiate Payment
export const initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const userId = req.user._id;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Create Payment record
    let payment = new Payment({
      order: order._id,
      user: userId,
      method,
      amount: order.totalAmount,
      status: "pending",
    });

    if (method === "paystack") {
      // Call Paystack API
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: req.user.email,
          amount: order.totalAmount * 100, // Paystack works in kobo
          metadata: {
            orderId: order._id,
            userId: req.user._id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      payment.transactionId = response.data.data.reference;
      await payment.save();

      return res.json({
        message: "Paystack payment initiated",
        authorizationUrl: response.data.data.authorization_url,
      });
    }

    if (method === "cash_on_delivery") {
      payment.status = "pending"; // COD stays pending until delivery confirmation
      await payment.save();

      return res.json({ message: "Cash on Delivery chosen", payment });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Payment initiation failed" });
  }
};

// 2. Manual Verification (Fallback)
export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.data.status === "success") {
      const payment = await Payment.findOneAndUpdate(
        { transactionId: reference },
        { status: "completed" },
        { new: true }
      );

      if (payment) {
        await Order.findByIdAndUpdate(payment.order, {
          status: "paid",
          paymentStatus: "Paid",
          paymentMethod: "Paystack",
        });
      }

      return res.json({ message: "Payment verified successfully", payment });
    } else {
      return res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

// 3. Paystack Webhook (Auto)
export const paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    // Validate Paystack signature
    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // Verify transaction from Paystack server
      const verifyResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secret}`,
          },
        }
      );

      const { status, amount, metadata } = verifyResponse.data.data;

      if (status === "success") {
        // Update payment & order
        const payment = await Payment.findOneAndUpdate(
          { transactionId: reference },
          { status: "completed" },
          { new: true }
        );

        const orderId = metadata.orderId;
        const order = await Order.findById(orderId);

        if (order) {
          order.paymentStatus = "Paid";
          order.paymentMethod = "Paystack";
          order.totalAmount = amount / 100; // convert from kobo
          await order.save();
        }
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).send("Server error");
  }

  await Notification.create({
  user: order.user,
  title: "Payment Successful",
  message: `Your payment for order #${order._id} has been confirmed.`,
  type: "payment",
});

};

// 4. User payments
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const payments = await Payment.find({ user: userId }).populate("order");
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// 5. Admin: All payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "firstName lastName email")
      .populate("order");
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};
