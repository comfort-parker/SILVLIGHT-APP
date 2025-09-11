// models/Sale.js
import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  product: { type: String, required: true },
  amount: { type: Number, required: true },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Sale", saleSchema);
