// src/Controllers/Order_Con.js
import { Order } from "../Models/Order_Mod.js";
import { Product } from "../Models/Product_Mod.js";
import { Notification } from "../Models/Note_Mod.js";

// ===============================
// Create Order (fixed to use variantId)
// ===============================
export const createOrder = async (req, res) => {
  try {
    const { items, shipping, paymentMethod, orderNotes } = req.body;
    const userId = req.user._id;

    let totalAmount = 0;

    // Check stock + calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: "Product not found" });

      // ✅ Find variant by ID instead of SKU
      const variant = product.variants.id(item.variantId);
      if (!variant) return res.status(404).json({ message: "Variant not found" });

      // Check stock
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name} (Variant ID: ${variant._id})`,
        });
      }

      // Deduct stock
      variant.stock -= item.quantity;

      // Update product stock & price ranges
      product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      product.minPrice = Math.min(...product.variants.map(v => v.price));
      product.maxPrice = Math.max(...product.variants.map(v => v.price));

      await product.save();

      // Add to order total
      totalAmount += variant.price * item.quantity;
    }

    // Create new order
    const order = new Order({
      user: userId,
      items,
      totalAmount,
      shipping,
      paymentMethod,
      orderNotes,
    });

    await order.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ===============================
// Get Orders (Admin)
// ===============================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email")
      .populate("items.product", "name mainImage");
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ===============================
// Get Orders (User)
// ===============================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId })
      .populate("items.product", "name mainImage");
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ===============================
// Update Order Status
// ===============================
export const updateOrderStatus = async (req, res) => {
  try {
    console.log("Update order status body:", req.body); // 👈 log incoming data

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Delivered" && status === "Cancelled") {
      return res.status(400).json({ message: "Delivered orders cannot be cancelled" });
    }

    order.status = status;
    await order.save();

    res.json({ message: `Order ${status.toLowerCase()} successfully`, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// ===============================
// Delete Order
// ===============================
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};

// ===============================
// Cancel Order (User)
// ===============================
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;

    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      if (!product) continue;

      const variant = product.variants.find(v => v.sku === item.variant.sku);
      if (variant) {
        variant.stock += item.quantity;
      }

      product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      product.minPrice = Math.min(...product.variants.map(v => v.price));
      product.maxPrice = Math.max(...product.variants.map(v => v.price));

      await product.save();
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get Single Order
// ===============================
export const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("user", "firstName lastName email")
      .populate("items.product", "name mainImage variants");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Restrict access
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order", error: error.message });
  }
};

// ===============================
// Get Order & Sales Stats
// ===============================
export const getOrderStats = async (req, res) => {
  try {
    const { start, end } = req.query;

    let match = { status: { $ne: "Cancelled" } };
    if (start && end) {
      match.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const totalOrders = await Order.countDocuments(match);

    const revenueAgg = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const itemsSoldAgg = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      { $group: { _id: null, totalItemsSold: { $sum: "$items.quantity" } } },
    ]);
    const totalItemsSold = itemsSoldAgg.length > 0 ? itemsSoldAgg[0].totalItemsSold : 0;

    const statusAgg = await Order.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const ordersByStatus = statusAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const monthlySalesAgg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlySales = monthlySalesAgg.map(item => ({
      month: months[item._id - 1],
      revenue: item.revenue,
      orders: item.orders,
    }));

    const productSalesAgg = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantitySold: { $sum: "$items.quantity" },
        },
      },
    ]);

    const productSales = await Product.populate(productSalesAgg, {
      path: "_id",
      select: "name",
    });

    const formattedProductSales = productSales.map(item => ({
      productId: item._id._id,
      productName: item._id.name,
      totalQuantitySold: item.totalQuantitySold,
    }));

    res.json({
      totalOrders,
      totalRevenue,
      totalItemsSold,
      ordersByStatus,
      monthlySales,
      productSales: formattedProductSales,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch order stats" });
  }
};
