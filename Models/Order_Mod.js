import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variant: {
    sku: { type: String },
    color: { type: String },
    size: { type: String },
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Price per unit
});

const shippingSchema = new mongoose.Schema({
  country: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  phone: { type: String, required: true },
});


const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },

    // Order progress
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // Structured shipping info
    shipping: { type: shippingSchema, required: true },

    // Payment info
    paymentMethod: {
  type: String,
  enum: ["cash_on_delivery", "paystack"], 
  required: true,
},

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    // Optional notes
    orderNotes: { type: String },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
